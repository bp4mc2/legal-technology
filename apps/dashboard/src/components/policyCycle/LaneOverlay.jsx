const laneBgClasses = [
  "bg-blue-100/55",
  "bg-violet-100/55",
  "bg-amber-100/55",
  "bg-emerald-100/55",
];

const laneBorderClasses = [
  "border-r border-blue-300/30",
  "border-r border-violet-300/30",
  "border-r border-amber-300/30",
  "border-r border-emerald-300/30",
];

const laneTextClasses = [
  "text-blue-900",
  "text-violet-900",
  "text-amber-900",
  "text-emerald-900",
];

export default function LaneOverlay({ groupMap, laneHeights = {} }) {

  return (
    <div className="pointer-events-none absolute inset-y-0 left-[17px] z-[2] flex gap-[25px]">
      {Object.keys(groupMap).map((group, index) => (
        <div
          key={group}
          className={`relative box-border w-[325px] shrink-0 ${laneBgClasses[index % laneBgClasses.length]} ${laneBorderClasses[index % laneBorderClasses.length]}`}
          style={{ height: `${laneHeights[group] ?? 0}px` }}
        >
          <div
            className={`absolute left-2.5 top-2.5 px-1.5 py-1 text-[9px] font-bold uppercase ${laneTextClasses[index % laneTextClasses.length]}`}
          >
            {group}
          </div>
        </div>
      ))}
    </div>
  );
};
