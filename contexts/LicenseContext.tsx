import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
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
    
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const trimmedKey = key.trim();
      let newLevel: LicenseLevel | null = null;
      
      if (trimmedKey.startsWith("ZM-PRO-")) {
        newLevel = LicenseLevel.PROFESSIONAL;
      } else if (trimmedKey.startsWith("ZM-STD-")) {
        newLevel = LicenseLevel.STANDARD;
      }

      if (newLevel) {
        setLicenseKey(trimmedKey);
        setLicenseLevel(newLevel);
        localStorage.setItem('licenseKey', trimmedKey);
        localStorage.setItem('licenseLevel', newLevel);
      } else {
        throw new Error('Invalid or unrecognized license key format.');
      }
    } catch (err: any) {
      console.error("Error activating license:", err);
      setError(err.message || 'Invalid or expired license key.');
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
