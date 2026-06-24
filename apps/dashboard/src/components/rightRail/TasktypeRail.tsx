import React from 'react';
import type { TasktypeRailCommands, TasktypeRailContext } from './rightRailTypes';

type TasktypeRailProps = {
  context: TasktypeRailContext;
  commands: TasktypeRailCommands;
};

const TasktypeRail: React.FC<TasktypeRailProps> = ({ context, commands }) => (
  <>
    {context.activeGroup ? (
      <div className="app-context-card">
        <h3 className="app-context-title">Taakgroep</h3>
        <p className="app-context-copy mb-2">{context.activeGroup}</p>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={commands.clearFilters}>
          Wis taakgroepfilter
        </button>
      </div>
    ) : null}

    <div className="app-context-card">
      <div className="d-flex align-items-center justify-content-between">
        <h3 className="app-context-title">Filters</h3>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={commands.clearFilters}>
          Reset
        </button>
      </div>

      <div className="d-grid gap-2 mt-2">
        <div>
          <label className="lt-filter-label form-label small mb-1">Zoekterm</label>
          <input
            type="search"
            className="form-control form-control-sm"
            placeholder="Zoek..."
            value={context.filters.search}
            onChange={(e) => commands.setFilter('search', e.target.value)}
          />
        </div>

        <div>
          <label className="lt-filter-label form-label small mb-1">Gebruikersgroep</label>
          <select
            className="form-select form-select-sm"
            value={context.filters.gebruikersgroepFilter}
            onChange={(e) => commands.setFilter('gebruikersgroepFilter', e.target.value)}
          >
            <option value="">Alle</option>
            {context.options.gebruikersgroepen.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="lt-filter-label form-label small mb-1">Licentievorm</label>
          <select
            className="form-select form-select-sm"
            value={context.filters.licentievormFilter}
            onChange={(e) => commands.setFilter('licentievormFilter', e.target.value)}
          >
            <option value="">Alle</option>
            {context.options.licentievormen.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="lt-filter-label form-label small mb-1">Beschouwingsniveau</label>
          <select
            className="form-select form-select-sm"
            value={context.filters.beschouwingsniveauFilter}
            onChange={(e) => commands.setFilter('beschouwingsniveauFilter', e.target.value)}
          >
            <option value="">Alle</option>
            {context.options.beschouwingsniveaus.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  </>
);

export default TasktypeRail;
