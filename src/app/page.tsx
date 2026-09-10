import type { Metadata } from "next";
import Link from "next/link";
import { LearnerIdentityBar } from "@/features/account/identity/LearnerIdentityBar";

export const metadata: Metadata = {
  title: "MyCity",
  description: "Select your level and start a MyCity mission.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <LearnerIdentityBar />
        <header className="space-y-2">
          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            MyCity
          </h1>
          <p className="text-base text-slate-600 sm:text-lg">Select your level</p>
        </header>

        <ul className="flex flex-col gap-4">
          <li>
            <Link
              href="/bem"
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">BEM</h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Available
                </span>
              </div>
            </Link>
          </li>
          <li>
            <Link
              href="/bac"
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">BAC</h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Available
                </span>
              </div>
            </Link>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-slate-100 p-5 text-slate-500">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-600">University</h2>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Coming soon
              </span>
            </div>
          </li>
        </ul>
      </main>
    </div>
  );
}
