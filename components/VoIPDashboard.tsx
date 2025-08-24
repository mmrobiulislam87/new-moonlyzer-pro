
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LayoutDashboard, Users, Clock, Globe as GlobeIcon, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { useVoIPContext } from '../contexts/VoIPContext';
import { VoIPDashboardStats } from '../types';

const CHART_COLORS = ['#6366f1', '#818cf8', '#a78bfa', '#c4b5fd', '#dadafc']; // Indigo/Violet theme

const AnalyticsCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; children?: React.ReactNode; iconBgColor?: string }> = ({ title, value, icon, children, iconBgColor = 'bg-indigo-100/70' }) => (
  <div className="bg-surface p-4 rounded-xl shadow-lg border border-neutral-light flex flex-col items-start hover:shadow-xl transition-shadow">
    <div className="flex items-center w-full mb-2">
      <div className={`p-2.5 rounded-lg ${iconBgColor} mr-3 shadow-sm`}>
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-textPrimary">{title}</h3>
    </div>
    <p className="text-2xl font-bold text-textPrimary">{value}</p>
    {children && <div className="text-xs text-textSecondary w-full mt-1">{children}</div>}
  </div>
);

const VoIPDashboard: React.FC = () => {
  const { voipDashboardStats } = useVoIPContext();

  const {
    totalCalls, totalDurationMinutes, uniqueIPs, uniqueSourceNumbers,
    uniqueDestinationNumbers, topSourceNumbers, topDestinationNumbers,
    topIPs, callTypeDistribution
  } = voipDashboardStats;

  return (
    <div className="space-y-6">
      <div className="p-4 sm:p-5 bg-surface border border-neutral-light rounded-xl shadow-xl">
        <div className="flex items-center text-xl sm:text-2xl font-semibold text-textPrimary mb-1">
          <LayoutDashboard size={24} className="mr-2.5 text-indigo-500" /> VoIP Call Summary Dashboard
        </div>
        <p className="text-sm text-textSecondary">Overview of the loaded IP-based call data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <AnalyticsCard title="Total Calls" value={totalCalls.toLocaleString()} icon={<BarChart2 size={20} className="text-indigo-600"/>} />
        <AnalyticsCard title="Total Duration" value={`${totalDurationMinutes.toLocaleString()} min`} icon={<Clock size={20} className="text-indigo-600"/>} />
        <AnalyticsCard title="Unique IPs" value={uniqueIPs.toLocaleString()} icon={<GlobeIcon size={20} className="text-indigo-600"/>} />
        <AnalyticsCard title="Unique Sources" value={uniqueSourceNumbers.toLocaleString()} icon={<Users size={20} className="text-indigo-600"/>} />
        <AnalyticsCard title="Unique Destinations" value={uniqueDestinationNumbers.toLocaleString()} icon={<Users size={20} className="text-indigo-600"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface p-4 sm:p-6 rounded-xl shadow-lg border border-neutral-light">
          <h3 className="text-base font-semibold text-textPrimary mb-3">Top 10 Source Numbers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSourceNumbers} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
              <XAxis type="number" tick={{fontSize: 10}} allowDecimals={false}/>
              <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 10, width: 95}} interval={0}/>
              <Tooltip wrapperStyle={{fontSize: "12px"}}/>
              <Bar dataKey="value" name="Call Count" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} barSize={15}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface p-4 sm:p-6 rounded-xl shadow-lg border border-neutral-light">
          <h3 className="text-base font-semibold text-textPrimary mb-3">Top 10 Destination Numbers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topDestinationNumbers} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
              <XAxis type="number" tick={{fontSize: 10}} allowDecimals={false}/>
              <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 10, width: 95}} interval={0}/>
              <Tooltip wrapperStyle={{fontSize: "12px"}}/>
              <Bar dataKey="value" name="Call Count" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} barSize={15}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface p-4 sm:p-6 rounded-xl shadow-lg border border-neutral-light">
          <h3 className="text-base font-semibold text-textPrimary mb-3">Top 10 IP Addresses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topIPs} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
              <XAxis type="number" tick={{fontSize: 10}} allowDecimals={false}/>
              <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 10, width: 95}} interval={0}/>
              <Tooltip wrapperStyle={{fontSize: "12px"}}/>
              <Bar dataKey="value" name="Call Count" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} barSize={15}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-surface p-4 sm:p-6 rounded-xl shadow-lg border border-neutral-light">
          <h3 className="text-base font-semibold text-textPrimary mb-3 flex items-center"><PieIcon size={18} className="mr-2"/>Call Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={callTypeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name.substring(0,15)}... (${(percent*100).toFixed(0)}%)`}>
                {callTypeDistribution.map((_entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip wrapperStyle={{fontSize: "12px"}}/>
              <Legend wrapperStyle={{fontSize: "11px", paddingTop: "10px"}} iconSize={10}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default VoIPDashboard;
