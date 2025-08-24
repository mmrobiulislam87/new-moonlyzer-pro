import React, { useState, useEffect, useMemo } from 'react';
import { Map as MapIcon, Info, Loader2, AlertTriangle } from 'lucide-react';
import { useVoIPContext } from '../contexts/VoIPContext';
import GoogleMapView from './GoogleMapView';
import { MapMarkerData } from '../types';

interface IPLocationInfo extends MapMarkerData {
  city: string;
  country: string;
  isp: string;
  callCount: number;
  associatedNumbers: Set<string>;
}

const VoIPGeoAnalysisView: React.FC = () => {
    const { allVoIPRecords } = useVoIPContext();
    const [ipLocations, setIpLocations] = useState<IPLocationInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uniqueIPsWithData = useMemo(() => {
        const ipDataMap = new Map<string, { callCount: number; associatedNumbers: Set<string> }>();
        allVoIPRecords.forEach(record => {
            const ip = record.ipAddress;
            if (!ip) return;
            const entry = ipDataMap.get(ip) || { callCount: 0, associatedNumbers: new Set() };
            entry.callCount++;
            entry.associatedNumbers.add(record.sourcePhoneNumber);
            entry.associatedNumbers.add(record.destinationPhoneNumber);
            ipDataMap.set(ip, entry);
        });
        return ipDataMap;
    }, [allVoIPRecords]);
    
    useEffect(() => {
        const fetchAllIPLocations = async () => {
            if (uniqueIPsWithData.size === 0) {
                setIpLocations([]);
                return;
            };
            
            setIsLoading(true);
            setError(null);
            const newLocations: IPLocationInfo[] = [];
            const ipsToFetch = Array.from(uniqueIPsWithData.keys());

            for (const ip of ipsToFetch) {
                try {
                    // Using the production-ready free endpoint, not the demo one
                    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,city,lat,lon,isp`);
                    if (!response.ok) {
                         // Don't throw for client-side errors like 4xx, just log them
                        if (response.status >= 400 && response.status < 500) {
                            console.warn(`Client error for IP ${ip}: status ${response.status}`);
                            setError(prev => prev ? `${prev}, ${ip}` : `Failed to fetch location for some IPs (e.g., ${ip})`);
                            continue; // Skip to next IP
                        }
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    if (data.status === 'success') {
                        const ipData = uniqueIPsWithData.get(ip)!;
                        newLocations.push({
                            id: ip,
                            position: { lat: data.lat, lng: data.lon },
                            title: `IP: ${ip}`,
                            infoContent: `<b>IP:</b> ${ip}<br/><b>Location:</b> ${data.city}, ${data.country}<br/><b>ISP:</b> ${data.isp}<br/><b>Calls:</b> ${ipData.callCount}<br/><b>Numbers:</b> ${ipData.associatedNumbers.size}`,
                            city: data.city, country: data.country, isp: data.isp,
                            callCount: ipData.callCount,
                            associatedNumbers: ipData.associatedNumbers,
                        });
                    } else {
                        console.warn(`Could not geolocate IP ${ip}: ${data.message}`);
                    }
                } catch (e: any) {
                    console.error(`Error fetching location for IP ${ip}:`, e);
                    setError(prev => prev ? `${prev}, ${ip}` : `Failed to fetch location for IPs: ${ip}`);
                }
                // Delay to respect API rate limits (free tier is 45/min, so >1333ms is safe)
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            setIpLocations(newLocations);
            setIsLoading(false);
        };
        fetchAllIPLocations();
    }, [uniqueIPsWithData]);

    if (allVoIPRecords.length === 0) {
        return (
             <div className="p-6 bg-info-lighter border border-info-light rounded-lg text-center text-info-dark flex flex-col items-center justify-center min-h-[200px] shadow-md">
                <Info size={28} className="mb-2" />
                <p className="font-medium">No VoIP data available for geospatial analysis. Please upload VoIP CDR files.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
             <div className="p-4 bg-surface border border-neutral-light rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-textPrimary flex items-center">
                    <MapIcon size={22} className="mr-2 text-indigo-500"/> VoIP Geospatial View
                </h2>
                <p className="text-sm text-textSecondary">Geolocated IP addresses from call records. Note: IP geolocation is an approximation. Rate limits are applied to the public API.</p>
            </div>
             {error && <div className="p-3 bg-danger-lighter text-danger-darker rounded-lg border border-danger-light">{error}</div>}
             {isLoading && <div className="flex justify-center items-center py-4"><Loader2 className="animate-spin h-6 w-6 mr-2"/> Fetching IP locations... This may take a while due to rate limiting.</div>}
            
            <div className="h-[600px] bg-neutral-lightest rounded-xl shadow-lg border border-neutral-light overflow-hidden">
                <GoogleMapView 
                    center={{ lat: 23.8103, lng: 90.4125 }} // Default to Dhaka
                    zoom={6}
                    markers={ipLocations}
                />
            </div>
        </div>
    );
};

export default VoIPGeoAnalysisView;