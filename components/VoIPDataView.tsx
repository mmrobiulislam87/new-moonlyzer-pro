
import React, { useState, useMemo } from 'react';
import { Info, SquareDashedBottomCode, ChevronDown, ChevronUp, Filter as FilterIcon, Download } from 'lucide-react';
import { useVoIPContext } from '../contexts/VoIPContext';
import { formatDate, parseDateTime } from '../utils/cdrUtils';
import VoIPFilterControls from './VoIPFilterControls';
import { VoIPRecord } from '../types';
import { downloadCSV } from '../utils/downloadUtils';

interface VoIPSorterConfig {
  key: keyof VoIPRecord | null;
  direction: 'ascending' | 'descending';
}
const ROWS_PER_PAGE = 20;

const VoIPDataView: React.FC = () => {
    const { uploadedVoIPFiles, filteredVoIPRecords, voipFilterState } = useVoIPContext();
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<VoIPSorterConfig>({ key: 'timestamp', direction: 'descending' });

    const sortedRecords = useMemo(() => {
        let sortableItems = [...filteredVoIPRecords];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key!];
                const valB = b[sortConfig.key!];
                let comparison = 0;
                
                if (sortConfig.key === 'timestamp') {
                    comparison = (parseDateTime(String(valA))?.getTime() ?? 0) - (parseDateTime(String(valB))?.getTime() ?? 0);
                } else if (typeof valA === 'number' && typeof valB === 'number') {
                    comparison = valA - valB;
                } else if (typeof valA === 'string' && typeof valB === 'string') {
                    comparison = valA.localeCompare(valB);
                }

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            });
        }
        return sortableItems;
    }, [filteredVoIPRecords, sortConfig]);

    const paginatedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        return sortedRecords.slice(startIndex, startIndex + ROWS_PER_PAGE);
    }, [sortedRecords, currentPage]);

    const totalPages = Math.ceil(sortedRecords.length / ROWS_PER_PAGE);

    const requestSort = (key: keyof VoIPRecord) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig.key !== key && key === 'timestamp') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const renderSortIcon = (key: keyof VoIPRecord) => {
        if (sortConfig.key !== key) return <ChevronDown size={14} className="ml-1 opacity-30 group-hover:opacity-100" />;
        return sortConfig.direction === 'ascending' ? <ChevronUp size={14} className="ml-1 text-primary"/> : <ChevronDown size={14} className="ml-1 text-primary"/>;
    };

    const handleExportData = () => {
      if (sortedRecords.length === 0) {
        alert("No data to export.");
        return;
      }
      const headers = ["Timestamp", "Source Number", "Destination Number", "Direction", "Call Type", "IP Address", "Duration (min)", "Source File"];
      const data = sortedRecords.map(r => [
        formatDate(r.timestamp),
        r.sourcePhoneNumber,
        r.destinationPhoneNumber,
        r.direction,
        r.callType,
        r.ipAddress,
        r.durationMinutes.toFixed(2),
        r.fileName,
      ]);
      downloadCSV(`voip_cdr_export.csv`, data, headers);
    };

    const tableHeaders: { key: keyof VoIPRecord; label: string; }[] = [
        { key: 'timestamp', label: 'Timestamp' },
        { key: 'sourcePhoneNumber', label: 'Source Number' },
        { key: 'destinationPhoneNumber', label: 'Destination Number' },
        { key: 'direction', label: 'Direction' },
        { key: 'callType', label: 'Call Type' },
        { key: 'ipAddress', label: 'IP Address' },
        { key: 'durationMinutes', label: 'Duration (min)' },
    ];
    
    if (uploadedVoIPFiles.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-surface rounded-2xl shadow-xl border border-neutral-light/50 min-h-[450px] w-full max-w-4xl">
                    <SquareDashedBottomCode size={52} className="text-indigo-500 mb-6" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-3">IP Number Analysis</h2>
                    <p className="text-md sm:text-lg text-textSecondary mb-8 max-w-2xl">
                        Upload your VoIP CDR files to analyze calls from services like Brilliant, AmberIT, and others. Visualize call networks, profile IP addresses, and uncover key insights from your IP-based communication data.
                    </p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                 <h2 className="text-xl font-semibold text-textPrimary">VoIP CDR Data Grid ({sortedRecords.length} Records)</h2>
                 <div className="flex gap-2">
                    {sortedRecords.length > 0 && (
                        <button onClick={handleExportData} className="px-4 py-2 text-sm bg-secondary text-white rounded-lg hover:bg-secondary-dark shadow-md flex items-center"><Download size={16} className="mr-1"/>Export CSV</button>
                    )}
                    <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark shadow-md flex items-center"><FilterIcon size={16} className="mr-1"/>{showFilters ? 'Hide' : 'Show'} Filters</button>
                 </div>
            </div>
            
            {showFilters && <VoIPFilterControls />}

            {sortedRecords.length === 0 && (
                 <div className="p-6 bg-neutral-lightest border border-neutral-light rounded-lg text-center text-textSecondary flex flex-col items-center justify-center min-h-[150px] shadow-md">
                    <Info size={28} className="mb-2 text-neutral-DEFAULT" />
                    <p>No records match the current filters.</p>
                </div>
            )}
            
            {sortedRecords.length > 0 && (
                <div className="p-4 bg-surface rounded-xl shadow-lg border border-neutral-light">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                            <thead className="bg-neutral-lightest">
                                <tr>
                                    {tableHeaders.map(header => (
                                        <th key={header.key} onClick={() => requestSort(header.key)} className="p-2 text-left font-semibold uppercase tracking-wider cursor-pointer group hover:bg-neutral-light">
                                            <div className="flex items-center">{header.label} {renderSortIcon(header.key)}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-light">
                                {paginatedRecords.map(record => (
                                    <tr key={record.id} className="hover:bg-neutral-lightest/50">
                                        <td className="p-2 whitespace-nowrap">{formatDate(record.timestamp)}</td>
                                        <td className="p-2 whitespace-nowrap">{record.sourcePhoneNumber}</td>
                                        <td className="p-2 whitespace-nowrap">{record.destinationPhoneNumber}</td>
                                        <td className="p-2 whitespace-nowrap">{record.direction}</td>
                                        <td className="p-2 truncate max-w-xs" title={record.callType}>{record.callType}</td>
                                        <td className="p-2 whitespace-nowrap">{record.ipAddress}</td>
                                        <td className="p-2 whitespace-nowrap">{record.durationMinutes.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                     {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-3 text-xs">
                            <span>Page {currentPage} of {totalPages} (Total: {sortedRecords.length} records)</span>
                            <div className="flex gap-1">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-2 py-1 border rounded-md disabled:opacity-50">Previous</button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-2 py-1 border rounded-md disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VoIPDataView;
