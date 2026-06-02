import React from 'react';

export type ActiveTechnology = {
  id: string;
  naam: string;
  omschrijving?: string;
  gebruiksstatus?: string;
  licentievorm?: string;
  subtype?: string;
  versienummer?: string;
  beoogdeGebruikers?: string[];
  gebodenFunctionaliteit?: string[];
  technologietype?: string;
  typeTechnologie?: string[];
  taaktypes?: string[];
  ondersteuningsniveaus?: Array<{ beschouwingsniveau: string; modelsoort: string }>;
};

type ActiveTechnologyContextValue = {
  activeTechnology: ActiveTechnology | null;
  setActiveTechnology: (tech: ActiveTechnology | null) => void;
};

const ActiveTechnologyContext = React.createContext<ActiveTechnologyContextValue>({
  activeTechnology: null,
  setActiveTechnology: () => {},
});

export const ActiveTechnologyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTechnology, setActiveTechnology] = React.useState<ActiveTechnology | null>(null);

  return (
    <ActiveTechnologyContext.Provider value={{ activeTechnology, setActiveTechnology }}>
      {children}
    </ActiveTechnologyContext.Provider>
  );
};

export const useActiveTechnology = () => React.useContext(ActiveTechnologyContext);
