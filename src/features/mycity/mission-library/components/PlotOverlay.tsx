"use client";

import {
  buildPlotClipPath,
  buildSvgPolygonPoints,
} from "@/features/mycity/mission-library/data/mapConfig";
import type { MapPlot, PlotCorner } from "@/features/mycity/mission-library/types/missionTypes";

interface PlotOverlayProps {
  plot: MapPlot;
  inspected: boolean;
  onPlotClick: () => void;
}

const labelAnchorClasses: Record<
  NonNullable<PlotCorner["labelAnchor"]>,
  string
> = {
  center: "-translate-x-1/2 -translate-y-1/2",
  left: "-translate-y-1/2",
  right: "-translate-x-full -translate-y-1/2",
};

function getLabelPosition(corner: PlotCorner) {
  const offsetX = corner.labelOffset?.x ?? 0;
  const offsetY = corner.labelOffset?.y ?? 0;

  return {
    left: `calc(${corner.screen.x}% + ${offsetX}%)`,
    top: `calc(${corner.screen.y}% + ${offsetY}%)`,
  };
}

export function PlotOverlay({ plot, inspected, onPlotClick }: PlotOverlayProps) {
  const clipPath = buildPlotClipPath(plot.screenPolygon);
  const svgPoints = buildSvgPolygonPoints(plot.screenPolygon);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <button
        type="button"
        aria-label={`${plot.label} — click to inspect`}
        className="absolute inset-0 cursor-pointer border-0 bg-sky-400/10 transition-[background-color] duration-200 hover:bg-sky-400/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 data-[inspected=true]:bg-sky-400/18"
        style={{ clipPath, WebkitClipPath: clipPath }}
        data-inspected={inspected}
        onClick={onPlotClick}
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polygon
          points={svgPoints}
          fill="none"
          stroke="rgba(2, 132, 199, 0.9)"
          strokeWidth={0.35}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {plot.corners.map((corner) => {
        const anchor = corner.labelAnchor ?? "center";

        return (
          <span
            key={corner.id}
            className={`pointer-events-none absolute z-10 whitespace-nowrap rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm sm:text-xs ${labelAnchorClasses[anchor]}`}
            style={getLabelPosition(corner)}
          >
            {corner.label}
          </span>
        );
      })}
    </div>
  );
}
