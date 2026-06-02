import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CompareSelectionItem = {
  id: string;
  naam?: string;
  omschrijving?: string;
  gebruiksstatus?: string;
  licentievorm?: string;
  versienummer?: string;
  subtype?: string;
};

type CompareSelectionContextValue = {
  selectedIds: string[];
  selectedSet: Set<string>;
  selectedItems: CompareSelectionItem[];
  selectedCount: number;
  canSelectMore: boolean;
  maxSelection: number;
  toggleSelection: (item: CompareSelectionItem) => void;
  removeSelection: (id: string) => void;
  clearSelection: () => void;
  isSelected: (id?: string) => boolean;
};

const MAX_SELECTION = 4;
const STORAGE_KEY = 'dashboard.compareSelection.v1';

type CompareSelectionStorageState = {
  selectedIds: string[];
  itemsById: Record<string, CompareSelectionItem>;
};

const dedupeIds = (ids: string[]) => {
  return Array.from(new Set(ids.filter(Boolean))).slice(0, MAX_SELECTION);
};

const loadInitialState = (): CompareSelectionStorageState => {
  if (typeof window === 'undefined') {
    return { selectedIds: [], itemsById: {} };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { selectedIds: [], itemsById: {} };
    }

    const parsed = JSON.parse(raw) as Partial<CompareSelectionStorageState>;
    const selectedIds = dedupeIds(Array.isArray(parsed.selectedIds) ? parsed.selectedIds : []);
    const itemsById =
      parsed.itemsById && typeof parsed.itemsById === 'object' && !Array.isArray(parsed.itemsById)
        ? parsed.itemsById
        : {};

    return { selectedIds, itemsById };
  } catch {
    return { selectedIds: [], itemsById: {} };
  }
};

const CompareSelectionContext = createContext<CompareSelectionContextValue | undefined>(undefined);

export const CompareSelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => loadInitialState().selectedIds);
  const [itemsById, setItemsById] = useState<Record<string, CompareSelectionItem>>(() => loadInitialState().itemsById);

  const toggleSelection = (item: CompareSelectionItem) => {
    if (!item.id) {
      return;
    }

    setItemsById((prev) => ({ ...prev, [item.id]: { ...prev[item.id], ...item } }));

    setSelectedIds((prev) => {
      if (prev.includes(item.id)) {
        return prev.filter((id) => id !== item.id);
      }
      if (prev.length >= MAX_SELECTION) {
        return prev;
      }
      return [...prev, item.id];
    });
  };

  const removeSelection = (id: string) => {
    setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const payload: CompareSelectionStorageState = {
      selectedIds,
      itemsById,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage write failures to keep UI interaction responsive.
    }
  }, [selectedIds, itemsById]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedItems = useMemo(
    () => selectedIds.map((id) => itemsById[id] || { id }).filter((item) => !!item.id),
    [selectedIds, itemsById],
  );

  const value = useMemo<CompareSelectionContextValue>(
    () => ({
      selectedIds,
      selectedSet,
      selectedItems,
      selectedCount: selectedIds.length,
      canSelectMore: selectedIds.length < MAX_SELECTION,
      maxSelection: MAX_SELECTION,
      toggleSelection,
      removeSelection,
      clearSelection,
      isSelected: (id?: string) => (id ? selectedSet.has(id) : false),
    }),
    [selectedIds, selectedSet, selectedItems],
  );

  return <CompareSelectionContext.Provider value={value}>{children}</CompareSelectionContext.Provider>;
};

export const useCompareSelection = () => {
  const context = useContext(CompareSelectionContext);
  if (!context) {
    throw new Error('useCompareSelection must be used within CompareSelectionProvider');
  }
  return context;
};
