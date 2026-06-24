import React from "react";
// import { Link, useSearchParams } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useViewport,
  Node,
  Edge,
  MarkerType,
} from "reactflow";

import "reactflow/dist/style.css";
import TaskNode from "./policyCycle/TaskNode";
import ReturnFlowEdge from "./policyCycle/ReturnFlowEdge";

import { apiFetch } from "../utils/api";
import LaneOverlay from "./policyCycle/LaneOverlay";
import { useRightRail } from "./rightRail/RightRailContext";

type ConceptRef = {
  uri: string;
  label: string;
};

type LegalTechnologyRef = {
  iri: string;
  naam: string;
};

type Capability = {
  uri: string;
  label: string;
  definition?: string;
  taskGroup: string;
  inputs: ConceptRef[];
  outputs: ConceptRef[];
  follows: ConceptRef[];
  order?: number;
  technologies: LegalTechnologyRef[];
  hasTechnology: boolean;
  maturity: string;
  gaps: string[];
};

type NodeData = {
  label: string;
  nodeType: "task";
  uri: string;
  definition?: string;
  phase?: string;
  taskGroup?: string;
  inputs?: ConceptRef[];
  outputs?: ConceptRef[];
  technologies?: LegalTechnologyRef[];
  showInputs?: boolean;
  showOutputs?: boolean;
  showTechnologies?: boolean;
};

type CustomNode = Node<NodeData>;
type CustomEdgeData = {
  edgeType: "dataflow" | "process" | "tech" | "gap";
  returnLaneY?: number;
};
type CustomEdge = Edge<CustomEdgeData>;

const LANE_LEFT_OFFSET = 17;
const LANE_GAP = 25;
const LANE_WIDTH = 325;
const LANE_INNER_PADDING = 10;
const LANE_HANDLE_CLEARANCE = 0;
const LANE_TOP_CONTENT_OFFSET = 56;
const RETURN_FLOW_CLEARANCE = 72;

const nodeTypes = {
  task: TaskNode
};

const edgeTypes = {
  returnflow: ReturnFlowEdge,
};

const SyncedLaneOverlay: React.FC<{
  groupMap: Record<string, Capability[]>;
  laneHeights: Record<string, number>;
}> = ({ groupMap, laneHeights }) => {
  const { x, y, zoom } = useViewport();
  const transformLayerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!transformLayerRef.current) {
      return;
    }

    transformLayerRef.current.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`;
    transformLayerRef.current.style.transformOrigin = "0 0";
  }, [x, y, zoom]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[2]">
      <div ref={transformLayerRef} className="relative h-full w-full">
        <LaneOverlay groupMap={groupMap} laneHeights={laneHeights} />
      </div>
    </div>
  );
};

const groupByTaskGroup = (tasks: Capability[]) => {
  const groups: Record<string, Capability[]> = {};

  tasks.forEach((task) => {
    const group = task.taskGroup || "Overig";

    if (!groups[group]) groups[group] = [];

    groups[group].push(task);
  });

  return groups;
};

const sortGroupsAlphabetically = (groups: Record<string, Capability[]>) =>
  Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b, "nl", { sensitivity: "base" }))
    .reduce<Record<string, Capability[]>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

const sortTasksByFollows = (tasks: Capability[]) => {
  if (tasks.length <= 1) {
    return tasks;
  }

  const byUri = new Map(tasks.map((task) => [task.uri, task]));
  const originalIndex = new Map(tasks.map((task, index) => [task.uri, index]));
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  const compareTasks = (a: Capability, b: Capability) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    const aIndex = originalIndex.get(a.uri) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = originalIndex.get(b.uri) ?? Number.MAX_SAFE_INTEGER;

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return a.label.localeCompare(b.label, "nl", { sensitivity: "base" });
  };

  tasks.forEach((task) => {
    indegree.set(task.uri, 0);
    adjacency.set(task.uri, []);
  });

  tasks.forEach((task) => {
    task.follows?.forEach((prev) => {
      if (!byUri.has(prev.uri) || prev.uri === task.uri) {
        return;
      }

      adjacency.get(prev.uri)?.push(task.uri);
      indegree.set(task.uri, (indegree.get(task.uri) ?? 0) + 1);
    });
  });

  const queue = tasks
    .filter((task) => (indegree.get(task.uri) ?? 0) === 0)
    .sort(compareTasks);
  const ordered: Capability[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    ordered.push(current);

    (adjacency.get(current.uri) ?? []).forEach((nextUri) => {
      const nextIndegree = (indegree.get(nextUri) ?? 0) - 1;
      indegree.set(nextUri, nextIndegree);

      if (nextIndegree === 0) {
        const nextTask = byUri.get(nextUri);
        if (nextTask) {
          queue.push(nextTask);
          queue.sort(compareTasks);
        }
      }
    });
  }

  if (ordered.length === tasks.length) {
    return ordered;
  }

  // Fallback for cycles or malformed dependencies: keep deterministic order.
  const remaining = tasks
    .filter((task) => !ordered.some((item) => item.uri === task.uri))
    .sort(compareTasks);

  return [...ordered, ...remaining];
};

type VisibilityOptions = {
  showInputs: boolean;
  showOutputs: boolean;
  showTechnologies: boolean;
};

type RelationHighlight = {
  kind: "technology" | "input" | "output";
  id: string;
  label: string;
} | null;

const summarizeConcepts = (concepts: ConceptRef[] | undefined, maxVisible = 1) => {
  if (!concepts || concepts.length === 0) {
    return "";
  }

  const visible = concepts.slice(0, maxVisible).map((concept) => concept.label);
  const hiddenCount = Math.max(concepts.length - maxVisible, 0);

  return hiddenCount > 0 ? `${visible.join(", ")} +${hiddenCount}` : visible.join(", ");
};

const buildEdgeProductLabel = (
  sourceTask: Capability | undefined,
  targetTask: Capability,
): string | undefined => {
  const outputSummary = summarizeConcepts(sourceTask?.outputs);
  const inputSummary = summarizeConcepts(targetTask.inputs);

  if (!outputSummary && !inputSummary) {
    return undefined;
  }

  if (outputSummary && inputSummary) {
    return `OUT => ${outputSummary} | <= IN ${inputSummary}`;
  }

  return outputSummary ? `OUT => ${outputSummary}` : `<= IN ${inputSummary}`;
};

const layoutByTaskGroup = (tasks: Capability[], visibility: VisibilityOptions) => {
  const nodes: CustomNode[] = [];
  const edges: CustomEdge[] = [];
  const laneHeights: Record<string, number> = {};
  const taskByUri = new Map(tasks.map((task) => [task.uri, task]));

  const groupMap = sortGroupsAlphabetically(groupByTaskGroup(tasks));

  // 2. layout constants
  const extraSections = [
    visibility.showTechnologies,
    visibility.showInputs,
    visibility.showOutputs,
  ].filter(Boolean).length;
  const taskHeight = 220 + extraSections * 92;
  const laneContentPadding = LANE_INNER_PADDING + LANE_HANDLE_CLEARANCE;
  const taskWidth = LANE_WIDTH - laneContentPadding * 2;
  const laneIndexByGroup = new Map<string, number>();

   // 3. nodes positioneren
  Object.entries(groupMap).forEach(([group, groupTasks], laneIndex) => {
    laneIndexByGroup.set(group, laneIndex);
    const orderedGroupTasks = sortTasksByFollows(groupTasks);
    const laneLeft = LANE_LEFT_OFFSET + laneIndex * (LANE_WIDTH + LANE_GAP);
    laneHeights[group] =
      LANE_TOP_CONTENT_OFFSET + orderedGroupTasks.length * taskHeight + 24;

    orderedGroupTasks.forEach((task, taskIndex) => {
      nodes.push({
        id: task.uri,
        type: "task",
        data: {
          nodeType: "task",
          label: task.label,
          definition: task.definition,
          uri: task.uri,
          taskGroup: group,
          inputs: task.inputs,
          outputs: task.outputs,
          technologies: task.technologies,
          showInputs: visibility.showInputs,
          showOutputs: visibility.showOutputs,
          showTechnologies: visibility.showTechnologies,
        },
        position: {
          x: laneLeft + laneContentPadding,
          y: LANE_TOP_CONTENT_OFFSET + taskIndex * taskHeight,
        },
        style: {
          width: taskWidth,
        },
      });

    });
  });

  const maxLaneHeight = Math.max(
    ...Object.values(laneHeights),
    LANE_TOP_CONTENT_OFFSET + taskHeight,
  );
  const returnLaneY = maxLaneHeight + RETURN_FLOW_CLEARANCE;

  // 4. edges (process flow)
  tasks.forEach((task) => {
    task.follows?.forEach((prev) => {
      const prevTask = taskByUri.get(prev.uri);
      const sourceGroup = prevTask?.taskGroup || "Overig";
      const targetGroup = task.taskGroup || "Overig";
      const isSameLane = sourceGroup === targetGroup;
      const sourceLaneIndex = laneIndexByGroup.get(sourceGroup) ?? -1;
      const targetLaneIndex = laneIndexByGroup.get(targetGroup) ?? -1;
      const usesReturnFlow = !isSameLane && sourceLaneIndex > targetLaneIndex;
      const edgeProductLabel = buildEdgeProductLabel(prevTask, task);

      edges.push({
        id: `${prev.uri}-${task.uri}`,
        source: prev.uri,
        target: task.uri,
        type: usesReturnFlow ? "returnflow" : isSameLane ? "smoothstep" : "default",
        sourceHandle: isSameLane ? "bottom" : "right",
        targetHandle: isSameLane ? "top" : "left",
        data: usesReturnFlow
          ? {
              edgeType: "process",
              returnLaneY,
            }
          : undefined,
        label: edgeProductLabel,
        labelStyle: {
          fontSize: 10,
          fill: "#0f172a",
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: "rgba(255,255,255,0.9)",
          fillOpacity: 1,
        },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 4,
        markerStart: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: "#cbd5e1",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: "#94a3b8",
        },
        style: {
          stroke: "#94a3b8",
          strokeLinecap: "round" as const,
          strokeLinejoin: "round" as const,
        },
      });
    });
  });

  return { nodes, edges, groupMap, laneHeights };
};

const PolicyCyclePage: React.FC = () => {
  const { setRailState, clearRailState } = useRightRail();
  const [capabilities, setCapabilities] = React.useState<Capability[]>([]);
  const [activeTask, setActiveTask] = React.useState<string | null>(null);
  const [showInputs, setShowInputs] = React.useState(false);
  const [showOutputs, setShowOutputs] = React.useState(false);
  const [showTechnologies, setShowTechnologies] = React.useState(false);
  const [relationHighlight, setRelationHighlight] = React.useState<RelationHighlight>(null);

  const activeTaskRef = React.useMemo(() => {
    if (!activeTask) {
      return null;
    }

    const found = capabilities.find((task) => task.uri === activeTask);
    if (!found) {
      return null;
    }

    return {
      uri: found.uri,
      label: found.label,
      taskGroup: found.taskGroup || "Overig",
      definition: found.definition || "",
      inputs: found.inputs,
      outputs: found.outputs,
      technologies: found.technologies,
    };
  }, [activeTask, capabilities]);

  const relatedTaskIds = React.useMemo(() => {
    if (!relationHighlight) {
      return new Set<string>();
    }

    return new Set(
      capabilities
        .filter((task) => {
          if (relationHighlight.kind === "technology") {
            return task.technologies.some((technology) => technology.iri === relationHighlight.id);
          }

          if (relationHighlight.kind === "input") {
            return task.inputs.some((input) => input.uri === relationHighlight.id);
          }

          return task.outputs.some((output) => output.uri === relationHighlight.id);
        })
        .map((task) => task.uri),
    );
  }, [capabilities, relationHighlight]);

  React.useEffect(() => {
    setRailState({
      type: "policyCycle",
      context: {
        showInputs,
        showOutputs,
        showTechnologies,
        relationHighlight,
        activeTask: activeTaskRef,
      },
      commands: {
        setShowInputs,
        setShowOutputs,
        setShowTechnologies,
        setRelationHighlight: (kind, id, label) =>
          setRelationHighlight((previous) => {
            if (previous?.kind === kind && previous.id === id) {
              return null;
            }

            return { kind, id, label };
          }),
        clearRelationHighlight: () => setRelationHighlight(null),
        clearActiveTask: () => setActiveTask(null),
      },
    });
  }, [
    setRailState,
    showInputs,
    showOutputs,
    showTechnologies,
    relationHighlight,
    activeTaskRef,
    setShowInputs,
    setShowOutputs,
    setShowTechnologies,
  ]);

  React.useEffect(
    () => () => {
      clearRailState();
    },
    [clearRailState],
  );

  React.useEffect(() => {
    if (activeTask) {
      setRelationHighlight(null);
    }
  }, [activeTask]);

  React.useEffect(() => {
    if (!activeTask && relationHighlight) {
      setRelationHighlight(null);
    }
  }, [activeTask, relationHighlight]);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const onNodeClick = (_: any, node: any) => {
    setRelationHighlight(null);
    setActiveTask((prev) => (prev === node.id ? null : node.id));
  };

  React.useEffect(() => {
    let cancelled = false;

    async function loadCapabilities() {
      setLoading(true);
      setError(null);

      try {
        const payload = await apiFetch<Capability[]>("/api/capabilities");
        if (cancelled) {
          return;
        }
        setCapabilities(payload);
      } catch (caughtError: any) {
        if (cancelled) {
          return;
        }
        setError(
          caughtError.message || "Documentatie kon niet worden geladen.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCapabilities();
    return () => {
      cancelled = true;
    };
  }, []);

  const baseLayout = React.useMemo(() => {
    if (capabilities.length === 0) {
      return {
        nodes: [] as CustomNode[],
        edges: [] as CustomEdge[],
        groupMap: {} as Record<string, Capability[]>,
        laneHeights: {} as Record<string, number>,
      };
    }

    return layoutByTaskGroup(capabilities, {
      showInputs,
      showOutputs,
      showTechnologies,
    });
  }, [
    capabilities,
    showInputs,
    showOutputs,
    showTechnologies,
  ]);

  const styledNodes = React.useMemo(() => {
    return baseLayout.nodes.map((node) => {
      const relationFilterActive = Boolean(relationHighlight) && relatedTaskIds.size > 0;
      const matchesRelation = relationFilterActive ? relatedTaskIds.has(node.id) : false;
      const isActiveTask = activeTask === node.id;
      const hasHighlightContext = Boolean(activeTask || relationFilterActive);

      return {
        ...node,
        style: {
          ...(node.style || {}),
          borderColor: isActiveTask
            ? "#d97706"
            : matchesRelation
              ? "#2563eb"
              : undefined,
          borderWidth: isActiveTask ? 3 : matchesRelation ? 2 : 1,
          boxShadow: isActiveTask
            ? "0 0 0 3px rgba(245, 158, 11, 0.35), 0 10px 24px rgba(15, 23, 42, 0.2)"
            : matchesRelation
              ? "0 0 0 2px rgba(37, 99, 235, 0.2)"
              : "0 1px 2px rgba(15, 23, 42, 0.05)",
          zIndex: isActiveTask ? 12 : matchesRelation ? 8 : 1,
          opacity:
            hasHighlightContext && !matchesRelation && !isActiveTask
              ? 0.35
              : hasHighlightContext && (matchesRelation || isActiveTask)
                ? 1
                : 1,
        },
      };
    });
  }, [activeTask, baseLayout.nodes, relatedTaskIds, relationHighlight]);

  const styledEdges = React.useMemo(() => {
    return baseLayout.edges.map((e) => ({
      ...e,
      animated:
        (activeTask ? e.source === activeTask : false) ||
        (Boolean(relationHighlight) && relatedTaskIds.size > 0
          ? relatedTaskIds.has(e.source) || relatedTaskIds.has(e.target)
          : false),
      markerStart: {
        type: e.type === "smoothstep" ? MarkerType.ArrowClosed : MarkerType.Arrow,
        width: 12,
        height: 12,
        color:
          (Boolean(activeTask) && e.source === activeTask)
            ? "#fbbf24"
            : Boolean(relationHighlight) && relatedTaskIds.size > 0 && (relatedTaskIds.has(e.source) || relatedTaskIds.has(e.target))
              ? "#93c5fd"
              : "#cbd5e1",
      },
      markerEnd: {
        type: e.type === "smoothstep" ? MarkerType.ArrowClosed : MarkerType.Arrow,
        width: 16,
        height: 16,
        color:
          (Boolean(activeTask) && e.source === activeTask)
            ? "#d97706"
            : Boolean(relationHighlight) && relatedTaskIds.size > 0 && (relatedTaskIds.has(e.source) || relatedTaskIds.has(e.target))
              ? "#2563eb"
              : "#94a3b8",
      },
      style: {
        stroke: e.source === activeTask
          ? "#d97706"
          : Boolean(relationHighlight) && relatedTaskIds.size > 0 && (relatedTaskIds.has(e.source) || relatedTaskIds.has(e.target))
            ? "#2563eb"
            : "#94a3b8",
        strokeWidth: e.source === activeTask ? 3.5 : 1.5,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        opacity:
          Boolean(relationHighlight) && relatedTaskIds.size > 0
            ? (relatedTaskIds.has(e.source) || relatedTaskIds.has(e.target) || e.source === activeTask ? 1 : 0.25)
            : activeTask
              ? (e.source === activeTask ? 1 : 0.2)
              : 1,
      },
    }));
  }, [activeTask, baseLayout.edges, relatedTaskIds, relationHighlight]);

  const groups = baseLayout.groupMap;
  const laneHeights = baseLayout.laneHeights;

  return (
    <div className="h-screen flex flex-col">
      {/* =========================
          MAIN CONTENT
      ========================== */}
      <div className="flex flex-1 relative">
        {/* GRAPH */}
        <div className="flex-1">
          <ReactFlow
            nodes={styledNodes}
            edges={styledEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            onNodeClick={onNodeClick}
          >
            <Background />
            <SyncedLaneOverlay
              groupMap={groups as Record<string, Capability[]>}
              laneHeights={laneHeights}
            />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>

      </div>
    </div>
  );
};

export default PolicyCyclePage;
