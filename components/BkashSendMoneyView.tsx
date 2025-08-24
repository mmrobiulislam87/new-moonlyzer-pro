
import React, { useMemo } from 'react';
import { useBkashContext } from '../contexts/BkashContext';
import { Send, Download, Info, DollarSign, Users, TrendingUp } from 'lucide-react';
import { BkashRecord } from '../types';
import { parseDateTime, formatDate } from '../utils/cdrUtils';
import { downloadCSV } from '../utils/downloadUtils';

interface SendMoneyRecipient {
    number: string;
    totalAmountSent: number;
    transactionCount: number;
    firstTransaction?: Date;
    lastTransaction?: Date;
}

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

const BkashSendMoneyView: React.FC = () => {
    const { globallyFilteredBkashRecords } = useBkashContext();
    
    const { totalAmountSent, totalTransactions, uniqueRecipients, topRecipients } = useMemo(() => {
        const sendMoneyRecords = globallyFilteredBkashRecords.filter(r => 
            r.trxType.toLowerCase().includes('send money')
        );

        const totalAmount = sendMoneyRecords.reduce((sum, r) => sum + r.transactedAmount, 0);

        const recipientsMap = new Map<string, SendMoneyRecipient>();
        sendMoneyRecords.forEach(r => {
            const recipientNumber = r.receiver;
            if (!recipientNumber) return;

            let entry = recipientsMap.get(recipientNumber);
            if (!entry) {
                entry = { number: recipientNumber, totalAmountSent: 0, transactionCount: 0 };
            }

            entry.totalAmountSent += r.transactedAmount;
            entry.transactionCount++;
            const recordDate = parseDateTime(r.transactionDate);
            if (recordDate) {
                if (!entry.firstTransaction || recordDate < entry.firstTransaction) entry.firstTransaction = recordDate;
                if (!entry.lastTransaction || recordDate > entry.lastTransaction) entry.lastTransaction = recordDate;
            }
            recipientsMap.set(recipientNumber, entry);
        });

        const sortedRecipients = Array.from(recipientsMap.values()).sort((a,b) => b.totalAmountSent - a.totalAmountSent);

        return { 
            totalAmountSent: totalAmount, 
            totalTransactions: sendMoneyRecords.length,
            uniqueRecipients: recipientsMap.size,
            topRecipients: sortedRecipients 
        };
    }, [globallyFilteredBkashRecords]);

    const handleExport = () => {
        const headers = ["Recipient Number", "Total Amount Sent (BDT)", "Transaction Count", "First Transaction", "Last Transaction"];
        const data = topRecipients.map(r => [
            r.number,
            r.totalAmountSent.toFixed(2),
            String(r.transactionCount),
            r.firstTransaction ? formatDate(r.firstTransaction.toISOString()) : 'N/A',
            r.lastTransaction ? formatDate(r.lastTransaction.toISOString()) : 'N/A',
        ]);
        downloadCSV(`bkash_send_money_analysis.csv`, data, headers);
    };

    if (topRecipients.length === 0) {
        return (
            <div className="p-6 bg-neutral-lightest border rounded-lg text-center text-textSecondary">
                <Info size={28} className="mx-auto mb-2 text-neutral-DEFAULT" />
                No 'Send Money' transactions found in the current bKash data.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-surface border rounded-xl shadow-xl">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <div className="flex items-center text-xl font-semibold text-textPrimary mb-1">
                            <Send size={24} className="mr-2.5 text-pink-500" /> bKash Send Money Analysis
                        </div>
                        <p className="text-sm text-textSecondary">
                            Analysis of all 'Send Money' transactions from the statement account.
                        </p>
                    </div>
                    <button onClick={handleExport} className="mt-3 sm:mt-0 px-3.5 py-2 text-xs bg-secondary text-white rounded-lg hover:bg-secondary-dark flex items-center shadow-md">
                        <Download size={14} className="mr-1.5"/>Export List
                    </button>
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AnalyticsCard title="Total Amount Sent" value={formatCurrency(totalAmountSent)} icon={<DollarSign size={20} className="text-orange-600"/>} iconBgColor="bg-orange-100"/>
                <AnalyticsCard title="Total Transactions" value={totalTransactions.toLocaleString()} icon={<TrendingUp size={20} className="text-orange-600"/>} iconBgColor="bg-orange-100"/>
                <AnalyticsCard title="Unique Recipients" value={uniqueRecipients.toLocaleString()} icon={<Users size={20} className="text-orange-600"/>} iconBgColor="bg-orange-100"/>
            </div>

            <div className="bg-surface p-4 rounded-xl shadow-lg border border-neutral-light overflow-x-auto">
                 <h3 className="text-base font-semibold text-textPrimary mb-3">Top Send Money Recipients</h3>
                <table className="min-w-full text-sm">
                    <thead className="bg-neutral-lightest">
                        <tr>
                            <th className="p-3 text-left font-semibold">Recipient Number</th>
                            <th className="p-3 text-right font-semibold">Total Amount Sent (BDT)</th>
                            <th className="p-3 text-center font-semibold">Frequency</th>
                            <th className="p-3 text-left font-semibold">First Transaction</th>
                            <th className="p-3 text-left font-semibold">Last Transaction</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-light">
                        {topRecipients.map(recipient => (
                            <tr key={recipient.number}>
                                <td className="p-3 font-medium">{recipient.number}</td>
                                <td className="p-3 text-right">{recipient.totalAmountSent.toFixed(2)}</td>
                                <td className="p-3 text-center">{recipient.transactionCount}</td>
                                <td className="p-3">{recipient.firstTransaction ? formatDate(recipient.firstTransaction.toISOString()) : 'N/A'}</td>
                                <td className="p-3">{recipient.lastTransaction ? formatDate(recipient.lastTransaction.toISOString()) : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BkashSendMoneyView;
