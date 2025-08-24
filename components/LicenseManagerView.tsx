import React, { useState } from 'react';
import { KeyRound, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useLicense } from '../contexts/LicenseContext';
import { LicenseLevel } from '../types';

const LicenseManagerView: React.FC = () => {
    const { licenseKey, licenseLevel, isLoading, error, activateLicense } = useLicense();
    const [inputKey, setInputKey] = useState('');
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (inputKey.trim()) {
            await activateLicense(inputKey.trim());
        }
    };

    const getLicensePillClass = (level: LicenseLevel) => {
        switch(level) {
            case LicenseLevel.PROFESSIONAL: return 'bg-green-100 text-green-800 border-green-300';
            case LicenseLevel.STANDARD: return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <div className="p-6 bg-surface rounded-xl shadow-lg border border-neutral-light max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-textPrimary mb-4 flex items-center">
                <KeyRound size={24} className="mr-3 text-primary" />
                License Management
            </h2>
            
            <div className="mb-6 p-4 bg-neutral-lightest rounded-lg border border-neutral-light">
                <h3 className="text-sm font-medium text-textSecondary">Current License Status</h3>
                <div className={`mt-2 inline-flex items-center px-4 py-1.5 rounded-full text-lg font-bold border ${getLicensePillClass(licenseLevel)}`}>
                    {licenseLevel}
                </div>
                {licenseKey && (
                    <p className="text-xs text-textSecondary mt-2">
                        Activated Key: <span className="font-mono bg-neutral-light px-1 py-0.5 rounded">{licenseKey.slice(0, 8)}...</span>
                    </p>
                )}
            </div>

            <div className="p-4 bg-neutral-lightest rounded-lg border border-neutral-light">
                 <h3 className="text-md font-semibold text-textPrimary mb-3">Activate or Change License</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="licenseKeyInput" className="block text-sm font-medium text-textSecondary mb-1">
                            Enter License Key:
                        </label>
                        <input
                            id="licenseKeyInput"
                            type="text"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            placeholder="ZENMOON-..."
                            className="w-full p-2 border border-neutral-light rounded-md font-mono focus:ring-2 focus:ring-primary-light"
                            disabled={isLoading}
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLoading || !inputKey.trim()}
                        className="w-full flex items-center justify-center px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-1 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin mr-2" />
                        ) : (
                            <CheckCircle size={20} className="mr-2" />
                        )}
                        {isLoading ? 'Activating...' : 'Activate License'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-danger-lighter text-danger-darker rounded-md border border-danger-light text-sm flex items-center">
                        <AlertTriangle size={18} className="mr-2"/>
                        {error}
                    </div>
                )}
                {!error && !isLoading && licenseKey && (
                     <div className="mt-4 p-3 bg-success-lighter text-success-darker rounded-md border border-success-light text-sm flex items-center">
                        <CheckCircle size={18} className="mr-2"/>
                        License is active.
                    </div>
                )}
            </div>
        </div>
    );
};

export default LicenseManagerView;