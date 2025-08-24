
import React, { useMemo } from 'react';
import { useBkashContext } from '../contexts/BkashContext';
import { CreditCard, Download, Info } from 'lucide-react';
import { downloadCSV } from '../utils/downloadUtils';

interface MerchantPayment {
    merchantAccount: string;
    merchantName?: string;
    totalAmount: number;
    paymentCount: number;
}

const BkashPaymentAnalysisView: React.FC = () => {
    const { globallyFilteredBkashRecords } = useBkashContext();
    
    const { totalPaymentAmount, merchantPayments } = useMemo(() => {
        const paymentRecords = globallyFilteredBkashRecords.filter(r => 
            r.trxType.toLowerCase().includes('payment')
        );

        const totalAmount = paymentRecords.reduce((sum, r) => sum + r.transactedAmount, 0);

        const merchantsMap = new Map<string, MerchantPayment>();
        paymentRecords.forEach(r => {
            const merchantAccount = r.receiver;
            if (!merchantAccount) return;

            let entry = merchantsMap.get(merchantAccount);
            if (!entry) {
                entry = { merchantAccount, merchantName: r.receiverName, totalAmount: 0, paymentCount: 0 };
            }
            
            // Update name if a newer record has one
            if (r.receiverName && !entry.merchantName) {
                entry.merchantName = r.receiverName;
            }

            entry.totalAmount += r.transactedAmount;
            entry.paymentCount++;
            
            merchantsMap.set(merchantAccount, entry);
        });

        const sortedMerchants = Array.from(merchantsMap.values()).sort((a,b) => b.totalAmount - a.totalAmount);

        return { totalPaymentAmount: totalAmount, merchantPayments: sortedMerchants };
    }, [globallyFilteredBkashRecords]);

    const handleExport = () => {
        const headers = ["Merchant Account", "Merchant Name", "Total Paid (BDT)", "Payment Count"];
        const data = merchantPayments.map(p => [
            p.merchantAccount,
            p.merchantName || 'N/A',
            p.totalAmount.toFixed(2),
            String(p.paymentCount),
        ]);
        downloadCSV(`bkash_payment_analysis.csv`, data, headers);
    };

    if (merchantPayments.length === 0) {
        return (
            <div className="p-6 bg-neutral-lightest border rounded-lg text-center text-textSecondary">
                <Info size={28} className="mx-auto mb-2 text-neutral-DEFAULT" />
                No 'Payment' transactions found in the current bKash data.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="p-4 bg-surface border rounded-xl shadow-xl">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <div className="flex items-center text-xl font-semibold text-textPrimary mb-1">
                            <CreditCard size={24} className="mr-2.5 text-pink-500" /> bKash Payment & Merchant Analysis
                        </div>
                        <p className="text-sm text-textSecondary">
                            Total Paid to Merchants: <strong className="text-pink-600">{totalPaymentAmount.toFixed(2)} BDT</strong> across {merchantPayments.length} unique merchants.
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
                            <th className="p-3 text-left font-semibold">Merchant Account</th>
                            <th className="p-3 text-left font-semibold">Merchant Name</th>
                            <th className="p-3 text-right font-semibold">Total Paid (BDT)</th>
                            <th className="p-3 text-center font-semibold">Frequency</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-light">
                        {merchantPayments.map(payment => (
                            <tr key={payment.merchantAccount}>
                                <td className="p-3 font-medium">{payment.merchantAccount}</td>
                                <td className="p-3">{payment.merchantName || 'N/A'}</td>
                                <td className="p-3 text-right">{payment.totalAmount.toFixed(2)}</td>
                                <td className="p-3 text-center">{payment.paymentCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BkashPaymentAnalysisView;
