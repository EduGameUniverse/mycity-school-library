import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MyCity — BAC Missions",
  description: "Select a BAC mission in MyCity.",
};

export default function BacMissionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-sky-700">
            MyCity
          </p>
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
            MyCity — BAC Missions
          </h1>
        </header>

        <ul className="flex flex-col gap-4">
          <li>
            <a
              href="/bac/mission-01-trigonometry-tower"
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Mission 01: Restore the Signal — Trigonometry Tower
                </h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Playable
                </span>
              </div>
            </a>
          </li>
        </ul>
      </main>
    </div>
  );
}
