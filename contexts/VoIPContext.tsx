
import React, { createContext, useState, useContext, useCallback, ReactNode, useMemo } from 'react';
import { VoIPRecord, UploadedVoIPFile, VoIPFilterState, VoIPContextType, VoIPDashboardStats, VoIPGraphData, VoIPIPProfile, GraphNode, GraphEdge } from '../types';
import { parseDateTime } from '../utils/cdrUtils';

const VoIPContext = createContext<VoIPContextType | undefined>(undefined);

export const VoIPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uploadedVoIPFiles, setUploadedVoIPFiles] = useState<UploadedVoIPFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [voipFilterState, setVoIPFilterState] = useState<VoIPFilterState>({
    searchTerm: '',
    selectedFileIds: [],
  });
  const [activeFileTabId, setActiveFileTabId] = useState<string | null>(null);

  const addVoIPFile = useCallback((file: UploadedVoIPFile) => {
    setUploadedVoIPFiles(prev => {
        const isFirst = prev.length === 0;
        if(isFirst) setActiveFileTabId(file.id);
        setVoIPFilterState(f => ({ ...f, selectedFileIds: [...new Set([...f.selectedFileIds, file.id])] }));
        return [...prev, file];
    });
  }, []);

  const removeVoIPFile = useCallback((fileId: string) => {
    setUploadedVoIPFiles(prev => prev.filter(f => f.id !== fileId));
    setVoIPFilterState(f => ({ ...f, selectedFileIds: f.selectedFileIds.filter(id => id !== fileId) }));
    if(activeFileTabId === fileId) setActiveFileTabId(null);
  }, [activeFileTabId]);
  
  const removeAllVoIPFiles = useCallback(() => {
    setUploadedVoIPFiles([]);
    setVoIPFilterState({ searchTerm: '', selectedFileIds: [] });
    setActiveFileTabId(null);
    setError(null);
  }, []);

  const updateVoIPFileSourceName = useCallback((fileId: string, newSourceName: string) => {
    setUploadedVoIPFiles(prev => prev.map(f => f.id === fileId ? { ...f, sourceName: newSourceName } : f));
  }, []);

  const allVoIPRecords = useMemo(() => {
    return uploadedVoIPFiles.flatMap(file => file.records);
  }, [uploadedVoIPFiles]);

  const filteredVoIPRecords = useMemo(() => {
    let records = voipFilterState.selectedFileIds.length > 0 
      ? uploadedVoIPFiles.filter(f => voipFilterState.selectedFileIds.includes(f.id)).flatMap(f => f.records)
      : allVoIPRecords;

    return records.filter(record => {
        const searchTermLower = voipFilterState.searchTerm.toLowerCase();
        if (voipFilterState.searchTerm && !Object.values(record).some(val => String(val).toLowerCase().includes(searchTermLower))) return false;
        
        if (voipFilterState.dateFrom && record.timestamp) {
            const recordDate = parseDateTime(record.timestamp);
            if(recordDate && recordDate < new Date(voipFilterState.dateFrom)) return false;
        }
        if (voipFilterState.dateTo && record.timestamp) {
            const recordDate = parseDateTime(record.timestamp);
            const toDate = new Date(voipFilterState.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if(recordDate && recordDate > toDate) return false;
        }
        if(voipFilterState.minDuration !== null && voipFilterState.minDuration !== undefined && record.durationMinutes < voipFilterState.minDuration) return false;
        if(voipFilterState.maxDuration !== null && voipFilterState.maxDuration !== undefined && record.durationMinutes > voipFilterState.maxDuration) return false;
        
        return true;
    });
  }, [allVoIPRecords, uploadedVoIPFiles, voipFilterState]);

  const getUniqueVoIPValues = useCallback((key: keyof VoIPRecord): string[] => {
    const values = new Set<string>();
    allVoIPRecords.forEach(record => {
      const val = record[key];
      if (val !== undefined && val !== null) {
        values.add(String(val));
      }
    });
    return Array.from(values).sort();
  }, [allVoIPRecords]);
  
  const voipDashboardStats: VoIPDashboardStats = useMemo(() => {
    const records = filteredVoIPRecords;
    const sourceNumbers = new Set<string>();
    const destNumbers = new Set<string>();
    const ips = new Set<string>();
    const sourceCounts: Record<string, number> = {};
    const destCounts: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};
    const callTypeCounts: Record<string, number> = {};
    let totalDuration = 0;

    records.forEach(r => {
        sourceNumbers.add(r.sourcePhoneNumber);
        destNumbers.add(r.destinationPhoneNumber);
        ips.add(r.ipAddress);
        totalDuration += r.durationMinutes;

        sourceCounts[r.sourcePhoneNumber] = (sourceCounts[r.sourcePhoneNumber] || 0) + 1;
        destCounts[r.destinationPhoneNumber] = (destCounts[r.destinationPhoneNumber] || 0) + 1;
        ipCounts[r.ipAddress] = (ipCounts[r.ipAddress] || 0) + 1;
        callTypeCounts[r.callType] = (callTypeCounts[r.callType] || 0) + 1;
    });

    const toSortedArray = (counts: Record<string, number>) => Object.entries(counts).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value).slice(0, 10);

    return {
        totalCalls: records.length,
        totalDurationMinutes: totalDuration,
        uniqueIPs: ips.size,
        uniqueSourceNumbers: sourceNumbers.size,
        uniqueDestinationNumbers: destNumbers.size,
        topSourceNumbers: toSortedArray(sourceCounts),
        topDestinationNumbers: toSortedArray(destCounts),
        topIPs: toSortedArray(ipCounts),
        callTypeDistribution: toSortedArray(callTypeCounts)
    };
  }, [filteredVoIPRecords]);

  const voipGraphData: VoIPGraphData = useMemo(() => {
    const nodesMap = new Map<string, GraphNode & { callCount: number }>();
    const edgesMap = new Map<string, GraphEdge & { callCount: number }>();

    filteredVoIPRecords.forEach(record => {
        const { sourcePhoneNumber, destinationPhoneNumber } = record;
        // Add nodes
        [sourcePhoneNumber, destinationPhoneNumber].forEach(num => {
            if (!nodesMap.has(num)) {
                nodesMap.set(num, { id: num, label: num, type: 'phoneNumber', callCount: 0 });
            }
            nodesMap.get(num)!.callCount!++;
        });

        // Add edge
        const edgeKey = `${sourcePhoneNumber}->${destinationPhoneNumber}`;
        if (!edgesMap.has(edgeKey)) {
            edgesMap.set(edgeKey, { id: edgeKey, source: sourcePhoneNumber, target: destinationPhoneNumber, callCount: 0 });
        }
        edgesMap.get(edgeKey)!.callCount!++;
    });
    
    return {
        nodes: Array.from(nodesMap.values()).map(n => ({ data: n })),
        edges: Array.from(edgesMap.values()).map(e => ({ data: e })),
    };
  }, [filteredVoIPRecords]);
  
  const voipIpProfiles: Map<string, VoIPIPProfile> = useMemo(() => {
    const profiles = new Map<string, VoIPIPProfile>();
    allVoIPRecords.forEach(record => {
        const ip = record.ipAddress;
        if(!ip) return;
        let profile = profiles.get(ip);
        if (!profile) {
            profile = { ipAddress: ip, totalCalls: 0, totalDurationMinutes: 0, associatedNumbers: new Set(), records: [] };
        }
        profile.totalCalls++;
        profile.totalDurationMinutes += record.durationMinutes;
        profile.associatedNumbers.add(record.sourcePhoneNumber);
        profile.associatedNumbers.add(record.destinationPhoneNumber);
        profile.records.push(record);
        
        const recordDate = parseDateTime(record.timestamp);
        if (recordDate) {
            if (!profile.firstSeen || recordDate < profile.firstSeen) profile.firstSeen = recordDate;
            if (!profile.lastSeen || recordDate > profile.lastSeen) profile.lastSeen = recordDate;
        }
        profiles.set(ip, profile);
    });
    return profiles;
  }, [allVoIPRecords]);
  
  return (
    <VoIPContext.Provider value={{
      uploadedVoIPFiles, addVoIPFile, removeVoIPFile, removeAllVoIPFiles, updateVoIPFileSourceName,
      allVoIPRecords, filteredVoIPRecords,
      voipFilterState, setVoIPFilterState,
      isLoading, setIsLoading, error, setError,
      getUniqueVoIPValues,
      activeFileTabId, setActiveFileTabId,
      voipDashboardStats,
      voipGraphData,
      voipIpProfiles,
    }}>
      {children}
    </VoIPContext.Provider>
  );
};

export const useVoIPContext = (): VoIPContextType => {
  const context = useContext(VoIPContext);
  if (!context) throw new Error('useVoIPContext must be used within a VoIPProvider');
  return context;
};
