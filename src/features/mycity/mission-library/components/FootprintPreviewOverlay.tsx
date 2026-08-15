"use client";

import {
  buildSvgPolygonPoints,
  elBahdjaCampusMap,
} from "@/features/mycity/mission-library/data/mapConfig";
import {
  getPlotProjectionConfig,
  projectPlotPointToScreen,
  projectPlotPolygonToScreen,
  type FootprintPreviewData,
} from "@/features/mycity/mission-library/logic/coordinateProjection";
import type { MapPlot } from "@/features/mycity/mission-library/types/missionTypes";

interface FootprintPreviewOverlayProps {
  plot?: MapPlot;
  preview: FootprintPreviewData | null;
}

function toSvgPoints(points: { x: number; y: number }[]): string {
  return buildSvgPolygonPoints(points);
}

export function FootprintPreviewOverlay({
  plot = elBahdjaCampusMap.plot,
  preview,
}: FootprintPreviewOverlayProps) {
  if (!preview) {
    return null;
  }

  const projectionConfig = getPlotProjectionConfig(plot);
  const { a, b, d } = projectionConfig.corners;
  const xMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const yMid = { x: (a.x + d.x) / 2, y: (a.y + d.y) / 2 };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {preview.mathPolygons.map((mathPolygon, index) => {
          const screenPolygon = projectPlotPolygonToScreen(
            mathPolygon,
            projectionConfig,
          );

          return (
            <polygon
              key={`footprint-${index}`}
              points={toSvgPoints(screenPolygon)}
              fill="rgba(245, 158, 11, 0.28)"
              stroke="rgba(217, 119, 6, 0.95)"
              strokeWidth={0.4}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        <defs>
          <marker
            id="axis-arrow"
            markerWidth="4"
            markerHeight="4"
            refX="2"
            refY="2"
            orient="auto"
          >
            <path d="M0,0 L4,2 L0,4 Z" fill="rgba(15, 23, 42, 0.85)" />
          </marker>
        </defs>

        <line
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke="rgba(15, 23, 42, 0.55)"
          strokeWidth={0.25}
          strokeDasharray="1.2 0.8"
          markerEnd="url(#axis-arrow)"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={a.x}
          y1={a.y}
          x2={d.x}
          y2={d.y}
          stroke="rgba(15, 23, 42, 0.55)"
          strokeWidth={0.25}
          strokeDasharray="1.2 0.8"
          markerEnd="url(#axis-arrow)"
          vectorEffect="non-scaling-stroke"
        />

        <text
          x={xMid.x}
          y={xMid.y - 1.2}
          fill="rgba(15, 23, 42, 0.9)"
          fontSize="2.2"
          textAnchor="middle"
        >
          x: A → B
        </text>
        <text
          x={yMid.x - 2.5}
          y={yMid.y}
          fill="rgba(15, 23, 42, 0.9)"
          fontSize="2.2"
          textAnchor="middle"
        >
          y: A → D
        </text>
      </svg>

      {preview.cornerLabels.map((corner) => {
        const screenPoint = projectPlotPointToScreen(
          corner.mathPoint,
          projectionConfig,
        );

        return (
          <span
            key={`${corner.label}-${corner.mathPoint.x}-${corner.mathPoint.y}`}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-amber-700/90 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm sm:text-xs"
            style={{
              left: `${screenPoint.x}%`,
              top: `${screenPoint.y}%`,
            }}
          >
            {corner.label}
          </span>
        );
      })}
    </div>
  );
}
