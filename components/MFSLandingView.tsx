// components/MFSLandingView.tsx
import React from 'react';
import { Landmark, Mailbox, Pocket, Rocket } from 'lucide-react';

const MFSLandingView: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-surface rounded-2xl shadow-xl border border-neutral-light/50 min-h-[450px] w-full max-w-4xl">
            <Landmark size={52} className="text-primary mb-6" />
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-3">
                Mobile Finance Services Analysis
            </h1>
            <p className="text-md sm:text-lg text-textSecondary mb-8 max-w-lg">
                Select a specific Mobile Finance Service from the ribbon toolbar above to begin your detailed analysis.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 sm:gap-x-10 gap-y-4">
                <div className="flex flex-col items-center text-xs sm:text-sm text-emerald-600 w-24">
                <Mailbox size={32} className="mb-1 text-emerald-500" />
                Nagad
                </div>
                <div className="flex flex-col items-center text-xs sm:text-sm text-pink-600 w-24">
                <Pocket size={32} className="mb-1 text-pink-500" />
                bKash
                </div>
                <div className="flex flex-col items-center text-xs sm:text-sm text-purple-600 w-24">
                <Rocket size={32} className="mb-1 text-purple-500" />
                Roket
                </div>
            </div>
        </div>
    </div>
  );
};

export default MFSLandingView;