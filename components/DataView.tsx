

import React, { useMemo, useEffect } from 'react'; // Added useContext
import { FileText, AlertTriangle, Info, Database, Share2, SignalHigh, Link2, TrendingUp } from 'lucide-react';
import { useCDRContext } from '../contexts/CDRContext';
import DataTable from './DataTable';
// FilterControls import removed as it's now part of DataTable
import { Tab as FileTab, Tabs as FileTabs } from './Tabs'; 
import { cn } from '../utils/cn'; // Added cn utility

const DataView: React.FC = () => {
  const { 
    uploadedFiles, 
    filterState, 
    activeFileTabId, 
    setActiveFileTabId,
    isLoading, 
    error 
  } = useCDRContext();
  
  const filesForTabs = useMemo(() => {
    return uploadedFiles.filter(f => filterState.selectedFileIds.includes(f.id));
  }, [uploadedFiles, filterState.selectedFileIds]);

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
  
  if (isLoading && uploadedFiles.length === 0) { 
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-dark"></div><p className="ml-3 text-textSecondary">Loading data...</p></div>;
  }

  if (error) {
    return <div className="p-4 bg-danger-lighter text-danger-darker rounded-lg text-center border border-danger-light">{error}</div>;
  }
  
  if (uploadedFiles.length === 0) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-surface rounded-2xl shadow-xl border border-neutral-light/50 min-h-[450px] w-full max-w-4xl">
                <Database size={52} className="text-primary mb-6" />
                <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-3">CDR Analysis Workspace</h2>
                <p className="text-md sm:text-lg text-textSecondary mb-8 max-w-2xl">
                    Upload your Call Detail Records (CDR) to begin. Analyze call patterns, visualize networks, track suspect movements, and uncover critical insights from your data.
                </p>
                <div className="flex flex-wrap justify-center gap-x-6 sm:gap-x-10 gap-y-4">
                    <div className="flex flex-col items-center text-xs sm:text-sm text-blue-600 w-24 text-center">
                        <Share2 size={32} className="mb-1 text-blue-600" />
                        Graph Analysis
                    </div>
                    <div className="flex flex-col items-center text-xs sm:text-sm text-blue-700 w-24 text-center">
                        <SignalHigh size={32} className="mb-1 text-blue-700" />
                        Tower Activity
                    </div>
                    <div className="flex flex-col items-center text-xs sm:text-sm text-sky-500 w-24 text-center">
                        <Link2 size={32} className="mb-1 text-sky-500" />
                        Inter-CDR Links
                    </div>
                    <div className="flex flex-col items-center text-xs sm:text-sm text-cyan-600 w-24 text-center">
                        <TrendingUp size={32} className="mb-1 text-cyan-600" />
                        Activity Ranking
                    </div>
                </div>
            </div>
        </div>
    );
  }


  return (
    <div className="space-y-5"> {/* Increased spacing */}
      {filesForTabs.length > 1 && (
        <div className="bg-surface p-3 sm:p-3.5 rounded-xl border border-neutral-light shadow-lg"> {/* Enhanced tab container */}
          <h3 className="text-xs sm:text-sm font-medium text-textSecondary mb-2 sm:mb-2.5 ml-1">Select File to View:</h3>
          <FileTabs>
            {filesForTabs.map(file => {
              return (
                <FileTab
                  key={file.id}
                  title={file.sourceName || file.name}
                  icon={<FileText size={15} />}
                  isActive={activeFileTabId === file.id}
                  onClick={() => setActiveFileTabId(file.id)}
                />
              );
            })}
          </FileTabs>
        </div>
      )}
      
      {filterState.selectedFileIds.length === 0 && uploadedFiles.length > 0 && (
         <div className="p-4 bg-warning-lighter border border-warning-light rounded-lg text-warning-darker flex items-center shadow-md"> {/* Adjusted warning color */}
            <AlertTriangle size={20} className="mr-2.5"/>
            No files selected in filters. Please select files in 'Show Filters' &gt; 'Filter by Files' to view their data.
        </div>
      )}

      {(activeFileTabId === null && filesForTabs.length > 0) && (
         <div className="p-4 bg-info-lighter border border-info-light rounded-lg text-info-dark flex items-center shadow-md"> {/* Adjusted info color */}
            <Info size={20} className="mr-2.5"/>
            Select a file tab above to view its records.
        </div>
      )}
      
      <DataTable />
    </div>
  );
};

export default DataView;