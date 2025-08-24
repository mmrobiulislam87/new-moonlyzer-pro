import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Route, Search, User, CalendarDays, Clock, MapPin as MapPinIcon, Info, AlertTriangle, Loader2, Download, ListFilter, ChevronUp, ChevronDown, Eye, X, SmartphoneNfc, TowerControl as TowerControlIcon, FileText as FileTextIcon } from 'lucide-react';
import { useLACContext } from '../contexts/LACContext';
import { LACRecord } from '../types';
import { formatDate, parseDateTime, formatDateFromTimestamp, formatDurationFromSeconds } from '../utils/cdrUtils';
import { downloadCSV } from '../utils/downloadUtils';
import GoogleMapView from './GoogleMapView'; 
import { MapMarkerData, MapPathData } from '../types';

const ROWS_PER_PAGE = 10;
const MODAL_ROWS_PER_PAGE = 10;

interface TowerVisit {
  sequence: number;
  lacCellId: string;
  arrivalTime: Date;
  departureTime: Date;
  durationMinutes: number;
  usageTypes: string[];
  recordCount: number;
  sourceFiles: string[];
  records: LACRecord[];
  mapMarker?: MapMarkerData;
  address?: string;
}

const LACTowerTravelPatternView: React.FC = () => {
  const { allLACRecords, getUniqueLACValues, isLoading: contextIsLoading, uploadedLACFiles } = useLACContext();

  const [selectedMsisdn, setSelectedMsisdn] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ 
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  const [travelPath, setTravelPath] = useState<TowerVisit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const geocodeCacheRef = useRef<Map<string, google.maps.LatLngLiteral | null>>(new Map());

  const uniqueMSISDNs = useMemo(() => getUniqueLACValues('MSISDN').filter(id => id && id.trim() !== ''), [getUniqueLACValues]);
  
  useEffect(() => {
    if (window.google && window.google.maps && window.googleMapsApiLoaded && !geocoder) {
      setGeocoder(new window.google.maps.Geocoder());
    }
  }, []);

  const geocodeAddress = useCallback(async (address: string): Promise<google.maps.LatLngLiteral | null> => {
    if (!address || address.trim() === '' || address.toLowerCase() === 'n/a' || !geocoder) {
        return null;
    }
    if (geocodeCacheRef.current.has(address)) {
        return geocodeCacheRef.current.get(address) || null;
    }

    return new Promise((resolve) => {
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const location = {
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng(),
                };
                geocodeCacheRef.current.set(address, location);
                resolve(location);
            } else {
                console.warn(`Geocoding failed for address "${address}": ${status}`);
                geocodeCacheRef.current.set(address, null);
                resolve(null);
            }
        });
    });
  }, [geocoder]);


  const handleTrackMovement = useCallback(async () => {
    setErrorMsg(null);
    setIsLoading(true);
    setTravelPath([]);

    const targetMSISDN = selectedMsisdn;
    if (!targetMSISDN) {
      setErrorMsg("MSISDN is required.");
      setIsLoading(false);
      return;
    }

    try {
      const sDateTime = parseDateTime(`${dateRange.start}T00:00:00`);
      const eDateTime = parseDateTime(`${dateRange.end}T23:59:59`);

      const filteredRecords = allLACRecords
        .filter(r => r.MSISDN === targetMSISDN)
        .map(r => ({ ...r, parsedDate: parseDateTime(r.DATE_TIME) }))
        .filter(r => r.parsedDate && r.parsedDate >= sDateTime! && r.parsedDate <= eDateTime! && r.LAC && r.CELL_ID)
        .sort((a, b) => a.parsedDate!.getTime() - b.parsedDate!.getTime());

      if (filteredRecords.length === 0) {
        setErrorMsg("No records found for this MSISDN in the selected timeframe.");
        setIsLoading(false);
        return;
      }

      const path: Omit<TowerVisit, 'mapMarker'>[] = [];
      let sequenceCounter = 0;
      let currentVisitRecords: LACRecord[] = [];

      for (let i = 0; i < filteredRecords.length; i++) {
        const record = filteredRecords[i];
        currentVisitRecords.push(record);
        const isLastRecord = i === filteredRecords.length - 1;
        const nextRecord = isLastRecord ? null : filteredRecords[i + 1];
        const currentLacCell = `${record.LAC}-${record.CELL_ID}`;
        const nextLacCell = nextRecord ? `${nextRecord.LAC}-${nextRecord.CELL_ID}` : null;

        if (isLastRecord || currentLacCell !== nextLacCell) {
          sequenceCounter++;
          const firstRecordOfVisit = currentVisitRecords[0];
          const lastRecordOfVisit = currentVisitRecords[currentVisitRecords.length - 1];
          const arrivalTime = parseDateTime(firstRecordOfVisit.DATE_TIME)!;
          const departureTime = parseDateTime(lastRecordOfVisit.DATE_TIME)!;
          const durationMs = departureTime.getTime() - arrivalTime.getTime();
          
          path.push({
            sequence: sequenceCounter, lacCellId: currentLacCell, arrivalTime, departureTime,
            durationMinutes: Math.max(0, Math.round(durationMs / (1000 * 60))),
            usageTypes: Array.from(new Set(currentVisitRecords.map(r => r.USAGE_TYPE || 'Unknown'))),
            recordCount: currentVisitRecords.length,
            sourceFiles: Array.from(new Set(currentVisitRecords.map(r => r.fileName))),
            records: [...currentVisitRecords],
            address: firstRecordOfVisit.ADDRESS || undefined,
          });
          currentVisitRecords = [];
        }
      }
      
      const geocodedPath = await Promise.all(path.map(async (visit) => {
          let coords = visit.records[0].latitude && visit.records[0].longitude ? { lat: visit.records[0].latitude, lng: visit.records[0].longitude } : null;
          if (!coords && visit.address) {
              coords = await geocodeAddress(visit.address);
          }
          let marker: MapMarkerData | undefined = undefined;
          if(coords) {
              marker = {
                  id: `visit-${visit.sequence}`, position: coords, title: `${visit.sequence}. ${visit.lacCellId}`,
                  infoContent: `<b>Seq:</b> ${visit.sequence}<br/><b>Tower:</b> ${visit.lacCellId}<br/><b>Arrival:</b> ${formatDate(visit.arrivalTime.toISOString())}`
              };
          }
          return { ...visit, mapMarker: marker };
      }));
      setTravelPath(geocodedPath);
      if (path.length === 0) setErrorMsg("No valid tower visits found after processing.");
      
    } catch (e) {
      setErrorMsg("An error occurred during movement tracking.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMsisdn, dateRange, allLACRecords, geocodeAddress]);

  const mapDataForPath = useMemo((): { markers: MapMarkerData[], path: MapPathData | null } => {
    const markers: MapMarkerData[] = [];
    const pathCoordinates: google.maps.LatLngLiteral[] = [];
    travelPath.forEach(visit => {
        if (visit.mapMarker) {
            markers.push(visit.mapMarker);
            pathCoordinates.push(visit.mapMarker.position);
        }
    });
    return { markers, path: pathCoordinates.length > 1 ? { id: 'travelPath', coordinates: pathCoordinates } : null };
  }, [travelPath]);

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 bg-surface border border-neutral-light rounded-xl shadow-xl">
        <div className="flex items-center text-xl sm:text-2xl font-semibold text-textPrimary mb-1">
          <Route size={24} className="mr-2.5 text-primary" /> Tower Travel Pattern Tracker
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
                <label htmlFor="msisdnSelect" className="block text-xs font-medium text-textSecondary mb-1">Select MSISDN:</label>
                <select id="msisdnSelect" value={selectedMsisdn || ''} onChange={e => setSelectedMsisdn(e.target.value || null)} disabled={uniqueMSISDNs.length === 0 || isLoading} className="w-full p-2.5 border rounded-lg text-sm shadow-sm">
                    <option value="">-- Select MSISDN --</option>
                    {uniqueMSISDNs.map(msisdn => <option key={msisdn} value={msisdn}>{msisdn}</option>)}
                </select>
            </div>
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="startDatePath" className="block text-xs font-medium text-textSecondary mb-1">Start Date:</label>
                    <input type="date" id="startDatePath" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="w-full p-2.5 border rounded-lg text-sm shadow-sm accent-primary"/>
                </div>
                <div>
                    <label htmlFor="endDatePath" className="block text-xs font-medium text-textSecondary mb-1">End Date:</label>
                    <input type="date" id="endDatePath" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="w-full p-2.5 border rounded-lg text-sm shadow-sm accent-primary"/>
                </div>
            </div>
            <button onClick={handleTrackMovement} disabled={isLoading || !selectedMsisdn} className="w-full px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium shadow-md flex items-center justify-center">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Search size={18} className="mr-2"/>}
                Track Movement
            </button>
        </div>
        {errorMsg && <p className="mt-2 text-xs text-danger-dark">{errorMsg}</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1 bg-surface p-3 sm:p-4 rounded-xl shadow-xl border border-neutral-light">
          <h3 className="text-base font-semibold text-textPrimary mb-2">Travel Path ({travelPath.length} stops)</h3>
          {travelPath.length > 0 ? (
            <div className="overflow-y-auto max-h-[550px] scrollbar-thin">
              <ol className="relative border-l border-neutral-light ml-2">
                {travelPath.map((visit, index) => (
                  <li key={visit.sequence} className="mb-4 ml-4">
                    <div className="absolute w-3 h-3 bg-neutral-DEFAULT rounded-full mt-1.5 -left-1.5 border border-white"></div>
                    <time className="mb-1 text-xs font-normal leading-none text-textSecondary">{formatDate(visit.arrivalTime.toISOString())}</time>
                    <h4 className="text-sm font-semibold text-textPrimary">{visit.lacCellId}</h4>
                    <p className="text-xs text-textSecondary truncate" title={visit.address}>{visit.address || 'Address not available'}</p>
                    <p className="text-xs text-textSecondary">Duration: {formatDurationFromSeconds(visit.durationMinutes * 60)} ({visit.recordCount} records)</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="text-center text-textSecondary p-4">{isLoading ? 'Analyzing...' : 'No travel path to display. Run an analysis.'}</div>
          )}
        </div>
        <div className="lg:col-span-1 h-[600px] bg-neutral-lightest rounded-xl shadow-lg border border-neutral-light overflow-hidden">
          <GoogleMapView
            center={mapDataForPath.markers.length > 0 ? mapDataForPath.markers[0].position : { lat: 23.8103, lng: 90.4125 }}
            zoom={mapDataForPath.markers.length > 0 ? 12 : 6}
            markers={mapDataForPath.markers}
            paths={mapDataForPath.path ? [mapDataForPath.path] : []}
          />
        </div>
      </div>
    </div>
  );
};
export default LACTowerTravelPatternView;