import React from "react";
import { Link } from "react-router-dom";
import type {
  PolicyCycleRailCommands,
  PolicyCycleRailContext,
} from "./rightRailTypes";
import { documentationSectionLink } from "../../app/routeContext";

type PolicyCycleRailProps = {
  context: PolicyCycleRailContext;
  commands: PolicyCycleRailCommands;
};

const MAX_ITEMS = 5;

const SECTION_THEME = {
  technology: {
    container: "border border-primary-subtle bg-primary-subtle",
    heading: "text-primary-emphasis",
    item: "bg-white border border-primary-subtle text-primary-emphasis",
  },
  input: {
    container: "border border-info-subtle bg-info-subtle",
    heading: "text-info-emphasis",
    item: "bg-white border border-info-subtle text-info-emphasis",
  },
  output: {
    container: "border border-success-subtle bg-success-subtle",
    heading: "text-success-emphasis",
    item: "bg-white border border-success-subtle text-success-emphasis",
  },
} as const;

const ListSection: React.FC<{
  title: string;
  kind: "technology" | "input" | "output";
  values: Array<{ id: string; label: string }>;
  activeHighlight: PolicyCycleRailContext["relationHighlight"];
  onItemClick: (
    kind: "technology" | "input" | "output",
    id: string,
    label: string,
  ) => void;
}> = ({ title, kind, values, activeHighlight, onItemClick }) => {
  const [expanded, setExpanded] = React.useState(false);
  const visibleItems = expanded ? values : values.slice(0, MAX_ITEMS);
  const hiddenCount = Math.max(values.length - MAX_ITEMS, 0);
  const theme = SECTION_THEME[kind];

  return (
    <section className={`rounded px-2 py-2 ${theme.container}`}>
      <div className="d-flex align-items-center justify-content-between">
        <h4 className={`small text-uppercase mb-0 ${theme.heading}`}>
          {title}
        </h4>
        <span className="badge text-bg-light">{values.length}</span>
      </div>

      {values.length > 0 ? (
        <ul className="small mb-0 mt-2 d-grid gap-1 ps-0 list-unstyled">
          {visibleItems.map((value) => (
            <li key={`${title}-${value.id}`}>
              <button
                type="button"
                className={`btn btn-sm w-100 text-start py-1 px-2 ${theme.item} ${
                  activeHighlight?.kind === kind &&
                  activeHighlight.id === value.id
                    ? "fw-semibold text-decoration-underline"
                    : ""
                }`}
                onClick={() => onItemClick(kind, value.id, value.label)}
              >
                {value.label}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="small text-muted mb-0 mt-2">Geen items</p>
      )}

      {hiddenCount > 0 ? (
        <button
          type="button"
          className="btn btn-link btn-sm p-0 mt-2"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Minder tonen" : `+${hiddenCount} meer`}
        </button>
      ) : null}
    </section>
  );
};

const PolicyCycleRail: React.FC<PolicyCycleRailProps> = ({
  context,
  commands,
}) => (
  <>
    <div className="app-context-card">
      <h3 className="app-context-title">Beleidscyclus weergave</h3>
      <p className="app-context-copy mb-2">
        Selecteer welke extra gegevens per taak zichtbaar zijn.
      </p>

      <div className="d-grid gap-2">
        <label className="d-flex align-items-center gap-2 small">
          <input
            type="checkbox"
            checked={context.showTechnologies}
            onChange={(event) =>
              commands.setShowTechnologies(event.target.checked)
            }
          />
          Technologieen
        </label>

        <label className="d-flex align-items-center gap-2 small">
          <input
            type="checkbox"
            checked={context.showInputs}
            onChange={(event) => commands.setShowInputs(event.target.checked)}
          />
          Inputproducten
        </label>

        <label className="d-flex align-items-center gap-2 small">
          <input
            type="checkbox"
            checked={context.showOutputs}
            onChange={(event) => commands.setShowOutputs(event.target.checked)}
          />
          Outputproducten
        </label>
      </div>
    </div>

    {context.activeTask ? (
      <div className="app-context-card">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <h3 className="app-context-title mb-0">Actieve taak</h3>
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
            aria-label="Deselecteer context"
            onClick={() => {
              commands.clearActiveTask();
              commands.clearRelationHighlight();
            }}
          >
            Wissen
          </button>
        </div>

        <div className="fw-semibold mb-1">{context.activeTask.label}</div>
        <span className="badge text-bg-secondary mb-2">
          {context.activeTask.taskGroup}
        </span>
        {context.activeTask.definition ? (
          <div className="rounded border border-warning-subtle bg-warning-subtle px-2 py-2 mb-3">
            <h4 className="small text-uppercase text-warning-emphasis mb-1">
              Definitie
            </h4>
            <p className="app-context-copy mb-0">
              {context.activeTask.definition}
            </p>
          </div>
        ) : null}

        <div className="d-grid gap-2 mb-3">
          <ListSection
            title="Technologieen"
            kind="technology"
            activeHighlight={context.relationHighlight}
            onItemClick={commands.setRelationHighlight}
            values={context.activeTask.technologies.map((item) => ({
              id: item.iri,
              label: item.naam,
            }))}
          />
          <ListSection
            title="Inputproducten"
            kind="input"
            activeHighlight={context.relationHighlight}
            onItemClick={commands.setRelationHighlight}
            values={context.activeTask.inputs.map((item) => ({
              id: item.uri,
              label: item.label,
            }))}
          />
          <ListSection
            title="Outputproducten"
            kind="output"
            activeHighlight={context.relationHighlight}
            onItemClick={commands.setRelationHighlight}
            values={context.activeTask.outputs.map((item) => ({
              id: item.uri,
              label: item.label,
            }))}
          />
        </div>

        {context.relationHighlight ? (
          <p className="app-context-copy mb-2 rounded bg-light px-2 py-1">
            Filter actief: <strong>{context.relationHighlight.label}</strong>
            <button
              type="button"
              className="btn btn-link btn-sm p-0 ms-2 align-baseline"
              onClick={commands.clearRelationHighlight}
            >
              wissen
            </button>
          </p>
        ) : null}

        {context.relationHighlight &&
        context.relationHighlight.kind == "technology" ? (
          <div className="app-context-links">
            <Link
              to={`${encodeURIComponent(context.relationHighlight.id)}`}
              className="app-context-link"
            >
              Open detailpagina
            </Link>
            <Link
              to={documentationSectionLink(
                "catalogus",
                context.relationHighlight.id,
              )}
              className="app-context-link"
            >
              Open documentatiehub
            </Link>
          </div>
        ) : null}
      </div>
    ) : null}
  </>
);

export default PolicyCycleRail;
