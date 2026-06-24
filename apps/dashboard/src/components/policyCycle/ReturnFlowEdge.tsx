import React from "react";
import { BaseEdge, EdgeProps } from "reactflow";

const RETURN_HORIZONTAL_PADDING = 64;

const ReturnFlowEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerStart,
  markerEnd,
  style,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
  data,
}) => {
  const returnLaneY = Number(data?.returnLaneY ?? Math.max(sourceY, targetY) + 120);
  const midX = (sourceX + targetX) / 2;
  const labelY = returnLaneY - 12;
  const leftX = Math.min(sourceX, targetX) - RETURN_HORIZONTAL_PADDING;
  const rightX = Math.max(sourceX, targetX) + RETURN_HORIZONTAL_PADDING;

  const edgePath = [
    `M ${sourceX} ${sourceY}`,
    `L ${leftX} ${sourceY}`,
    `L ${leftX} ${returnLaneY}`,
    `L ${rightX} ${returnLaneY}`,
    `L ${rightX} ${targetY}`,
    `L ${targetX} ${targetY}`,
  ].join(" ");

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerStart={markerStart}
      markerEnd={markerEnd}
      style={style}
      label={label}
      labelX={midX}
      labelY={labelY}
      labelStyle={labelStyle}
      labelShowBg={Boolean(label)}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
    />
  );
};

export default ReturnFlowEdge;
