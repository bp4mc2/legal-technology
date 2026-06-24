import React from 'react';
import type { RightRailState } from './rightRailTypes';

type RightRailContextValue = {
  railState: RightRailState | null;
  setRailState: (state: RightRailState | null) => void;
  clearRailState: () => void;
};

const RightRailContext = React.createContext<RightRailContextValue | undefined>(undefined);

export const RightRailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [railState, setRailState] = React.useState<RightRailState | null>(null);
  const clearRailState = React.useCallback(() => setRailState(null), []);

  const value = React.useMemo(
    () => ({ railState, setRailState, clearRailState }),
    [railState, clearRailState],
  );

  return <RightRailContext.Provider value={value}>{children}</RightRailContext.Provider>;
};

export const useRightRail = () => {
  const context = React.useContext(RightRailContext);
  if (!context) {
    throw new Error('useRightRail must be used within RightRailProvider');
  }
  return context;
};
