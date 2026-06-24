import React from 'react';
import { Link } from 'react-router-dom';
import { useCompareSelection } from '../CompareSelectionContext';

const CompareTray: React.FC = () => {
  const { selectedItems, selectedCount, removeSelection, clearSelection } = useCompareSelection();
  const canCompare = selectedCount >= 2;
  const missingForCompare = Math.max(0, 2 - selectedCount);

  const primaryButtonClass =
    'inline-flex items-center rounded-md border border-lt-primary bg-lt-primary px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary';
  const secondaryButtonClass =
    'inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary';
  const dangerButtonClass =
    'inline-flex items-center rounded-md border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-700 shadow-sm transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary';

  if (selectedCount === 0) {
    return null;
  }

  return (
    <section
      className="sticky bottom-3 mt-4 rounded-lt border border-lt-primaryBorder bg-lt-primarySoft/70 p-3 shadow-lt backdrop-blur"
      aria-label="Vergelijkselectie"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <strong className="text-sm font-semibold text-lt-heading">Vergelijkselectie</strong>
          <span className="ml-1 text-sm text-lt-muted">{selectedCount}/4 geselecteerd</span>
          {!canCompare ? (
            <div className="mt-1 text-sm text-lt-muted">Selecteer nog {missingForCompare} technologie om te vergelijken.</div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/legaltechnologies/selection" className={secondaryButtonClass}>
            Beheer selectie
          </Link>
          <Link
            to="/legaltechnologies/compare"
            className={canCompare ? primaryButtonClass : `${secondaryButtonClass} cursor-not-allowed opacity-60`}
            aria-disabled={!canCompare}
            onClick={(e) => {
              if (!canCompare) {
                e.preventDefault();
              }
            }}
          >
            {canCompare ? 'Vergelijk nu' : 'Nog niet beschikbaar'}
          </Link>
          <button type="button" className={dangerButtonClass} onClick={clearSelection}>
            Reset
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {selectedItems.map((item) => (
          <div
            key={item.id}
            className="inline-flex items-center gap-2 rounded-full border border-lt-primaryBorder bg-white px-3 py-1.5 text-sm font-medium text-lt-text"
          >
            <span>{item.naam || item.id}</span>
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-xs text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lt-primary"
              onClick={() => removeSelection(item.id)}
              aria-label={`Verwijder ${item.naam || item.id} uit selectie`}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CompareTray;
