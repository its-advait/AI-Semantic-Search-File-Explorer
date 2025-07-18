"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ModelContextType {
  isModelLoaded: boolean;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider = ({ children }: { children: ReactNode }) => {
  const [isModelLoaded, setIsModelLoaded] = useState(true); // Model is always considered loaded now

  // No useEffect needed for model initialization

  return (
    <ModelContext.Provider value={{ isModelLoaded }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};
