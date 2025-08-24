
import React, { useState, useCallback, useMemo } from 'react';
import { History, AlertTriangle, Loader2, Search, CalendarDays, CheckSquare, Square, Database, MessageSquare, Landmark, TowerControl, Globe, PhoneCall, Settings2, Info, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { useCDRContext } from '../contexts/CDRContext';
import { useSMSContext } from '../contexts/SMSContext';
import { useNagadContext } from '../contexts/NagadContext';
import { useBkashContext } from '../contexts/BkashContext';
import { useLACContext } from '../contexts/LACContext';
import { useIPDRContext } from '../contexts/IPDRContext';
import { useRoketContext } from '../contexts/RoketContext';
import { useVoIPContext } from '../contexts/VoIPContext';
import { UnifiedEvent, CDRRecord, SMSRecord, NagadRecord, BkashRecord, LACRecord, IPDRRecord, RoketRecord, VoIPRecord } from '../types';
import { parseDateTime, formatDate, isAnyCall, isAnySMS } from '../utils/cdrUtils';

const DATA_SOURCES = [
  { id: 'cdr', label: 'CDR (Calls & SMS)', icon: <Database size={16} /> },
  { id: 'sms', label: 'SMS (Dedicated)', icon: <MessageSquare size={16} /> },
  { id: 'nagad', label: 'Nagad', icon: <Landmark size={16} /> },
  { id: 'bkash', label: 'bKash', icon: <Landmark size={16} /> },
  { id: 'roket', label: 'Roket', icon: <Landmark size={16} /> },
  { id: 'lac', label: 'LAC/Tower Records', icon: <TowerControl size={16} /> },
  { id: 'ipdr', label: 'IPDR Sessions', icon: <Globe size={16} /> },
  { id: 'voip', label: 'VoIP Calls', icon: <PhoneCall size={16} /> },
];

const UnifiedActivityTimelineView: React.FC = () => {
  const [identifierType, setIdentifierType] = useState<'MSISDN' | 'IMEI'>('MSISDN');
  const [identifierValue, setIdentifierValue] = useState('');
  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>(['cdr', 'sms', 'nagad', 'bkash', 'lac', 'roket', 'ipdr', 'voip']);
  
  const [timelineEvents, setTimelineEvents] = useState<UnifiedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { allRecords: allCDRRecords } = useCDRContext();
  const { allSMSRecords } = useSMSContext();
  const { allNagadRecords } = useNagadContext();
  const { allBkashRecords } = useBkashContext();
  const { allRoketRecords } = useRoketContext();
  const { allLACRecords } = useLACContext();
  const { allIPDRRecords } = useIPDRContext();
  const { allVoIPRecords } = useVoIPContext();

  const handleDataSourceToggle = (sourceId: string) => {
    setSelectedDataSources(prev => prev.includes(sourceId) ? prev.filter(id => id !== sourceId) : [...prev, sourceId]);
  };

  const generateTimeline = useCallback(() => {
    if (!identifierValue.trim()) {
      setError("Please enter an MSISDN or IMEI.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setTimelineEvents([]);

    const sDate = parseDateTime(startDate + "T00:00:00");
    const eDate = parseDateTime(endDate + "T23:59:59");
    if (!sDate || !eDate || sDate > eDate) {
      setError("Invalid date range.");
      setIsLoading(false);
      return;
    }

    let allEvents: UnifiedEvent[] = [];
    const id = identifierValue.trim();

    // Process each data source
    if (selectedDataSources.includes('cdr')) {
      allCDRRecords.forEach(r => {
        const recordDate = parseDateTime(r.START_DTTIME);
        if (recordDate && recordDate >= sDate && recordDate <= eDate) {
          if ((identifierType === 'MSISDN' && (r.APARTY === id || r.BPARTY === id)) || (identifierType === 'IMEI' && r.IMEI === id)) {
            const isOutgoing = r.APARTY === id;
            if (isAnyCall(r.USAGE_TYPE)) {
              allEvents.push({ id: `cdr-call-${r.id}`, timestamp: recordDate, type: 'CDR_CALL', icon: isOutgoing ? <PhoneOutgoing size={16} className="text-red-500"/> : <PhoneIncoming size={16} className="text-green-500"/>, title: `${isOutgoing ? 'Call to' : 'Call from'} ${isOutgoing ? r.BPARTY : r.APARTY}`, details: { Duration: `${r.CALL_DURATION}s`, Tower: `${r.LACSTARTA}-${r.CISTARTA}` }, originalRecord: r });
            } else if (isAnySMS(r.USAGE_TYPE)) {
              allEvents.push({ id: `cdr-sms-${r.id}`, timestamp: recordDate, type: 'CDR_SMS', icon: <MessageSquare size={16} className={isOutgoing ? "text-blue-500" : "text-purple-500"}/>, title: `${isOutgoing ? 'SMS to' : 'SMS from'} ${isOutgoing ? r.BPARTY : r.APARTY}`, details: { Tower: `${r.LACSTARTA}-${r.CISTARTA}` }, originalRecord: r });
            }
          }
        }
      });
    }

    if (identifierType === 'MSISDN' && selectedDataSources.includes('sms')) {
      allSMSRecords.forEach(r => {
        const recordDate = parseDateTime(r.Timestamp);
        if (recordDate && recordDate >= sDate && recordDate <= eDate && (r.Initiator === id || r.Recipient === id)) {
           const isOutgoing = r.Initiator === id;
           allEvents.push({ id: `sms-${r.id}`, timestamp: recordDate, type: 'SMS_MESSAGE', icon: <MessageSquare size={16} className={isOutgoing ? "text-blue-500" : "text-purple-500"}/>, title: `${isOutgoing ? 'Sent SMS to' : 'Received SMS from'} ${isOutgoing ? r.Recipient : r.Initiator}`, details: { Content: r.Content.substring(0, 30) + '...' }, originalRecord: r });
        }
      });
    }
    
    if (identifierType === 'MSISDN' && selectedDataSources.includes('nagad')) {
      allNagadRecords.forEach(r => {
        const recordDate = parseDateTime(r.TXN_DATE_TIME);
        if (recordDate && recordDate >= sDate && recordDate <= eDate && (r.STATEMENT_FOR_ACC === id || r.TXN_WITH_ACC === id)) {
          const isDebit = r.STATEMENT_FOR_ACC === id && r.TXN_TYPE_DR_CR === 'DEBIT';
          const isCredit = r.STATEMENT_FOR_ACC === id && r.TXN_TYPE_DR_CR === 'CREDIT';
          if(isDebit || isCredit) {
             allEvents.push({ id: `nagad-${r.TXN_ID}`, timestamp: recordDate, type: 'NAGAD_TXN', icon: <Landmark size={16} className={isDebit ? "text-red-600" : "text-green-600"}/>, title: `Nagad: ${r.TXN_TYPE} ${isDebit ? 'to' : 'from'} ${r.TXN_WITH_ACC}`, details: { Amount: `BDT ${r.TXN_AMT.toFixed(2)}` }, originalRecord: r });
          }
        }
      });
    }
    
    if (identifierType === 'MSISDN' && selectedDataSources.includes('bkash')) {
      allBkashRecords.forEach(r => {
        const recordDate = parseDateTime(r.transactionDate);
        if (recordDate && recordDate >= sDate && recordDate <= eDate && (r.sender === id || r.receiver === id)) {
          const isDebit = r.sender === id;
          allEvents.push({ id: `bkash-${r.trxId}`, timestamp: recordDate, type: 'BKASH_TXN', icon: <Landmark size={16} className={isDebit ? "text-red-600" : "text-green-600"}/>, title: `bKash: ${r.trxType} ${isDebit ? 'to' : 'from'} ${isDebit ? r.receiver : r.sender}`, details: { Amount: `BDT ${r.transactedAmount.toFixed(2)}` }, originalRecord: r });
        }
      });
    }

    if (selectedDataSources.includes('lac')) {
      allLACRecords.forEach(r => {
        const recordDate = parseDateTime(r.DATE_TIME);
        if (recordDate && recordDate >= sDate && recordDate <= eDate) {
          if ((identifierType === 'MSISDN' && r.MSISDN === id) || (identifierType === 'IMEI' && r.IMEI === id)) {
            allEvents.push({ id: `lac-${r.id}`, timestamp: recordDate, type: 'LAC_EVENT', icon: <TowerControl size={16} className="text-cyan-600"/>, title: `Tower Presence: ${r.LAC}-${r.CELL_ID}`, details: { Usage: r.USAGE_TYPE, Address: r.ADDRESS }, originalRecord: r });
          }
        }
      });
    }

    allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    setTimelineEvents(allEvents);
    setIsLoading(false);
    if (allEvents.length === 0) {
      setError("No activities found for the given identifier and criteria.");
    }
  }, [identifierType, identifierValue, startDate, endDate, selectedDataSources, allCDRRecords, allSMSRecords, allNagadRecords, allBkashRecords, allLACRecords]);

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 bg-surface border border-neutral-light rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold text-textPrimary mb-2 flex items-center">
          <History size={22} className="mr-2 text-rose-500" /> Unified Activity Timeline
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Identifier Type:</label>
            <select value={identifierType} onChange={e => setIdentifierType(e.target.value as 'MSISDN' | 'IMEI')} className="w-full p-2 border rounded-md text-sm shadow-sm">
              <option value="MSISDN">MSISDN</option>
              <option value="IMEI">IMEI</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-textSecondary mb-1">Identifier Value:</label>
            <input type="text" value={identifierValue} onChange={e => setIdentifierValue(e.target.value)} placeholder={`Enter ${identifierType}`} className="w-full p-2 border rounded-md text-sm shadow-sm"/>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">Start Date:</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-md text-sm shadow-sm accent-primary"/>
            </div>
            <div>
                <label className="block text-xs font-medium text-textSecondary mb-1">End Date:</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-md text-sm shadow-sm accent-primary"/>
            </div>
        </div>

        <div className="mt-4 pt-3 border-t">
            <h4 className="text-sm font-semibold text-textPrimary mb-2">Data Sources:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                {DATA_SOURCES.map(source => (
                    <label key={source.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-neutral-lightest cursor-pointer has-[:checked]:bg-primary-lighter has-[:checked]:border-primary-dark">
                        <input type="checkbox" checked={selectedDataSources.includes(source.id)} onChange={() => handleDataSourceToggle(source.id)} className="form-checkbox h-4 w-4 text-primary focus:ring-primary-light border-neutral-DEFAULT rounded"/>
                        {source.icon}
                        <span>{source.label}</span>
                    </label>
                ))}
            </div>
        </div>
        <button onClick={generateTimeline} disabled={isLoading} className="mt-5 w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium shadow-md disabled:opacity-70 flex items-center justify-center">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Settings2 size={18} className="mr-2"/>} Generate Timeline
        </button>
      </div>

      {error && <div className="p-3 bg-danger-lighter text-danger-darker rounded-lg border border-danger-light flex items-center shadow-md"><AlertTriangle size={18} className="mr-2"/>{error}</div>}
      {isLoading && timelineEvents.length === 0 && <div className="flex justify-center items-center h-40"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="ml-3 text-textSecondary">Generating timeline...</p></div>}
      
      {!isLoading && timelineEvents.length > 0 && (
        <div className="p-4 sm:p-5 bg-surface border border-neutral-light rounded-xl shadow-xl">
          <h3 className="text-lg font-semibold text-textPrimary mb-3">Timeline for {identifierValue}</h3>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin pr-2">
            <ol className="relative border-l border-neutral-light">
              {timelineEvents.map(event => (
                <li key={event.id} className="mb-6 ml-6">
                  <span className="absolute flex items-center justify-center w-6 h-6 bg-primary-lighter rounded-full -left-3 ring-8 ring-surface">
                    {event.icon}
                  </span>
                  <div className="p-3 bg-neutral-lightest border border-neutral-light rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-textPrimary">{event.title}</h4>
                      <time className="text-[10px] font-normal text-textSecondary">{formatDate(event.timestamp.toISOString())}</time>
                    </div>
                    <div className="text-xs text-textSecondary space-y-0.5">
                      {Object.entries(event.details).map(([key, value]) => (
                        <p key={key} className="truncate" title={`${key}: ${String(value)}`}>
                          <strong>{key}:</strong> {String(value)}
                        </p>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedActivityTimelineView;