"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function getStoredUser(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("damee-scheduler-user");
}

export function Header() {
  const router = useRouter();
  const [phone] = useState<string | null>(getStoredUser);

  function handleLogout() {
    localStorage.removeItem("damee-scheduler-auth");
    localStorage.removeItem("damee-scheduler-user");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
            <span className="text-sm font-bold text-white">D</span>
          </div>
          <span className="text-sm font-semibold text-neutral-900">
            Damee Scheduler
          </span>
        </div>

        {phone && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {phone}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              退出
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
