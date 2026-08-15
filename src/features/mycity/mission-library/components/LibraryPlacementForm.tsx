"use client";

import { useState } from "react";
import {
  getRecommendedFootprintSummary,
  libraryPlacementConfig,
} from "@/features/mycity/mission-library/data/libraryPlacementConfig";
import { validateLibraryPlacement } from "@/features/mycity/mission-library/logic/libraryPlacement";
import type {
  LibraryFootprintInput,
  LibraryPlacementValidationResult,
} from "@/features/mycity/mission-library/types/missionTypes";

type CornerKey = keyof LibraryFootprintInput;

const cornerOrder: CornerKey[] = ["a", "b", "c", "d"];

interface LibraryPlacementFormProps {
  onPlacementChange?: (
    result: LibraryPlacementValidationResult | null,
    input: LibraryFootprintInput | null,
  ) => void;
}

export function LibraryPlacementForm({
  onPlacementChange,
}: LibraryPlacementFormProps) {
  const [footprintInput, setFootprintInput] = useState({
    ax: "",
    ay: "",
    bx: "",
    by: "",
    cx: "",
    cy: "",
    dx: "",
    dy: "",
  });
  const [placementResult, setPlacementResult] =
    useState<LibraryPlacementValidationResult | null>(null);

  function updateCorner(
    corner: CornerKey,
    axis: "x" | "y",
    value: string,
  ) {
    const key = `${corner}${axis}` as keyof typeof footprintInput;
    setFootprintInput((current) => ({ ...current, [key]: value }));
    setPlacementResult(null);
    onPlacementChange?.(null, null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input: LibraryFootprintInput = {
      a: { x: Number(footprintInput.ax), y: Number(footprintInput.ay) },
      b: { x: Number(footprintInput.bx), y: Number(footprintInput.by) },
      c: { x: Number(footprintInput.cx), y: Number(footprintInput.cy) },
      d: { x: Number(footprintInput.dx), y: Number(footprintInput.dy) },
    };

    const result = validateLibraryPlacement(input);
    setPlacementResult(result);
    onPlacementChange?.(result, input);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        {libraryPlacementConfig.sectionTitle}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {libraryPlacementConfig.instructions}
      </p>

      <div className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900 sm:text-sm">
        Recommended footprint: {getRecommendedFootprintSummary()}
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        {cornerOrder.map((corner) => {
          const label = libraryPlacementConfig.cornerLabels[corner];

          return (
            <fieldset
              key={corner}
              className="rounded-lg border border-slate-200 p-3"
            >
              <legend className="px-1 text-sm font-semibold text-slate-800">
                {label}
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="text-slate-600">x</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={footprintInput[`${corner}x` as keyof typeof footprintInput]}
                    onChange={(event) =>
                      updateCorner(corner, "x", event.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-sky-500 focus:border-sky-500 focus:ring-2"
                    placeholder="x"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-slate-600">y</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={footprintInput[`${corner}y` as keyof typeof footprintInput]}
                    onChange={(event) =>
                      updateCorner(corner, "y", event.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-sky-500 focus:border-sky-500 focus:ring-2"
                    placeholder="y"
                    required
                  />
                </label>
              </div>
            </fieldset>
          );
        })}

        <button
          type="submit"
          className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
        >
          Check library placement
        </button>
      </form>

      {placementResult ? (
        <div
          className={`mt-4 rounded-lg border p-4 text-sm ${
            placementResult.status === "recommended"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : placementResult.status === "valid"
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-rose-200 bg-rose-50 text-rose-950"
          }`}
          role="status"
        >
          {placementResult.status === "recommended" ? (
            <p className="font-semibold">
              {libraryPlacementConfig.messages.success}
            </p>
          ) : null}

          {placementResult.status === "valid" && placementResult.warning ? (
            <p className="font-semibold">{placementResult.warning}</p>
          ) : null}

          {placementResult.status === "invalid" ? (
            <div className="space-y-2">
              <p className="font-semibold">
                {libraryPlacementConfig.messages.invalidIntro}
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {placementResult.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {placementResult.isValid &&
          placementResult.lengthM &&
          placementResult.widthM ? (
            <p className="mt-2 text-xs sm:text-sm">
              Library footprint size: {placementResult.lengthM} m ×{" "}
              {placementResult.widthM} m
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
