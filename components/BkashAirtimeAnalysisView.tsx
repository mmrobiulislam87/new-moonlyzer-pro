
import React, { useMemo, useState } from 'react';
import { useBkashContext } from '../contexts/BkashContext';
import { Smartphone, Download, Info } from 'lucide-react';
import { formatDate, parseDateTime } from '../utils/cdrUtils';
import { downloadCSV } from '../utils/downloadUtils';

interface AirtimeRecipient {
    number: string;
    totalAmount: number;
    rechargeCount: number;
    firstRecharge?: Date;
    lastRecharge?: Date;
}

const BkashAirtimeAnalysisView: React.FC = () => {
    const { globallyFilteredBkashRecords } = useBkashContext();
    
    const { totalAirtimeAmount, airtimeRecipients } = useMemo(() => {
        const rechargeRecords = globallyFilteredBkashRecords.filter(r => 
            r.trxType.toLowerCase().includes('airtime') || 
            r.trxType.toLowerCase().includes('mobile recharge')
        );

        const totalAmount = rechargeRecords.reduce((sum, r) => sum + r.transactedAmount, 0);

        const recipientsMap = new Map<string, AirtimeRecipient>();
        rechargeRecords.forEach(r => {
            const recipientNumber = r.receiver;
            if (!recipientNumber) return;

            let entry = recipientsMap.get(recipientNumber);
            if (!entry) {
                entry = { number: recipientNumber, totalAmount: 0, rechargeCount: 0 };
            }

            entry.totalAmount += r.transactedAmount;
            entry.rechargeCount++;
            const recordDate = parseDateTime(r.transactionDate);
            if (recordDate) {
                if (!entry.firstRecharge || recordDate < entry.firstRecharge) entry.firstRecharge = recordDate;
                if (!entry.lastRecharge || recordDate > entry.lastRecharge) entry.lastRecharge = recordDate;
            }
            recipientsMap.set(recipientNumber, entry);
        });

        const sortedRecipients = Array.from(recipientsMap.values()).sort((a,b) => b.totalAmount - a.totalAmount);

        return { totalAirtimeAmount: totalAmount, airtimeRecipients: sortedRecipients };
    }, [globallyFilteredBkashRecords]);

    const handleExport = () => {
        const headers = ["Recharged Number", "Total Amount (BDT)", "Recharge Count", "First Recharge", "Last Recharge"];
        const data = airtimeRecipients.map(r => [
            r.number,
            r.totalAmount.toFixed(2),
            String(r.rechargeCount),
            r.firstRecharge ? formatDate(r.firstRecharge.toISOString()) : 'N/A',
            r.lastRecharge ? formatDate(r.lastRecharge.toISOString()) : 'N/A',
        ]);
        downloadCSV(`bkash_airtime_analysis.csv`, data, headers);
    };

    if (airtimeRecipients.length === 0) {
        return (
            <div className="p-6 bg-neutral-lightest border rounded-lg text-center text-textSecondary">
                <Info size={28} className="mx-auto mb-2 text-neutral-DEFAULT" />
                No 'Airtime Topup' or 'Mobile Recharge' transactions found in the current bKash data.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-surface border rounded-xl shadow-xl">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <div className="flex items-center text-xl font-semibold text-textPrimary mb-1">
                            <Smartphone size={24} className="mr-2.5 text-pink-500" /> bKash Airtime Analysis
                        </div>
                        <p className="text-sm text-textSecondary">
                            Total Airtime Purchased: <strong className="text-pink-600">{totalAirtimeAmount.toFixed(2)} BDT</strong> across {airtimeRecipients.length} unique numbers.
                        </p>
                    </div>
                    <button onClick={handleExport} className="mt-3 sm:mt-0 px-3.5 py-2 text-xs bg-secondary text-white rounded-lg hover:bg-secondary-dark flex items-center shadow-md">
                        <Download size={14} className="mr-1.5"/>Export List
                    </button>
                </div>
            </div>

            <div className="bg-surface p-4 rounded-xl shadow-lg border border-neutral-light overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-neutral-lightest">
                        <tr>
                            <th className="p-3 text-left font-semibold">Recharged Number</th>
                            <th className="p-3 text-right font-semibold">Total Amount (BDT)</th>
                            <th className="p-3 text-center font-semibold">Frequency</th>
                            <th className="p-3 text-left font-semibold">First Recharge</th>
                            <th className="p-3 text-left font-semibold">Last Recharge</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-light">
                        {airtimeRecipients.map(recipient => (
                            <tr key={recipient.number}>
                                <td className="p-3 font-medium">{recipient.number}</td>
                                <td className="p-3 text-right">{recipient.totalAmount.toFixed(2)}</td>
                                <td className="p-3 text-center">{recipient.rechargeCount}</td>
                                <td className="p-3">{recipient.firstRecharge ? formatDate(recipient.firstRecharge.toISOString()) : 'N/A'}</td>
                                <td className="p-3">{recipient.lastRecharge ? formatDate(recipient.lastRecharge.toISOString()) : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BkashAirtimeAnalysisView;
