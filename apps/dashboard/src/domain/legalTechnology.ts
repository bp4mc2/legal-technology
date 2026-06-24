export type OndersteuningVoor = {
  beschouwingsniveau: string;
  modelsoort: string;
};

export type GeschiktVoorTaak = {
  omschrijving: string;
  taaktype: string;
};

export type LegalTechnology = {
  id?: string;
  iri?: string;
  subtype?: 'JuridischeTechnologie' | 'Methode' | 'Standaard' | 'Tool' | string;
  abbrevation?: string;
  versienummer?: string;
  naam: string;
  omschrijving?: string;
  gebruiksstatus?: string;
  licentievorm?: string;
  beoogde_gebruikers?: string[];
  geboden_functionaliteit?: string[];
  ondersteuning_voor?: OndersteuningVoor[];
  geschikt_voor_taak?: GeschiktVoorTaak[];
  technologietype?: string;
  type_technologie?: string[];
};

export type LegalTechnologySummary = {
  id?: string;
  naam: string;
};
