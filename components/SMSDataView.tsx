

import React, { useState, useMemo, useEffect } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Info, AlertTriangle, ListFilter, Download, FileText, Send, Inbox, Search as SearchIconLucide, CreditCard, Users2, ShieldAlert } from 'lucide-react';
import { useSMSContext } from '../contexts/SMSContext';
import { SMSRecord, SMSFilterState } from '../types';
import { formatDate, parseDateTime } from '../utils/cdrUtils';
import { downloadCSV } from '../utils/downloadUtils';
import SMSFilterControls from './SMSFilterControls'; 
import { Tab as FileTab, Tabs as FileTabs } from './Tabs';

const ROWS_PER_PAGE = 20;

interface SMSSortConfig {
  key: keyof SMSRecord | null;
  direction: 'ascending' | 'descending';
}

const ocrHeaderToSMSRecordFieldMap: Record<string, keyof SMSRecord> = {
  'StartTime': 'Timestamp',
  'START TIME': 'Timestamp',
  'A Party': 'PrimaryUserInRecord',
  'A PARTY': 'PrimaryUserInRecord',
  'B Party': 'OtherPartyOrServiceInRecord',
  'B PARTY': 'OtherPartyOrServiceInRecord',
  'Direction': 'OriginalDirection',
  'DIRECTION': 'OriginalDirection',
  'Message Content': 'Content',
  'MESSAGE CONTENT': 'Content',
  'File Name': 'fileName',
  'FILE NAME': 'fileName',
  'Timestamp': 'Timestamp',
  'Initiator': 'Initiator',
  'Recipient': 'Recipient',
  'OriginalDirection': 'OriginalDirection',
  'Content': 'Content',
  'PrimaryUserInRecord': 'PrimaryUserInRecord',
  'OtherPartyOrServiceInRecord': 'OtherPartyOrServiceInRecord',
  'fileName': 'fileName',
  'TEXT FORMAT': 'TEXT FORMAT' as keyof SMSRecord,
  'U T C OFFSET': 'U T C OFFSET' as keyof SMSRecord,
};


const SMSDataView: React.FC = () => {
  const { 
    filteredSMSRecords, 
    globallyFilteredSMSRecords,
    isLoading, 
    error, 
    uploadedSMSFiles,
    smsFilterState,
    activeFileTabId,
    setActiveFileTabId,
  } = useSMSContext();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SMSSortConfig>({ key: 'Timestamp', direction: 'descending' });
  const [showFilters, setShowFilters] = useState(false);

  const filesForTabs = useMemo(() => {
    return uploadedSMSFiles.filter(f => smsFilterState.selectedFileIds.includes(f.id));
  }, [uploadedSMSFiles, smsFilterState.selectedFileIds]);
  
  useEffect(() => {
    if (filesForTabs.length > 0) {
      const currentActiveFileIsValid = filesForTabs.some(f => f.id === activeFileTabId);
      if (!activeFileTabId || !currentActiveFileIsValid) {
        setActiveFileTabId(filesForTabs[0].id);
      }
    } else {
      if (activeFileTabId !== null) {
         setActiveFileTabId(null); 
      }
    }
  }, [filesForTabs, activeFileTabId, setActiveFileTabId]);


  const uniqueFileHeaders = useMemo(() => {
    const headersSet = new Set<string>();
    const desiredDisplayHeaders: string[] = [
        'StartTime', 'A Party', 'B Party', 'Direction', 'Message Content', 
        'TEXT FORMAT', 'U T C OFFSET', 'fileName'
    ];
    
    let filesToConsiderHeadersFrom = uploadedSMSFiles;
    if (smsFilterState.selectedFileIds.length > 0) {
        filesToConsiderHeadersFrom = uploadedSMSFiles.filter(f => smsFilterState.selectedFileIds.includes(f.id));
    }
    
    if (filesToConsiderHeadersFrom.length > 0 && filesToConsiderHeadersFrom[0].headers.length > 0) {
        filesToConsiderHeadersFrom.forEach(file => file.headers.forEach(h => headersSet.add(h)));
    } else {
        desiredDisplayHeaders.forEach(dh => headersSet.add(dh));
    }
    
    const finalHeaders = Array.from(headersSet).filter(h => 
        h.toUpperCase() !== 'INITIATOR' && h.toUpperCase() !== 'RECIPIENT'
    );
    
    return finalHeaders.sort((a,b) => {
        const normA = Object.keys(ocrHeaderToSMSRecordFieldMap).find(k => k.toUpperCase() === a.toUpperCase()) || a;
        const normB = Object.keys(ocrHeaderToSMSRecordFieldMap).find(k => k.toUpperCase() === b.toUpperCase()) || b;
        const idxA = desiredDisplayHeaders.indexOf(normA);
        const idxB = desiredDisplayHeaders.indexOf(normB);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

  }, [uploadedSMSFiles, smsFilterState.selectedFileIds]);


  const sortedRecords = useMemo(() => {
    let sortableItems = [...filteredSMSRecords]; 
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const keyA = sortConfig.key!;
        const valA = a[keyA];
        const valB = b[keyA];

        if (keyA === 'Timestamp') {
          return (parseDateTime(String(valA))?.getTime() ?? 0) - (parseDateTime(String(valB))?.getTime() ?? 0);
        } 
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
            return valA - valB;
        }
        return 0;
      });

      if(sortConfig.direction === 'descending') {
          sortableItems.reverse();
      }
    }
    return sortableItems;
  }, [filteredSMSRecords, sortConfig]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ROWS_PER_PAGE;
    return sortedRecords.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, sortedRecords]);

  const totalPages = Math.ceil(sortedRecords.length / ROWS_PER_PAGE);

  const requestSort = (rawHeaderKey: string) => {
    const sortableKey = ocrHeaderToSMSRecordFieldMap[rawHeaderKey] || (rawHeaderKey as keyof SMSRecord);
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === sortableKey && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if(sortConfig.key !== sortableKey && sortableKey === 'Timestamp') {
      direction = 'descending';
    }
    setSortConfig({ key: sortableKey, direction });
    setCurrentPage(1);
  };

  const renderSortIcon = (rawHeaderKey: string) => {
    const sortableKey = ocrHeaderToSMSRecordFieldMap[rawHeaderKey] || (rawHeaderKey as keyof SMSRecord);
    if (sortConfig.key !== sortableKey) return <ChevronDown className="h-4 w-4 text-neutral-DEFAULT opacity-30 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4 text-primary-dark" /> : <ChevronDown className="h-4 w-4 text-primary-dark" />;
  };
  
  const handleExportData = () => {
    if (sortedRecords.length === 0) { alert("No data to export."); return; }
    const headersToExport = [...uniqueFileHeaders] as string[]; 
    
    const dataToExport = sortedRecords.map(record => 
        headersToExport.map(headerKey => {
            const actualFieldKey = ocrHeaderToSMSRecordFieldMap[headerKey] || (headerKey as keyof SMSRecord);
            const value = record[actualFieldKey];
            if (actualFieldKey === 'Timestamp') return formatDate(String(value));
            return value ?? 'N/A';
        })
    );
    const activeFile = uploadedSMSFiles.find(f => f.id === activeFileTabId);
    const baseFilename = activeFile ? activeFile.sourceName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : "sms_data_export";
    downloadCSV(`${baseFilename}.csv`, dataToExport, headersToExport);
  };

  if (isLoading && filteredSMSRecords.length === 0 && uploadedSMSFiles.length > 0) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-dark"></div><p className="ml-3 text-textSecondary">Applying filters to SMS data...</p></div>;
  }
  if (error) return <div className="p-4 bg-danger-lighter text-danger-darker rounded-lg text-center border border-danger-light">{error}</div>;
  
  const noFilesSelectedForDisplay = uploadedSMSFiles.length > 0 && smsFilterState.selectedFileIds.length === 0;
  
  const title = useMemo(() => {
    if (activeFileTabId) {
      const activeFile = uploadedSMSFiles.find(f => f.id === activeFileTabId);
      return `SMS Records for ${activeFile?.sourceName || 'Selected File'} (${sortedRecords.length})`;
    }
    const selectedFileCount = smsFilterState.selectedFileIds.length;
    if (selectedFileCount > 0) {
      return `SMS Records (${sortedRecords.length}) (Across ${selectedFileCount} files)`;
    }
    return `SMS Records (${sortedRecords.length}) (Across all files)`;
  }, [activeFileTabId, uploadedSMSFiles, sortedRecords.length, smsFilterState.selectedFileIds.length]);
  
  if (uploadedSMSFiles.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
         <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-surface rounded-2xl shadow-xl border border-neutral-light/50 min-h-[450px] w-full max-w-4xl">
            <MessageSquare size={52} className="text-warning mb-6"/>
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-3">SMS Analysis Workspace</h2>
            <p className="text-md sm:text-lg text-textSecondary mb-8 max-w-2xl">
                Upload your SMS data files (Excel/CSV) to analyze message content, track recharge patterns, visualize contact links, and flag suspicious activities using AI.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 sm:gap-x-10 gap-y-4">
                <div className="flex flex-col items-center text-xs sm:text-sm text-yellow-600 w-24 text-center">
                    <SearchIconLucide size={32} className="mb-1" />
                    Content Search
                </div>
                <div className="flex flex-col items-center text-xs sm:text-sm text-orange-500 w-24 text-center">
                    <CreditCard size={32} className="mb-1" />
                    Recharge Tracker
                </div>
                <div className="flex flex-col items-center text-xs sm:text-sm text-amber-600 w-24 text-center">
                    <Users2 size={32} className="mb-1" />
                    Contact Links
                </div>
                <div className="flex flex-col items-center text-xs sm:text-sm text-red-600 w-24 text-center">
                    <ShieldAlert size={32} className="mb-1" />
                    Alert & Flagging (AI)
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <h3 className="text-xl font-semibold text-textPrimary">
          {title}
        </h3>
        <div className="flex gap-2.5">
            {sortedRecords.length > 0 && (
              <button onClick={handleExportData} className="flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary-light focus:ring-offset-1 transition-colors shadow-md text-sm" title="Export current table data to CSV">
                <Download size={16} className="mr-1.5" /> Export CSV
              </button>
            )}
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-1 transition-colors shadow-md text-sm">
                <ListFilter size={16} className="mr-1.5" /> {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
        </div>
      </div>

      {showFilters && <SMSFilterControls />}
      
      {filesForTabs.length > 1 && (
        <div className="bg-surface p-3 sm:p-3.5 rounded-xl border border-neutral-light shadow-lg">
          <h3 className="text-xs sm:text-sm font-medium text-textSecondary mb-2 sm:mb-2.5 ml-1">Select File to View:</h3>
          <FileTabs>
            {filesForTabs.map(file => (
              <FileTab
                key={file.id}
                title={file.sourceName || file.name}
                icon={<FileText size={15} />}
                isActive={activeFileTabId === file.id}
                onClick={() => setActiveFileTabId(file.id)}
              />
            ))}
          </FileTabs>
        </div>
      )}

      {noFilesSelectedForDisplay && (
         <div className="p-4 bg-warning-lighter border border-warning-light rounded-lg text-warning-darker flex items-center shadow-md">
            <AlertTriangle size={20} className="mr-2.5"/>
            Please select SMS files in 'Filter Controls' to view data.
        </div>
      )}
      
      {sortedRecords.length === 0 && uploadedSMSFiles.length > 0 && smsFilterState.selectedFileIds.length > 0 && !noFilesSelectedForDisplay && (
        <div className="p-6 bg-neutral-lightest border border-neutral-light rounded-lg text-center text-textSecondary mt-4 min-h-[100px] flex items-center justify-center">
            No SMS records match the current filters.
        </div>
      )}

      {currentTableData.length > 0 && (
        <>
          <div className="overflow-x-auto bg-surface shadow-xl rounded-xl border border-neutral-light">
            <table className="min-w-full divide-y divide-neutral-light">
              <thead className="bg-neutral-lightest sticky top-0 z-10">
                <tr>
                  {uniqueFileHeaders.map((rawHeaderKey) => (
                    <th key={rawHeaderKey} scope="col" onClick={() => requestSort(rawHeaderKey)} className="group px-3.5 py-3 text-left text-xs font-semibold text-textPrimary uppercase tracking-wider cursor-pointer hover:bg-neutral-lighter transition-colors whitespace-nowrap">
                      <div className="flex items-center justify-between">
                        {rawHeaderKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        {renderSortIcon(rawHeaderKey)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-neutral-light">
                {currentTableData.map((record, index) => (
                  <tr key={record.id} className={`transition-colors ${index % 2 === 0 ? 'bg-surface' : 'bg-neutral-lightest/60'} hover:bg-primary-lighter/20`}>
                    {uniqueFileHeaders.map(rawHeaderKey => {
                      const actualFieldKey = ocrHeaderToSMSRecordFieldMap[rawHeaderKey] || (rawHeaderKey as keyof SMSRecord);
                      let cellContent: React.ReactNode = record[actualFieldKey] ?? 'N/A';
                      
                      let cellClassName = "px-3.5 py-2.5 text-xs text-textSecondary";

                      if (actualFieldKey === 'Timestamp' && cellContent !== 'N/A') {
                        cellContent = formatDate(String(cellContent));
                        cellClassName += " whitespace-nowrap";
                      } else if (actualFieldKey === 'OriginalDirection' && cellContent !== 'N/A') {
                        cellContent = (
                          <span className="flex items-center">
                            {String(cellContent) === 'SMSMO' ? <Send size={14} className="text-blue-500 mr-1"/> : <Inbox size={14} className="text-green-500 mr-1"/>}
                            {String(cellContent)}
                          </span>
                        );
                        cellClassName += " whitespace-nowrap";
                      } else if (actualFieldKey === 'Content') {
                        cellClassName += " whitespace-normal max-w-md";
                      } else {
                        cellClassName += " whitespace-nowrap max-w-[200px] truncate";
                      }
                      
                      return (
                        <td key={`${record.id}-${rawHeaderKey}`} className={cellClassName} title={(record[actualFieldKey] ?? '').toString()}>
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 py-3 px-1">
              <span className="text-sm text-textSecondary mb-2 sm:mb-0">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-textPrimary bg-surface border border-neutral-light rounded-lg shadow-sm hover:bg-neutral-lighter disabled:opacity-50">Previous</button>
                <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-textPrimary bg-surface border border-neutral-light rounded-lg shadow-sm hover:bg-neutral-lighter disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SMSDataView;