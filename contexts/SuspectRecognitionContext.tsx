import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RecognizedSuspect, SuspectRecognitionContextType } from '../types';

export const SuspectRecognitionContext = createContext<SuspectRecognitionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'recognizedSuspects';

export const SuspectRecognitionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recognizedSuspects, setRecognizedSuspects] = useState<RecognizedSuspect[]>(() => {
    try {
      const storedSuspects = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedSuspects ? JSON.parse(storedSuspects) : [];
    } catch (error) {
      console.error("Error loading recognized suspects from localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recognizedSuspects));
    } catch (error) {
      console.error("Error saving recognized suspects to localStorage:", error);
    }
  }, [recognizedSuspects]);

  const addSuspect = useCallback((suspectData: Omit<RecognizedSuspect, 'id' | 'uploadedAt'>) => {
    const newSuspect: RecognizedSuspect = {
      ...suspectData,
      id: uuidv4(),
      uploadedAt: new Date().toISOString(),
    };
    setRecognizedSuspects(prev => [...prev, newSuspect]);
  }, []);

  const deleteSuspect = useCallback((id: string) => {
    setRecognizedSuspects(prev => prev.filter(s => s.id !== id));
  }, []);

  return (
    <SuspectRecognitionContext.Provider value={{ recognizedSuspects, addSuspect, deleteSuspect }}>
      {children}
    </SuspectRecognitionContext.Provider>
  );
};

export const useSuspectRecognitionContext = (): SuspectRecognitionContextType => {
  const context = useContext(SuspectRecognitionContext);
  if (!context) {
    throw new Error('useSuspectRecognitionContext must be used within a SuspectRecognitionProvider');
  }
  return context;
};
