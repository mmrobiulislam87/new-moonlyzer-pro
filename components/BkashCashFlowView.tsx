
import React, { useMemo } from 'react';
import { useBkashContext } from '../contexts/BkashContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine, Info, DollarSign, Users } from 'lucide-react';
import { BkashRecord } from '../types';
import { parseDateTime, formatDate } from '../utils/cdrUtils';

const formatCurrency = (amount: number) => `BDT ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AnalyticsCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; children?: React.ReactNode; iconBgColor?: string }> = ({ title, value, icon, children, iconBgColor = 'bg-pink-100' }) => (
    <div className="bg-surface p-4 rounded-xl shadow-lg border border-neutral-light flex flex-col">
        <div className="flex items-center mb-2">
            <div className={`p-2 rounded-lg ${iconBgColor} mr-3`}>{icon}</div>
            <h3 className="text-sm font-semibold text-textPrimary">{title}</h3>
        </div>
        <p className="text-2xl font-bold text-textPrimary">{value}</p>
        {children && <div className="text-xs text-textSecondary mt-1">{children}</div>}
    </div>
);

const TopAgentsTable: React.FC<{ title: string; data: { agent: string; amount: number; count: number }[] }> = ({ title, data }) => (
    <div>
        <h4 className="font-semibold text-sm text-textPrimary mb-2">{title}</h4>
        {data.length > 0 ? (
            <div className="overflow-auto max-h-48 text-xs border rounded-lg">
                <table className="min-w-full">
                    <thead className="bg-neutral-lightest sticky top-0"><tr><th className="p-2 text-left">Agent/Number</th><th className="p-2 text-right">Total Amount</th><th className="p-2 text-center">Count</th></tr></thead>
                    <tbody className="divide-y divide-neutral-light">{data.map(item => (
                        <tr key={item.agent}><td className="p-2">{item.agent}</td><td className="p-2 text-right">{formatCurrency(item.amount)}</td><td className="p-2 text-center">{item.count}</td></tr>
                    ))}</tbody>
                </table>
            </div>
        ) : <p className="text-xs text-textSecondary italic">No data.</p>}
    </div>
);


const BkashCashFlowView: React.FC = () => {
    const { globallyFilteredBkashRecords } = useBkashContext();

    const { statementOwner, cashInData, cashOutData, dailyFlowData } = useMemo(() => {
        if (globallyFilteredBkashRecords.length === 0) return { statementOwner: null, cashInData: null, cashOutData: null, dailyFlowData: [] };

        const ownerCandidates: Record<string, number> = {};
        globallyFilteredBkashRecords.forEach(r => {
            if (r.sender) ownerCandidates[r.sender] = (ownerCandidates[r.sender] || 0) + 1;
            if (r.receiver) ownerCandidates[r.receiver] = (ownerCandidates[r.receiver] || 0) + 1;
        });
        const owner = Object.keys(ownerCandidates).length > 0 ? Object.keys(ownerCandidates).reduce((a, b) => ownerCandidates[a] > ownerCandidates[b] ? a : b) : null;

        const cashInRecords = globallyFilteredBkashRecords.filter(r => r.trxType.toLowerCase().includes('cash in') && r.receiver === owner);
        const cashOutRecords = globallyFilteredBkashRecords.filter(r => r.trxType.toLowerCase().includes('cash out') && r.sender === owner);

        const processRecords = (records: BkashRecord[], isCashIn: boolean) => {
            const totalAmount = records.reduce((sum, r) => sum + r.transactedAmount, 0);
            const agentCounts = new Map<string, { amount: number; count: number }>();
            records.forEach(r => {
                const agent = isCashIn ? r.sender : r.receiver;
                const entry = agentCounts.get(agent) || { amount: 0, count: 0 };
                entry.amount += r.transactedAmount;
                entry.count++;
                agentCounts.set(agent, entry);
            });
            const topAgents = Array.from(agentCounts.entries()).map(([agent, data]) => ({ agent, ...data })).sort((a, b) => b.amount - a.amount).slice(0, 5);
            return { totalAmount, totalCount: records.length, topAgents };
        };
        
        const dailyDataMap: Record<string, { date: string; cashIn: number; cashOut: number }> = {};
        [...cashInRecords, ...cashOutRecords].forEach(r => {
            const dateObj = parseDateTime(r.transactionDate);
            if (dateObj) {
                const dateStr = dateObj.toISOString().split('T')[0];
                if (!dailyDataMap[dateStr]) dailyDataMap[dateStr] = { date: dateStr, cashIn: 0, cashOut: 0 };
                if (r.trxType.toLowerCase().includes('cash in')) dailyDataMap[dateStr].cashIn += r.transactedAmount;
                if (r.trxType.toLowerCase().includes('cash out')) dailyDataMap[dateStr].cashOut += r.transactedAmount;
            }
        });

        return {
            statementOwner: owner,
            cashInData: processRecords(cashInRecords, true),
            cashOutData: processRecords(cashOutRecords, false),
            dailyFlowData: Object.values(dailyDataMap).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        };
    }, [globallyFilteredBkashRecords]);

    if (!cashInData && !cashOutData) {
        return (
            <div className="p-6 bg-neutral-lightest border rounded-lg text-center text-textSecondary">
                <Info size={28} className="mx-auto mb-2 text-neutral-DEFAULT" />
                No 'Cash In' or 'Cash Out' transactions found in the current bKash data.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-surface border rounded-xl shadow-xl">
                <div className="flex items-center text-xl font-semibold text-textPrimary mb-1">
                    <ArrowLeftRight size={24} className="mr-2.5 text-pink-500" /> bKash Cash Flow Analysis
                </div>
                <p className="text-sm text-textSecondary">Analysis of Cash In and Cash Out transactions. Identified Statement Owner: <strong className="text-pink-600">{statementOwner || 'N/A'}</strong></p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnalyticsCard title="Total Cash In" value={formatCurrency(cashInData?.totalAmount || 0)} icon={<ArrowDownToLine size={20} className="text-green-600"/>} iconBgColor="bg-green-100">{cashInData?.totalCount || 0} transactions</AnalyticsCard>
                <AnalyticsCard title="Total Cash Out" value={formatCurrency(cashOutData?.totalAmount || 0)} icon={<ArrowUpFromLine size={20} className="text-red-600"/>} iconBgColor="bg-red-100">{cashOutData?.totalCount || 0} transactions</AnalyticsCard>
                <AnalyticsCard title="Unique Cash-In Agents" value={cashInData?.topAgents.length || 0} icon={<Users size={20} className="text-green-600"/>} iconBgColor="bg-green-100"/>
                <AnalyticsCard title="Unique Cash-Out Agents" value={cashOutData?.topAgents.length || 0} icon={<Users size={20} className="text-red-600"/>} iconBgColor="bg-red-100"/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-surface p-4 rounded-xl shadow-lg border border-neutral-light">
                    <TopAgentsTable title="Top 5 Cash-In Sources (Agents)" data={cashInData?.topAgents || []} />
                </div>
                 <div className="bg-surface p-4 rounded-xl shadow-lg border border-neutral-light">
                    <TopAgentsTable title="Top 5 Cash-Out Destinations (Agents)" data={cashOutData?.topAgents || []} />
                </div>
            </div>

            <div className="bg-surface p-4 rounded-xl shadow-lg border border-neutral-light">
                <h3 className="text-base font-semibold mb-3">Daily Cash Flow (In vs Out)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyFlowData} margin={{top: 5, right: 5, left: 20, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.5}/>
                        <XAxis dataKey="date" tickFormatter={date => formatDate(date).split(' ')[0]} tick={{fontSize: 10}}/>
                        <YAxis tickFormatter={val => `${val/1000}k`} tick={{fontSize: 10}}/>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend wrapperStyle={{fontSize: "11px"}}/>
                        <Bar dataKey="cashIn" name="Cash In" fill="#10b981" radius={[4,4,0,0]}/>
                        <Bar dataKey="cashOut" name="Cash Out" fill="#ef4444" radius={[4,4,0,0]}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BkashCashFlowView;
