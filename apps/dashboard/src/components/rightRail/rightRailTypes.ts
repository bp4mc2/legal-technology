import type { ActiveTechnology } from '../ActiveTechnologyContext';
import type { RouteContext } from '../../app/routeContext';

export type TasktypeRailContext = {
  taskGroups: Array<{ groupLabel: string; tasktypeCount: number }>;
  activeGroup: string | null;
  filters: {
    search: string;
    gebruikersgroepFilter: string;
    licentievormFilter: string;
    beschouwingsniveauFilter: string;
  };
  options: {
    gebruikersgroepen: string[];
    licentievormen: string[];
    beschouwingsniveaus: string[];
  };
  summary: {
    tasktypeCount: number;
    groupCount: number;
  };
};

export type TasktypeRailCommands = {
  clearFilters: () => void;
  setFilter: (
    key: 'search' | 'gebruikersgroepFilter' | 'licentievormFilter' | 'beschouwingsniveauFilter',
    value: string,
  ) => void;
};

export type RelationsRailContext = {
  route: 'tasks-products' | 'contribution-map';
  selection: {
    taskGroupLabel?: string;
    taskTypeLabel?: string;
    productId?: string;
    productLabel?: string;
    technologyIds: string[];
    technologyNames?: string[];
  };
  metrics: {
    productCount: number;
    technologyCount: number;
    warningCount: number;
  };
  filters: Record<string, string>;
};

export type RelationsRailCommands = {
  selectFirstTaskgroup: () => void;
  resetFilters: () => void;
};

export type PolicyCycleRailContext = {
  showInputs: boolean;
  showOutputs: boolean;
  showTechnologies: boolean;
  relationHighlight: {
    kind: 'technology' | 'input' | 'output';
    id: string;
    label: string;
  } | null;
  activeTask: {
    uri: string;
    label: string;
    taskGroup: string;
    definition?: string;
    inputs: Array<{ uri: string; label: string }>;
    outputs: Array<{ uri: string; label: string }>;
    technologies: Array<{ iri: string; naam: string }>;
  } | null;
};

export type PolicyCycleRailCommands = {
  setShowInputs: (value: boolean) => void;
  setShowOutputs: (value: boolean) => void;
  setShowTechnologies: (value: boolean) => void;
  setRelationHighlight: (
    kind: 'technology' | 'input' | 'output',
    id: string,
    label: string,
  ) => void;
  clearRelationHighlight: () => void;
  clearActiveTask: () => void;
};

export type RightRailState =
  | { type: 'routeInfo'; context: RouteContext }
  | { type: 'technology'; technology: ActiveTechnology; clearTechnology: () => void }
  | { type: 'technologyDetail'; technology: ActiveTechnology }
  | { type: 'tasktype'; context: TasktypeRailContext; commands: TasktypeRailCommands }
  | { type: 'relations'; context: RelationsRailContext; commands: RelationsRailCommands }
  | { type: 'policyCycle'; context: PolicyCycleRailContext; commands: PolicyCycleRailCommands };
