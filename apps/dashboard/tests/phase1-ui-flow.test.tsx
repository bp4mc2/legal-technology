import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppShell from '../src/components/AppShell';
import ComparePage from '../src/components/ComparePage';
import { CompareSelectionProvider, useCompareSelection } from '../src/components/CompareSelectionContext';
import { RightRailProvider } from '../src/components/rightRail/RightRailContext';

const STORAGE_KEY = 'dashboard.compareSelection.v1';

const SelectionActions: React.FC = () => {
  const { toggleSelection, removeSelection, clearSelection } = useCompareSelection();

  return (
    <div>
      <button
        type="button"
        onClick={() => toggleSelection({ id: 'tech-1', naam: 'Tech 1', gebruiksstatus: 'In gebruik' })}
      >
        Add tech 1
      </button>
      <button
        type="button"
        onClick={() => toggleSelection({ id: 'tech-2', naam: 'Tech 2', gebruiksstatus: 'Voorstel' })}
      >
        Add tech 2
      </button>
      <button type="button" onClick={() => removeSelection('tech-1')}>Remove tech 1</button>
      <button type="button" onClick={clearSelection}>Clear selection</button>
    </div>
  );
};

const renderShellHarness = () => {
  return render(
    <MemoryRouter initialEntries={['/legaltechnologies']}>
      <CompareSelectionProvider>
        <RightRailProvider>
          <AppShell>
            <div>Werkvlak</div>
            <SelectionActions />
          </AppShell>
        </RightRailProvider>
      </CompareSelectionProvider>
    </MemoryRouter>,
  );
};

describe('Phase 1 compare flow UI behavior', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows sticky tray only when there is at least one selection and supports remove/reset', () => {
    renderShellHarness();

    expect(screen.queryByLabelText('Vergelijkselectie')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add tech 1' }));
    expect(screen.getByLabelText('Vergelijkselectie')).toBeDefined();
    expect(screen.getByText(/1\/4 geselecteerd/i)).toBeDefined();
    expect(screen.getByText('Tech 1')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Remove tech 1' }));
    expect(screen.queryByLabelText('Vergelijkselectie')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add tech 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add tech 2' }));
    expect(screen.getByText(/2\/4 geselecteerd/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.queryByLabelText('Vergelijkselectie')).toBeNull();
  });

  it('disables compare action in tray for fewer than 2 selections and enables at 2', () => {
    renderShellHarness();

    fireEvent.click(screen.getByRole('button', { name: 'Add tech 1' }));
    const compareLinkDisabled = screen.getByRole('link', { name: 'Nog niet beschikbaar' });
    expect(compareLinkDisabled.getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByText(/Selecteer nog 1 technologie om te vergelijken./i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Add tech 2' }));
    const compareLinkEnabled = screen.getByRole('link', { name: 'Vergelijk nu' });
    expect(compareLinkEnabled.getAttribute('aria-disabled')).toBe('false');
  });

  it('shows minimum-selection message on compare page when fewer than 2 technologies are selected', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedIds: ['tech-1'],
        itemsById: {
          'tech-1': { id: 'tech-1', naam: 'Tech 1' },
        },
      }),
    );

    render(
      <MemoryRouter initialEntries={['/legaltechnologies/compare']}>
        <CompareSelectionProvider>
          <ComparePage />
        </CompareSelectionProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Vergelijken' })).toBeDefined();
    expect(screen.getByText(/Selecteer minimaal 2 technologieen om te vergelijken./i)).toBeDefined();
  });
});
