"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function getStoredUser(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("damee-scheduler-user");
}

type HeaderProps = {
  activeStoreId: string;
  activePlanId: string;
  onStoreChange: (id: string) => void;
  onPlanChange: (id: string) => void;
  onGenerate: () => void;
  onOpenEmployeePool: () => void;
  onOpenStats: () => void;
  onOpenRules: () => void;
  onOpenBackup: () => void;
  onCopyPlan: (planId: string) => void;
  onReset: () => void;
  backendConnected: boolean | null;
  cloudSyncMessage: string;
  stores: { id: string; name: string }[];
  plans: { id: string; name: string }[];
};

export function Header({
  activeStoreId,
  activePlanId,
  onStoreChange,
  onPlanChange,
  onGenerate,
  onOpenEmployeePool,
  onOpenStats,
  onOpenRules,
  onOpenBackup,
  onCopyPlan,
  onReset,
  backendConnected,
  cloudSyncMessage,
  stores,
  plans,
}: HeaderProps) {
  const router = useRouter();
  const [phone] = useState<string | null>(getStoredUser);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        moreMenuOpen &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
      if (
        userMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreMenuOpen, userMenuOpen]);

  function handleLogout() {
    localStorage.removeItem("damee-scheduler-auth");
    localStorage.removeItem("damee-scheduler-user");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-6">
        {/* Left: brand + backend status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
            <span className="text-sm font-bold text-white">D</span>
          </div>
          <span className="text-sm font-semibold text-neutral-900 hidden sm:inline">
            Damee Scheduler
          </span>
          <span className="flex items-center gap-1 text-[10px] text-neutral-400">
            <span
              className={
                backendConnected === null
                  ? "h-1.5 w-1.5 rounded-full bg-neutral-400"
                  : backendConnected
                    ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                    : "h-1.5 w-1.5 rounded-full bg-red-500"
              }
            />
            {cloudSyncMessage || (backendConnected === null ? "检测中" : backendConnected ? "" : "离线")}
          </span>
        </div>

        {/* Center: controls — pushed right */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <select
            value={activeStoreId}
            onChange={(e) => onStoreChange(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700 outline-none focus:border-amber-400"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={activePlanId}
            onChange={(e) => onPlanChange(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700 outline-none focus:border-amber-400"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={onGenerate}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-400"
          >
            生成排班
          </button>

          {/* More menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setMoreMenuOpen((v) => !v)}
              className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100"
            >
              更多 ▾
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
                <button
                  onClick={() => { onOpenEmployeePool(); setMoreMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  员工池
                </button>
                <button
                  onClick={() => { onOpenStats(); setMoreMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  员工统计
                </button>
                <button
                  onClick={() => { onOpenRules(); setMoreMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  门店规则
                </button>
                <button
                  onClick={() => { onOpenBackup(); setMoreMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  数据 / 导入导出
                </button>
                <div className="my-1 border-t border-neutral-100" />
                <div className="px-3 py-1 text-[10px] text-neutral-400">
                  复制当前方案到…
                </div>
                {plans
                  .filter((p) => p.id !== activePlanId)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { onCopyPlan(p.id); setMoreMenuOpen(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
                    >
                      复制到 {p.name}
                    </button>
                  ))}
                <div className="my-1 border-t border-neutral-100" />
                <button
                  onClick={() => { onReset(); setMoreMenuOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Reset 当前方案
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right: user dropdown */}
        {phone && (
          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">{phone}</span>
              <span className="text-neutral-300">▾</span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
                <div className="px-3 py-2 text-xs text-neutral-500 border-b border-neutral-100 mb-1 sm:hidden">
                  {phone}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  退出登录
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
