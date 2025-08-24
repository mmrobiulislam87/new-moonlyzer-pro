
import React, { useState, useMemo } from 'react';
import { MapPin, Search, Info, Loader2, ListFilter, ChevronDown, ChevronUp, User, Clock, Download } from 'lucide-react';
import { useVoIPContext } from '../contexts/VoIPContext';
import { VoIPIPProfile, VoIPRecord } from '../types';
import { downloadCSV } from '../utils/downloadUtils';
import { formatDate } from '../utils/cdrUtils';

const ROWS_PER_PAGE = 15;

const VoIPIPAddressProfilerView: React.FC = () => {
    const { getUniqueVoIPValues, voipIpProfiles, isLoading } = useVoIPContext();
    const [selectedIP, setSelectedIP] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    
    const uniqueIPs = useMemo(() => getUniqueVoIPValues('ipAddress'), [getUniqueVoIPValues]);
    const profileData: VoIPIPProfile | null = selectedIP ? voipIpProfiles.get(selectedIP) || null : null;

    const paginatedRecords = useMemo(() => {
        if (!profileData) return [];
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        return profileData.records.slice(startIndex, startIndex + ROWS_PER_PAGE);
    }, [profileData, currentPage]);
    
    const totalPages = profileData ? Math.ceil(profileData.records.length / ROWS_PER_PAGE) : 0;

    const handleSelectIP = (ip: string) => {
        setSelectedIP(ip);
        setCurrentPage(1);
    };
    
    const handleExport = () => {
        if (!profileData) return;
        const headers = ["Timestamp", "Source Number", "Destination Number", "Direction", "Call Type", "Duration (min)"];
        const data = profileData.records.map(r => [
            formatDate(r.timestamp),
            r.sourcePhoneNumber,
            r.destinationPhoneNumber,
            r.direction,
            r.callType,
            r.durationMinutes.toFixed(2),
        ]);
        downloadCSV(`ip_profile_${selectedIP}.csv`, data, headers);
    };

    if (isLoading && uniqueIPs.length === 0) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3 text-textSecondary">Loading VoIP data...</p></div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="p-4 sm:p-5 bg-surface border border-neutral-light rounded-xl shadow-xl">
                <div className="flex items-center text-xl sm:text-2xl font-semibold text-textPrimary mb-1">
                    <MapPin size={24} className="mr-2.5 text-violet-500" /> IP Address Profiler
                </div>
                <p className="text-sm text-textSecondary">Select an IP address to view its detailed activity profile.</p>
                <div className="mt-4">
                    <label htmlFor="ipSelector" className="block text-xs font-medium text-textSecondary mb-1">Select IP Address:</label>
                    <select id="ipSelector" value={selectedIP || ''} onChange={e => handleSelectIP(e.target.value)} className="w-full md:w-1/2 p-2 border border-neutral-light rounded-md focus:ring-2 focus:ring-violet-400 text-sm shadow-sm">
                        <option value="">-- Select an IP --</option>
                        {uniqueIPs.map(ip => <option key={ip} value={ip}>{ip}</option>)}
                    </select>
                </div>
            </div>

            {selectedIP && profileData && (
                <div className="space-y-4">
                    <div className="p-4 bg-surface border border-neutral-light rounded-xl shadow-lg">
                        <h3 className="font-semibold text-lg text-textPrimary mb-3">Profile for: <span className="text-violet-600">{selectedIP}</span></h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="p-2 bg-neutral-lightest rounded-md border"><strong className="block text-xs text-neutral-dark">Total Calls:</strong> {profileData.totalCalls}</div>
                            <div className="p-2 bg-neutral-lightest rounded-md border"><strong className="block text-xs text-neutral-dark">Total Duration:</strong> {profileData.totalDurationMinutes.toFixed(2)} min</div>
                            <div className="p-2 bg-neutral-lightest rounded-md border"><strong className="block text-xs text-neutral-dark">Associated Numbers:</strong> {profileData.associatedNumbers.size}</div>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-surface border border-neutral-light rounded-xl shadow-lg">
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-md text-textPrimary">Associated Records ({profileData.records.length})</h4>
                            <button onClick={handleExport} className="px-3 py-1.5 text-xs bg-secondary text-white rounded-lg hover:bg-secondary-dark flex items-center shadow-sm"><Download size={14} className="mr-1.5"/>Export Records</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                               <thead className="bg-neutral-lightest">
                                    <tr>
                                        <th className="p-2 text-left">Timestamp</th><th className="p-2 text-left">Source</th><th className="p-2 text-left">Destination</th><th className="p-2 text-left">Direction</th>
                                        <th className="p-2 text-left">Call Type</th><th className="p-2 text-left">Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRecords.map(rec => (
                                        <tr key={rec.id} className="border-b border-neutral-light hover:bg-neutral-lightest/50">
                                            <td className="p-2 whitespace-nowrap">{formatDate(rec.timestamp)}</td>
                                            <td className="p-2 whitespace-nowrap">{rec.sourcePhoneNumber}</td>
                                            <td className="p-2 whitespace-nowrap">{rec.destinationPhoneNumber}</td>
                                            <td className="p-2 whitespace-nowrap">{rec.direction}</td>
                                            <td className="p-2 truncate max-w-xs">{rec.callType}</td>
                                            <td className="p-2 whitespace-nowrap">{rec.durationMinutes.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center mt-3 text-xs">
                                <span>Page {currentPage} of {totalPages}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-2 py-1 border rounded-md">Prev</button>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-2 py-1 border rounded-md">Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
             {!selectedIP && (
                <div className="p-6 bg-info-lighter border border-info-light rounded-lg text-center text-info-dark flex flex-col items-center justify-center min-h-[150px] shadow-md">
                    <Info size={28} className="mb-2" />
                    <p className="font-medium">Please select an IP address from the dropdown to view its profile.</p>
                </div>
            )}
        </div>
    );
};

export default VoIPIPAddressProfilerView;
