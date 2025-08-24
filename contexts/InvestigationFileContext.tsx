import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { InvestigationFile, InvestigationFileContextType } from '../types';

export const InvestigationFileContext = createContext<InvestigationFileContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'investigationFiles';

export const InvestigationFileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [investigationFiles, setInvestigationFiles] = useState<InvestigationFile[]>(() => {
    try {
      const storedFiles = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedFiles ? JSON.parse(storedFiles) : [];
    } catch (error) {
      console.error("Error loading investigation files from localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(investigationFiles));
    } catch (error) {
      console.error("Error saving investigation files to localStorage:", error);
    }
  }, [investigationFiles]);

  const addFile = useCallback((fileData: Omit<InvestigationFile, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newFile: InvestigationFile = {
      ...fileData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setInvestigationFiles(prev => [...prev, newFile]);
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<Omit<InvestigationFile, 'id' | 'createdAt'>>) => {
    setInvestigationFiles(prev =>
      prev.map(file =>
        file.id === id
          ? { ...file, ...updates, updatedAt: new Date().toISOString() }
          : file
      )
    );
  }, []);

  const deleteFile = useCallback((id: string) => {
    setInvestigationFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  return (
    <InvestigationFileContext.Provider value={{ investigationFiles, addFile, updateFile, deleteFile }}>
      {children}
    </InvestigationFileContext.Provider>
  );
};

export const useInvestigationFileContext = (): InvestigationFileContextType => {
  const context = useContext(InvestigationFileContext);
  if (!context) {
    throw new Error('useInvestigationFileContext must be used within an InvestigationFileProvider');
  }
  return context;
};
