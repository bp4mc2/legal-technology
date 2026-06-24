import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CompareSelectionProvider, useCompareSelection } from '../src/components/CompareSelectionContext';

const STORAGE_KEY = 'dashboard.compareSelection.v1';

const HookProbe: React.FC = () => {
  const { selectedCount, selectedIds, toggleSelection, clearSelection } = useCompareSelection();

  return (
    <div>
      <div aria-label="selected-count">{selectedCount}</div>
      <div aria-label="selected-ids">{selectedIds.join(',')}</div>
      <button
        type="button"
        onClick={() =>
          toggleSelection({
            id: 'tech-1',
            naam: 'Tech One',
            licentievorm: 'Open Source',
          })
        }
      >
        Add first
      </button>
      <button
        type="button"
        onClick={() =>
          toggleSelection({
            id: 'tech-2',
            naam: 'Tech Two',
            gebruiksstatus: 'In gebruik',
          })
        }
      >
        Add second
      </button>
      <button type="button" onClick={clearSelection}>Clear</button>
    </div>
  );
};

describe('CompareSelectionProvider persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('hydrates selection from localStorage on initial render', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedIds: ['tech-1', 'tech-2'],
        itemsById: {
          'tech-1': { id: 'tech-1', naam: 'Tech One' },
          'tech-2': { id: 'tech-2', naam: 'Tech Two' },
        },
      }),
    );

    render(
      <CompareSelectionProvider>
        <HookProbe />
      </CompareSelectionProvider>,
    );

    expect(screen.getByLabelText('selected-count').textContent).toBe('2');
    expect(screen.getByLabelText('selected-ids').textContent).toBe('tech-1,tech-2');
  });

  it('persists selection updates to localStorage', () => {
    render(
      <CompareSelectionProvider>
        <HookProbe />
      </CompareSelectionProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add first' }));

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();

    const stored = JSON.parse(raw || '{}') as {
      selectedIds?: string[];
      itemsById?: Record<string, { id: string; naam?: string }>;
    };

    expect(stored.selectedIds).toEqual(['tech-1']);
    expect(stored.itemsById?.['tech-1']?.naam).toBe('Tech One');
  });

  it('clears persisted ids after reset', () => {
    render(
      <CompareSelectionProvider>
        <HookProbe />
      </CompareSelectionProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add first' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add second' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByLabelText('selected-count').textContent).toBe('0');

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as {
      selectedIds?: string[];
    };

    expect(stored.selectedIds).toEqual([]);
  });
});
