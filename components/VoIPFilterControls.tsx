
import React, { useState, useEffect } from 'react';
import { Search, CalendarDays, Clock, FileCheck2, RotateCcw, CheckCircle, ListFilter } from 'lucide-react';
import { useVoIPContext } from '../contexts/VoIPContext';
import { VoIPFilterState } from '../types';

const VoIPFilterControls: React.FC = () => {
  const { voipFilterState, setVoIPFilterState, uploadedVoIPFiles } = useVoIPContext();
  
  const [localFilters, setLocalFilters] = useState<VoIPFilterState>(voipFilterState);

  useEffect(() => {
    setLocalFilters(voipFilterState);
  }, [voipFilterState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target;
      setLocalFilters(prev => {
        const currentValues = (prev as any)[name] as string[] || [];
        if (checked) {
          return { ...prev, [name]: [...currentValues, value] };
        } else {
          return { ...prev, [name]: currentValues.filter(v => v !== value) };
        }
      });
    } else if (type === 'number') {
       setLocalFilters(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
    } else {
      setLocalFilters(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const applyFilters = () => {
    setVoIPFilterState(localFilters);
  };

  const resetFilters = () => {
    const initialFilterState: VoIPFilterState = {
      searchTerm: '',
      dateFrom: undefined,
      dateTo: undefined,
      minDuration: null,
      maxDuration: null,
      selectedFileIds: uploadedVoIPFiles.map(f => f.id), 
    };
    setLocalFilters(initialFilterState);
    setVoIPFilterState(initialFilterState);
  };

  return (
    <div className="p-4 sm:p-5 bg-indigo-50/70 border border-indigo-200 rounded-xl shadow-lg mb-6 space-y-5">
      <div className="flex items-center text-lg font-semibold text-indigo-700 mb-1">
        <ListFilter size={22} className="mr-2"/> VoIP Filter Controls
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
        <div className="space-y-1.5">
          <label htmlFor="searchTermVoip" className="block text-xs font-medium text-indigo-600">Search Term</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-DEFAULT" />
            <input type="text" name="searchTerm" id="searchTermVoip" value={localFilters.searchTerm} onChange={handleInputChange} className="block w-full pl-9 pr-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm shadow-sm" placeholder="Phone, IP, Call Type..." />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="dateFromVoip" className="block text-xs font-medium text-indigo-600">Date From</label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-DEFAULT" />
            <input type="date" name="dateFrom" id="dateFromVoip" value={localFilters.dateFrom || ''} onChange={handleInputChange} className="block w-full pl-9 pr-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm shadow-sm accent-indigo-500" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="dateToVoip" className="block text-xs font-medium text-indigo-600">Date To</label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-DEFAULT" />
            <input type="date" name="dateTo" id="dateToVoip" value={localFilters.dateTo || ''} onChange={handleInputChange} className="block w-full pl-9 pr-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm shadow-sm accent-indigo-500" />
          </div>
        </div>
        
        <div className="space-y-1.5 lg:col-span-2">
          <label className="block text-xs font-medium text-indigo-600">Call Duration (minutes)</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-DEFAULT" /><input type="number" name="minDuration" value={localFilters.minDuration ?? ''} onChange={handleInputChange} placeholder="Min" className="block w-full pl-9 pr-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm shadow-sm"/></div>
            <div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-DEFAULT" /><input type="number" name="maxDuration" value={localFilters.maxDuration ?? ''} onChange={handleInputChange} placeholder="Max" className="block w-full pl-9 pr-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm shadow-sm"/></div>
          </div>
        </div>
      </div>
      
      {uploadedVoIPFiles.length > 1 && (
        <div className="space-y-2 pt-3 border-t border-indigo-200">
            <h4 className="text-xs font-semibold text-indigo-600 flex items-center"><FileCheck2 size={15} className="mr-1.5"/>Filter by Files</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-200 p-1">
            {uploadedVoIPFiles.map(file => (
                <label key={file.id} className="flex items-center space-x-1.5 text-xs text-textSecondary hover:text-indigo-700 cursor-pointer">
                <input type="checkbox" name="selectedFileIds" value={file.id} checked={localFilters.selectedFileIds.includes(file.id)} onChange={handleInputChange} className="h-3.5 w-3.5 text-indigo-500 border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500"/>
                <span className="truncate max-w-xs" title={file.sourceName || file.name}>{file.sourceName || file.name}</span>
                </label>
            ))}
            </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-indigo-200">
        <button onClick={resetFilters} className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 border border-indigo-300 rounded-lg shadow-sm hover:bg-indigo-200 flex items-center justify-center transition-colors"> <RotateCcw size={16} className="mr-1.5"/>Reset Filters </button>
        <button onClick={applyFilters} className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 border border-transparent rounded-lg shadow-sm hover:bg-indigo-600 flex items-center justify-center transition-colors"> <CheckCircle size={16} className="mr-1.5"/>Apply Filters </button>
      </div>
    </div>
  );
};

export default VoIPFilterControls;
