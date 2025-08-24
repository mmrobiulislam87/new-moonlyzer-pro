import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { LicenseContextType, LicenseLevel } from '../types';

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

const tierOrder: Record<LicenseLevel, number> = {
  [LicenseLevel.FREE]: 0,
  [LicenseLevel.STANDARD]: 1,
  [LicenseLevel.PROFESSIONAL]: 2,
};

export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [licenseLevel, setLicenseLevel] = useState<LicenseLevel>(LicenseLevel.FREE);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true to check localStorage
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedKey = localStorage.getItem('licenseKey');
      const storedLevel = localStorage.getItem('licenseLevel') as LicenseLevel;
      if (storedKey && storedLevel && Object.values(LicenseLevel).includes(storedLevel)) {
        setLicenseKey(storedKey);
        setLicenseLevel(storedLevel);
      }
    } catch (e) {
      console.error("Failed to access localStorage for license:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const activateLicense = useCallback(async (key: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the Rust backend function via Tauri's invoke API
      const newLevel = await invoke<LicenseLevel>('validate_license', { licenseKey: key });

      setLicenseKey(key);
      setLicenseLevel(newLevel);
      localStorage.setItem('licenseKey', key);
      localStorage.setItem('licenseLevel', newLevel);
    } catch (err: any) {
      console.error("Error activating license via Tauri:", err);
      // The error from Rust is typically a string
      setError(typeof err === 'string' ? err : 'Invalid or expired license key.');
      // Optional: Keep old license if activation fails, or clear it.
      // For now, we'll just show the error and let the user retry.
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isFeatureAllowed = useCallback((requiredLevel: LicenseLevel) => {
    return tierOrder[licenseLevel] >= tierOrder[requiredLevel];
  }, [licenseLevel]);

  return (
    <LicenseContext.Provider value={{ licenseKey, licenseLevel, isLoading, error, activateLicense, isFeatureAllowed }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = (): LicenseContextType => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};
