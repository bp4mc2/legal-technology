// nodes/TaskNode.jsx
import { Handle, Position } from "reactflow";

const MAX_ITEMS = 4;

const SECTION_THEME = {
  Technologieen: {
    container: "border border-primary-subtle bg-primary-subtle",
    heading: "text-primary-emphasis",
    item: "bg-white border border-primary-subtle text-primary-emphasis",
  },
  Input: {
    container: "border border-info-subtle bg-info-subtle",
    heading: "text-info-emphasis",
    item: "bg-white border border-info-subtle text-info-emphasis",
  },
  Output: {
    container: "border border-success-subtle bg-success-subtle",
    heading: "text-success-emphasis",
    item: "bg-white border border-success-subtle text-success-emphasis",
  },
};

export default function TaskNode({ data }) {
  const renderItems = (title, items, getLabel) => {
    const sectionItems = items || [];
    const visibleItems = sectionItems.slice(0, MAX_ITEMS);
    const hiddenCount = Math.max(sectionItems.length - MAX_ITEMS, 0);
    const theme = SECTION_THEME[title];

    if (sectionItems.length === 0) {
      return null;
    }

    return (
      <div className={`mt-2 rounded px-2 py-2 ${theme.container}`}>
        <div className="d-flex align-items-center justify-content-between">
          <div className={`text-[10px] font-bold uppercase tracking-wide ${theme.heading}`}>
            {title}
          </div>
          <span className="badge text-bg-light">{sectionItems.length}</span>
        </div>

        <ul className="mt-2 d-grid gap-1 list-unstyled text-xs mb-0">
          {visibleItems.map((item) => (
            <li
              key={item.uri || item.iri}
              className={`truncate rounded border px-2 py-1 ${theme.item}`}
            >
              <span className="d-block text-truncate">{getLabel(item)}</span>
            </li>
          ))}
        </ul>

        {hiddenCount > 0 && (
          <div className="mt-1 text-[11px] font-semibold text-slate-500">+{hiddenCount} meer</div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full px-3 py-2 rounded-xl bg-yellow-100 border border-yellow-300 shadow-sm">

     {/* Left across lane */}
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        style={{ left: 0, transform: "translate(0, -50%)" }}
      />

      {/* Top within the same lane */}
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        style={{ top: 0, transform: "translate(-50%, 0)" }}
      />

      {/* Right across lane */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        style={{ right: 0, transform: "translate(0, -50%)" }}
      />

      {/* Downwards within the same lane */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        style={{ bottom: 0, transform: "translate(-50%, 0)" }}
      />

      <div className="text-[9px] font-bold uppercase text-yellow-700">Taak</div>
      <div className="text-sm font-semibold">{data.label}</div>

      {data.showTechnologies &&
        renderItems("Technologieen", data.technologies, (item) => item.naam)}
      {data.showInputs &&
        renderItems("Input", data.inputs, (item) => item.label)}
      {data.showOutputs &&
        renderItems("Output", data.outputs, (item) => item.label)}
    </div>
  );
}