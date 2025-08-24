
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Waypoints, Download, Info, ListFilter, ChevronUp, ChevronDown, BarChart2, Clock, Server, UserSearch } from 'lucide-react';
import { useIPDRContext } from '../contexts/IPDRContext';
import { IPDRRecord } from '../types';
import { formatDate } from '../utils/cdrUtils';
import { downloadCSV } from '../utils/downloadUtils';

const SOCIAL_MEDIA_KEYWORDS: Record<string, string[]> = {
  Facebook: ['facebook', 'fbcdn', 'messenger'],
  WhatsApp: ['whatsapp'],
  Telegram: ['telegram'],
  YouTube: ['youtube', 'googlevideo'],
  TikTok: ['tiktok'],
  Instagram: ['instagram'],
  IMO: ['imo.im'],
  Viber: ['viber'],
  Signal: ['signal'],
  WeChat: ['wechat'],
  Skype: ['skype'],
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const ROWS_PER_PAGE = 15;

interface SocialMediaSession extends IPDRRecord {
  appName: string;
  totalData: number;
}

const formatBytes = (bytes?: number, decimals = 2): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const IPDRSocialMediaView: React.FC = () => {
  const { filteredIPDRRecords, isLoading, error, uploadedIPDRFiles } = useIPDRContext();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof SocialMediaSession; direction: 'ascending' | 'descending' }>({ key: 'startTime', direction: 'descending' });

  const socialMediaSessions = useMemo((): SocialMediaSession[] => {
    const sessions: SocialMediaSession[] = [];
    filteredIPDRRecords.forEach(record => {
      const appType = record.applicationType?.toLowerCase() || '';
      const url = record.url?.toLowerCase() || '';
      for (const [appName, keywords] of Object.entries(SOCIAL_MEDIA_KEYWORDS)) {
        if (keywords.some(keyword => appType.includes(keyword) || url.includes(keyword))) {
          sessions.push({
            ...record,
            appName,
            totalData: (record.uplinkTrafficByte || 0) + (record.downlinkTrafficByte || 0),
          });
          break; 
        }
      }
    });
    return sessions;
  }, [filteredIPDRRecords]);
  
  const summaryStats = useMemo(() => {
    const totalData = socialMediaSessions.reduce((sum, s) => sum + s.totalData, 0);
    const appCounts = socialMediaSessions.reduce((acc, s) => {
      acc[s.appName] = (acc[s.appName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostUsedApp = Object.entries(appCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    return {
        totalSessions: socialMediaSessions.length,
        totalDataVolume: formatBytes(totalData),
        mostUsedApp
    };
  }, [socialMediaSessions]);

  const appUsageChartData = useMemo(() => {
     const appCounts = socialMediaSessions.reduce((acc, s) => {
      acc[s.appName] = (acc[s.appName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(appCounts)
      .map(([name, sessions]) => ({ name, sessions }))
      .sort((a,b) => b.sessions - a.sessions);
  }, [socialMediaSessions]);


  const sortedTableData = useMemo(() => {
    return [...socialMediaSessions].sort((a,b) => {
        // Implement sorting logic here based on sortConfig
        return 0; // Placeholder
    });
  }, [socialMediaSessions, sortConfig]);

  const paginatedTableData = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return sortedTableData.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [sortedTableData, currentPage]);
  
  const totalPages = Math.ceil(sortedTableData.length / ROWS_PER_PAGE);

  const handleExportData = () => {
    const headers = ["Timestamp", "User ID (MSISDN/IMSI)", "App Name", "Data Volume", "Server IP", "URL", "Source File"];
    const data = sortedTableData.map(s => [
        s.startTime ? formatDate(s.startTime) : 'N/A',
        s.msisdn || s.imsi || 'N/A',
        s.appName,
        formatBytes(s.totalData),
        s.serverIP || 'N/A',
        s.url || 'N/A',
        s.fileName,
    ]);
    downloadCSV(`social_media_analysis_${new Date().toISOString().split('T')[0]}.csv`, data, headers);
  };
  
  if (isLoading && uploadedIPDRFiles.length > 0) return <p>Loading data...</p>;
  if (error) return <p className="text-danger-dark">Error: {error}</p>;
  if (uploadedIPDRFiles.length === 0) return (
      <div className="p-6 bg-info-lighter border border-info-light rounded-lg text-center text-info-dark"><Info size={24} className="mx-auto mb-2"/>Please upload IPDR files to analyze Social Media usage.</div>
  );
  if (socialMediaSessions.length === 0) return (
      <div className="p-6 bg-neutral-lightest border border-neutral-light rounded-lg text-center text-textSecondary"><Info size={24} className="mx-auto mb-2"/>No social media related activity found in the current IPDR data.</div>
  );

  return (
    <div className="space-y-6">
      <div className="p-4 bg-surface border rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold flex items-center"><Waypoints className="mr-2 text-primary"/>Social Media & App Data Analysis</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-surface rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-textSecondary">Total Social Media Sessions</h3>
            <p className="text-2xl font-bold text-textPrimary">{summaryStats.totalSessions.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-surface rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-textSecondary">Total Data Volume</h3>
            <p className="text-2xl font-bold text-textPrimary">{summaryStats.totalDataVolume}</p>
        </div>
        <div className="p-4 bg-surface rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-textSecondary">Most Used App</h3>
            <p className="text-2xl font-bold text-textPrimary">{summaryStats.mostUsedApp}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 bg-surface rounded-lg border shadow-md">
            <h3 className="text-base font-semibold mb-2">App Usage Distribution (by Session Count)</h3>
             <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appUsageChartData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
                <XAxis type="number" tick={{fontSize: 10}} allowDecimals={false}/>
                <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 10, width: 75}} interval={0}/>
                <Tooltip wrapperStyle={{fontSize: "12px"}}/>
                <Bar dataKey="sessions" name="Sessions" barSize={20}>
                    {appUsageChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="p-4 bg-surface rounded-lg border shadow-md">
            <div className="flex justify-between items-center mb-2">
                 <h3 className="text-base font-semibold">Detailed Social Media Sessions ({sortedTableData.length})</h3>
                 <button onClick={handleExportData} className="px-3 py-1 text-xs bg-secondary text-white rounded-md hover:bg-secondary-dark flex items-center"><Download size={14} className="mr-1"/>Export</button>
            </div>
            <div className="overflow-auto max-h-[300px]">
                <table className="min-w-full text-xs">
                    <thead className="bg-neutral-lightest sticky top-0"><tr>
                        <th className="p-2 text-left">Timestamp</th>
                        <th className="p-2 text-left">User ID</th>
                        <th className="p-2 text-left">App</th>
                        <th className="p-2 text-left">Data</th>
                        <th className="p-2 text-left">Server IP</th>
                    </tr></thead>
                    <tbody className="divide-y divide-neutral-light">
                        {paginatedTableData.map(s => (
                            <tr key={s.id}>
                                <td className="p-2 whitespace-nowrap">{s.startTime ? formatDate(s.startTime) : 'N/A'}</td>
                                <td className="p-2">{s.msisdn || s.imsi || 'N/A'}</td>
                                <td className="p-2 font-medium">{s.appName}</td>
                                <td className="p-2">{formatBytes(s.totalData)}</td>
                                <td className="p-2">{s.serverIP || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {totalPages > 1 && (
                <div className="flex justify-between items-center mt-2 text-xs">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-2 py-1 border rounded mr-1">Prev</button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-2 py-1 border rounded">Next</button>
                    </div>
                </div>
            )}
        </div>
      </div>

    </div>
  );
};

export default IPDRSocialMediaView;
