"use client";

import { useEffect, useRef, useState } from "react";
import { EmployeeManager } from "@/components/EmployeeManager";
import { ScheduleBoard } from "@/components/ScheduleBoard";
import { ScheduleIssuesPanel } from "@/components/ScheduleIssuesPanel";
import { ScheduleStatsPanel } from "@/components/ScheduleStatsPanel";
import {
  buildScheduleText,
  downloadJsonFile,
  type ScheduleTextFormat,
} from "@/lib/export-schedule";
import { generateSchedule } from "@/lib/schedule-generator";
import { buildEmployeeScheduleStats } from "@/lib/schedule-stats";
import { validateSchedule } from "@/lib/schedule-validation";
import {
  DEFAULT_PLAN_ID,
  DEFAULT_STORE_ID,
  PLAN_OPTIONS,
  STORAGE_KEYS,
  STORE_CONFIGS,
  getStoreRoles,
} from "@/lib/scheduler-config";
import {
  loadFromStorage,
  removeFromStorage,
  saveToStorage,
} from "@/lib/storage";
import type {
  Employee,
  ScheduleCell,
  SchedulePlanMap,
  SchedulePlansByWeek,
  SchedulerBackup,
  StoreEmployeeMap,
  StoreRuleMap,
} from "@/lib/types";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { StoreRulesPanel } from "@/components/StoreRulesPanel";
import {
  buildWeekDates,
  getDateDiffInDays,
  getNextMondayDateInputValue,
  getTodayDateInputValue,
  normalizeToMondayDateInputValue,
} from "@/lib/date-utils";

function createEmptyPlanMap(): SchedulePlanMap {
  return Object.fromEntries(
    PLAN_OPTIONS.map((plan) => [
      plan.id,
      {
        id: plan.id,
        name: plan.name,
        storeId: DEFAULT_STORE_ID,
        cells: [],
      },
    ]),
  );
}

function createEmptySchedulePlansByWeek(): SchedulePlansByWeek {
  return {};
}

function getSchedulePlanMapForWeek(
  schedulePlansByWeek: SchedulePlansByWeek,
  weekStartDate: string,
): SchedulePlanMap {
  return schedulePlansByWeek[weekStartDate] ?? createEmptyPlanMap();
}

function pruneSchedulePlansByWeek(
  schedulePlansByWeek: SchedulePlansByWeek,
  todayValue: string,
): SchedulePlansByWeek {
  const next: SchedulePlansByWeek = {};

  for (const [weekStartDate, planMap] of Object.entries(schedulePlansByWeek)) {
    const diffDays = getDateDiffInDays(weekStartDate, todayValue);

    /**
     * 只保留最近一个月：
     * - 过去 31 天内
     * - 未来 31 天内
     *
     * 这样既能看最近历史，也能保留下几周计划。
     */
    if (diffDays >= -31 && diffDays <= 31) {
      next[weekStartDate] = planMap;
    }
  }

  return next;
}

function createEmptyStoreEmployeeMap(): StoreEmployeeMap {
  return Object.fromEntries(STORE_CONFIGS.map((store) => [store.id, []]));
}

function createEmptyStoreRuleMap(): StoreRuleMap {
  return Object.fromEntries(STORE_CONFIGS.map((store) => [store.id, []]));
}

function isValidBackup(value: unknown): value is SchedulerBackup {
  if (!value || typeof value !== "object") return false;

  const backup = value as Partial<SchedulerBackup>;

  return (
    backup.version === 1 &&
    Array.isArray(backup.employeePool) &&
    !!backup.storeEmployeeIds &&
    typeof backup.storeEmployeeIds === "object" &&
    !!backup.storeRules &&
    typeof backup.storeRules === "object" &&
    !!backup.schedulePlansByWeek &&
    typeof backup.schedulePlansByWeek === "object" &&
    typeof backup.activeStoreId === "string" &&
    typeof backup.activePlanId === "string"
  );
}

export default function Home() {
  const [employeePool, setEmployeePool] = useState<Employee[]>([]);
  const [storeEmployeeIds, setStoreEmployeeIds] = useState<StoreEmployeeMap>(
    () => createEmptyStoreEmployeeMap(),
  );
  const [storeRules, setStoreRules] = useState<StoreRuleMap>(() =>
    createEmptyStoreRuleMap(),
  );
  const [schedulePlansByWeek, setSchedulePlansByWeek] =
    useState<SchedulePlansByWeek>(() => createEmptySchedulePlansByWeek());
  const [activeStoreId, setActiveStoreId] = useState(DEFAULT_STORE_ID);
  const [activePlanId, setActivePlanId] = useState(DEFAULT_PLAN_ID);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  const [copyMessage, setCopyMessage] = useState("");
  const [backupJsonInput, setBackupJsonInput] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [showBackupPanel, setShowBackupPanel] = useState(false);
  const [showEmployeePanel, setShowEmployeePanel] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [copyPlanMessage, setCopyPlanMessage] = useState("");
  const [editOrder, setEditOrder] = useState<Record<string, number>>({});
  const editCounterRef = useRef(0);

  function handleEmployeeEdited(employeeId: string) {
    editCounterRef.current += 1;

    setEditOrder((current) => ({
      ...current,
      [employeeId]: editCounterRef.current,
    }));
  }

  const [todayValue, setTodayValue] = useState(getTodayDateInputValue);
  const [weekStartDate, setWeekStartDate] = useState(
    getNextMondayDateInputValue,
  );

  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  const activeStore =
    STORE_CONFIGS.find((store) => store.id === activeStoreId) ??
    STORE_CONFIGS[0];

  const activePlan =
    PLAN_OPTIONS.find((plan) => plan.id === activePlanId) ?? PLAN_OPTIONS[0];

  const activeStoreRoles = getStoreRoles(activeStore);

  const activeWeekStartDate = weekStartDate || getNextMondayDateInputValue();
  const weekDates = buildWeekDates(activeWeekStartDate);

  const activeWeekSchedulePlans = getSchedulePlanMapForWeek(
    schedulePlansByWeek,
    activeWeekStartDate,
  );

  const activeScheduleCells: ScheduleCell[] =
    activeWeekSchedulePlans[activePlanId]?.cells ?? [];

  const activeStoreEmployeeIds = storeEmployeeIds[activeStoreId] ?? [];

  const activeEmployees = employeePool.filter((employee) =>
    activeStoreEmployeeIds.includes(employee.id),
  );

  const activeStoreRules = storeRules[activeStoreId] ?? [];

  const scheduleIssues = validateSchedule({
    roles: activeStoreRoles,
    employees: activeEmployees,
    cells: activeScheduleCells,
    rules: activeStoreRules,
  });

  const scheduleStats = buildEmployeeScheduleStats(
    activeEmployees,
    activeScheduleCells,
    activeStore.roleHours,
  );

  useEffect(() => {
    const nextMonday = getNextMondayDateInputValue();
    const today = getTodayDateInputValue();

    const legacyEmployees = loadFromStorage<Employee[]>(
      STORAGE_KEYS.employees,
      [],
    );

    const savedEmployeePool = loadFromStorage<Employee[]>(
      STORAGE_KEYS.employeePool,
      legacyEmployees,
    );

    const savedStoreEmployeeIds = loadFromStorage<StoreEmployeeMap>(
      STORAGE_KEYS.storeEmployeeIds,
      createEmptyStoreEmployeeMap(),
    );

    const savedStoreRules = loadFromStorage<StoreRuleMap>(
      STORAGE_KEYS.storeRules,
      createEmptyStoreRuleMap(),
    );

    const savedLegacySchedulePlans = loadFromStorage<SchedulePlanMap>(
      STORAGE_KEYS.schedulePlans,
      createEmptyPlanMap(),
    );

    const savedSchedulePlansByWeek = loadFromStorage<SchedulePlansByWeek>(
      STORAGE_KEYS.schedulePlansByWeek,
      createEmptySchedulePlansByWeek(),
    );

    const savedStoreId = loadFromStorage<string>(
      STORAGE_KEYS.activeStoreId,
      DEFAULT_STORE_ID,
    );
    const savedPlanId = loadFromStorage<string>(
      STORAGE_KEYS.activePlanId,
      DEFAULT_PLAN_ID,
    );

    const storeExists = STORE_CONFIGS.some(
      (store) => store.id === savedStoreId,
    );
    const planExists = PLAN_OPTIONS.some((plan) => plan.id === savedPlanId);

    const nextStoreId = storeExists ? savedStoreId : DEFAULT_STORE_ID;

    const migratedSchedulePlansByWeek: SchedulePlansByWeek = {
      ...savedSchedulePlansByWeek,
    };
    /**
     * 兼容旧版：
     * 如果旧版 schedulePlans 有内容，但新版还没有对应周数据，
     * 就把旧方案迁移到默认下一周。
     */
    if (
      Object.keys(savedLegacySchedulePlans).length > 0 &&
      !migratedSchedulePlansByWeek[nextMonday]
    ) {
      migratedSchedulePlansByWeek[nextMonday] = {
        ...createEmptyPlanMap(),
        ...savedLegacySchedulePlans,
      };
    }

    let nextStoreEmployeeIds = {
      ...createEmptyStoreEmployeeMap(),
      ...savedStoreEmployeeIds,
    };

    /**
     * 兼容旧版本：
     * 如果之前只有 employees，没有员工池和门店选择，则默认全部加入当前门店。
     */
    if (
      savedEmployeePool.length > 0 &&
      (nextStoreEmployeeIds[nextStoreId]?.length ?? 0) === 0 &&
      legacyEmployees.length > 0
    ) {
      nextStoreEmployeeIds = {
        ...nextStoreEmployeeIds,
        [nextStoreId]: savedEmployeePool.map((employee) => employee.id),
      };
    }

    // Data synchronization from localStorage — runs once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmployeePool(savedEmployeePool.map(normalizeEmployee));
    setStoreEmployeeIds(nextStoreEmployeeIds);
    setSchedulePlansByWeek(
      pruneSchedulePlansByWeek(migratedSchedulePlansByWeek, today),
    );
    setActiveStoreId(nextStoreId);
    setActivePlanId(planExists ? savedPlanId : DEFAULT_PLAN_ID);
    setStoreRules({
      ...createEmptyStoreRuleMap(),
      ...savedStoreRules,
    });
    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    saveToStorage(STORAGE_KEYS.employeePool, employeePool);
  }, [employeePool, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    saveToStorage(STORAGE_KEYS.storeEmployeeIds, storeEmployeeIds);
  }, [storeEmployeeIds, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    const today = todayValue || getTodayDateInputValue();
    const pruned = pruneSchedulePlansByWeek(schedulePlansByWeek, today);

    saveToStorage(STORAGE_KEYS.schedulePlansByWeek, pruned);

    if (
      Object.keys(pruned).length !== Object.keys(schedulePlansByWeek).length
    ) {
      // Sync pruned schedule back to state — this is a data sync from
      // external storage, not cascading user-driven state changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSchedulePlansByWeek(pruned);
    }
  }, [schedulePlansByWeek, todayValue, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    saveToStorage(STORAGE_KEYS.storeRules, storeRules);
  }, [storeRules, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    saveToStorage(STORAGE_KEYS.activeStoreId, activeStoreId);
  }, [activeStoreId, hasLoadedStorage]);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    saveToStorage(STORAGE_KEYS.activePlanId, activePlanId);
  }, [activePlanId, hasLoadedStorage]);

  function normalizeEmployee(employee: Employee): Employee {
    return {
      ...employee,
      avatar: employee.avatar ?? "",
      availabilityMode: employee.availabilityMode ?? "specific-days",
      availableDays: employee.availableDays ?? [],
      targetWorkDays: employee.targetWorkDays ?? 5,
      capableRoles: employee.capableRoles ?? [],
      preferredRoles: employee.preferredRoles ?? [],
      avoidRoles: employee.avoidRoles ?? [],
      hourlyRate: employee.hourlyRate,
    };
  }

  function updateActivePlanCells(cells: ScheduleCell[]) {
    setSchedulePlansByWeek((current) => {
      const currentWeekPlans =
        current[activeWeekStartDate] ?? createEmptyPlanMap();

      const currentPlan = currentWeekPlans[activePlanId] ?? {
        id: activePlan.id,
        name: activePlan.name,
        storeId: activeStoreId,
        cells: [],
      };

      return {
        ...current,
        [activeWeekStartDate]: {
          ...currentWeekPlans,
          [activePlanId]: {
            ...currentPlan,
            name: activePlan.name,
            storeId: activeStoreId,
            cells,
          },
        },
      };
    });
  }

  function handleStoreChange(nextStoreId: string) {
    setActiveStoreId(nextStoreId);

    setSchedulePlansByWeek((current) => {
      const currentWeekPlans =
        current[activeWeekStartDate] ?? createEmptyPlanMap();

      return {
        ...current,
        [activeWeekStartDate]: {
          ...currentWeekPlans,
          [activePlanId]: {
            ...(currentWeekPlans[activePlanId] ?? {
              id: activePlan.id,
              name: activePlan.name,
              storeId: nextStoreId,
              cells: [],
            }),
            storeId: nextStoreId,
            cells: [],
          },
        },
      };
    });
  }

  function handlePlanChange(nextPlanId: string) {
    setActivePlanId(nextPlanId);

    const nextPlan = activeWeekSchedulePlans[nextPlanId];

    if (
      nextPlan?.storeId &&
      STORE_CONFIGS.some((store) => store.id === nextPlan.storeId)
    ) {
      setActiveStoreId(nextPlan.storeId);
    }
  }

  function handleGenerateSchedule() {
    const generatedCells = generateSchedule(activeEmployees, activeStoreRoles, {
      existingCells: activeScheduleCells,
      rules: activeStoreRules,
    });

    updateActivePlanCells(generatedCells);
  }

  function handleAssignEmployee(
    day: ScheduleCell["day"],
    role: string,
    employeeId: string | null,
  ) {
    setSchedulePlansByWeek((current) => {
      const currentWeekPlans =
        current[activeWeekStartDate] ?? createEmptyPlanMap();

      const currentPlan = currentWeekPlans[activePlanId] ?? {
        id: activePlan.id,
        name: activePlan.name,
        storeId: activeStoreId,
        cells: [],
      };

      const existingCell = currentPlan.cells.find(
        (cell) => cell.day === day && cell.role === role,
      );

      const otherCells = currentPlan.cells.filter(
        (cell) => !(cell.day === day && cell.role === role),
      );

      return {
        ...current,
        [activeWeekStartDate]: {
          ...currentWeekPlans,
          [activePlanId]: {
            ...currentPlan,
            name: activePlan.name,
            storeId: activeStoreId,
            cells: [
              ...otherCells,
              {
                day,
                role,
                employeeId,
                locked: existingCell?.locked ?? false,
              },
            ],
          },
        },
      };
    });
  }

  function handleToggleCellLock(day: ScheduleCell["day"], role: string) {
    setSchedulePlansByWeek((current) => {
      const currentWeekPlans =
        current[activeWeekStartDate] ?? createEmptyPlanMap();

      const currentPlan = currentWeekPlans[activePlanId] ?? {
        id: activePlan.id,
        name: activePlan.name,
        storeId: activeStoreId,
        cells: [],
      };

      const existingCell = currentPlan.cells.find(
        (cell) => cell.day === day && cell.role === role,
      );

      const otherCells = currentPlan.cells.filter(
        (cell) => !(cell.day === day && cell.role === role),
      );

      const nextCell: ScheduleCell = {
        day,
        role,
        employeeId: existingCell?.employeeId ?? null,
        locked: !(existingCell?.locked ?? false),
      };

      return {
        ...current,
        [activeWeekStartDate]: {
          ...currentWeekPlans,
          [activePlanId]: {
            ...currentPlan,
            name: activePlan.name,
            storeId: activeStoreId,
            cells: [...otherCells, nextCell],
          },
        },
      };
    });
  }

  function handleMoveScheduleEmployee({
    fromDay,
    fromRole,
    toDay,
    toRole,
  }: {
    fromDay: ScheduleCell["day"];
    fromRole: string;
    toDay: ScheduleCell["day"];
    toRole: string;
  }) {
    setSchedulePlansByWeek((current) => {
      const currentWeekPlans =
        current[activeWeekStartDate] ?? createEmptyPlanMap();

      const currentPlan = currentWeekPlans[activePlanId] ?? {
        id: activePlan.id,
        name: activePlan.name,
        storeId: activeStoreId,
        cells: [],
      };

      const fromCell = currentPlan.cells.find(
        (cell) => cell.day === fromDay && cell.role === fromRole,
      );

      const toCell = currentPlan.cells.find(
        (cell) => cell.day === toDay && cell.role === toRole,
      );

      if (!fromCell?.employeeId) return current;

      const fromEmployeeId = fromCell.employeeId;
      const toEmployeeId = toCell?.employeeId ?? null;

      const otherCells = currentPlan.cells.filter((cell) => {
        const isFromCell = cell.day === fromDay && cell.role === fromRole;
        const isToCell = cell.day === toDay && cell.role === toRole;

        return !isFromCell && !isToCell;
      });

      return {
        ...current,
        [activeWeekStartDate]: {
          ...currentWeekPlans,
          [activePlanId]: {
            ...currentPlan,
            name: activePlan.name,
            storeId: activeStoreId,
            cells: [
              ...otherCells,
              {
                day: fromDay,
                role: fromRole,
                employeeId: toEmployeeId,
                locked: fromCell.locked ?? false,
              },
              {
                day: toDay,
                role: toRole,
                employeeId: fromEmployeeId,
                locked: toCell?.locked ?? false,
              },
            ],
          },
        },
      };
    });
  }

  function handleResetSchedule() {
    updateActivePlanCells([]);
  }

  function handleCopyCurrentPlanTo(targetPlanId: string) {
    if (targetPlanId === activePlanId) return;

    const sourcePlan = activeWeekSchedulePlans[activePlanId];
    const targetPlan = PLAN_OPTIONS.find((plan) => plan.id === targetPlanId);

    if (!sourcePlan || !targetPlan) return;

    setSchedulePlansByWeek((current) => {
      const currentWeekPlans =
        current[activeWeekStartDate] ?? createEmptyPlanMap();

      return {
        ...current,
        [activeWeekStartDate]: {
          ...currentWeekPlans,
          [targetPlanId]: {
            id: targetPlan.id,
            name: targetPlan.name,
            storeId: activeStoreId,
            cells: sourcePlan.cells.map((cell) => ({ ...cell })),
          },
        },
      };
    });

    setCopyPlanMessage(`已复制到 ${targetPlan.name}`);

    window.setTimeout(() => {
      setCopyPlanMessage("");
    }, 2000);
  }

  function handleClearAllData() {
    setEmployeePool([]);
    setStoreEmployeeIds(createEmptyStoreEmployeeMap());
    setSchedulePlansByWeek(createEmptySchedulePlansByWeek());
    setActiveStoreId(DEFAULT_STORE_ID);
    setActivePlanId(DEFAULT_PLAN_ID);
    setStoreRules(createEmptyStoreRuleMap());

    removeFromStorage(STORAGE_KEYS.employeePool);
    removeFromStorage(STORAGE_KEYS.storeEmployeeIds);
    removeFromStorage(STORAGE_KEYS.employees);
    removeFromStorage(STORAGE_KEYS.schedulePlans);
    removeFromStorage(STORAGE_KEYS.schedulePlansByWeek);
    removeFromStorage(STORAGE_KEYS.activeStoreId);
    removeFromStorage(STORAGE_KEYS.activePlanId);
    removeFromStorage(STORAGE_KEYS.currentSchedule);
    removeFromStorage(STORAGE_KEYS.storeRules);
  }

  async function handleCopyScheduleText(format: ScheduleTextFormat) {
    const text = buildScheduleText({
      storeName: activeStore.name,
      planName: activePlan.name,
      roles: activeStoreRoles,
      employees: activeEmployees,
      cells: activeScheduleCells,
      weekDates,
      format,
    });

    const labelMap: Record<ScheduleTextFormat, string> = {
      "wechat-compact": "微信群简洁版",
      "by-date": "按日期详细版",
      "by-employee": "按员工版",
    };

    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`已复制${labelMap[format]}`);

      window.setTimeout(() => {
        setCopyMessage("");
      }, 2000);
    } catch {
      setCopyMessage("复制失败，请检查浏览器权限");

      window.setTimeout(() => {
        setCopyMessage("");
      }, 2000);
    }
  }

  function handleDownloadScheduleJson() {
    const payload = {
      store: activeStore,
      plan: activePlan,
      weekStartDate: activeWeekStartDate,
      weekDates,
      employees: activeEmployees,
      cells: activeScheduleCells,
      exportedAt: new Date().toISOString(),
    };

    downloadJsonFile(
      `${activeStore.id}-${activePlan.id}-${activeWeekStartDate}-schedule.json`,
      payload,
    );
  }

  function buildFullBackup(): SchedulerBackup {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      employeePool,
      storeEmployeeIds,
      storeRules,
      schedulePlansByWeek,
      activeStoreId,
      activePlanId,
    };
  }

  function handleDownloadFullBackup() {
    const backup = buildFullBackup();

    downloadJsonFile(
      `damee-scheduler-backup-${new Date().toISOString().slice(0, 10)}.json`,
      backup,
    );
  }

  async function handleCopyFullBackup() {
    const backup = buildFullBackup();

    try {
      await navigator.clipboard.writeText(JSON.stringify(backup, null, 2));
      setBackupMessage("完整备份 JSON 已复制");

      window.setTimeout(() => {
        setBackupMessage("");
      }, 2000);
    } catch {
      setBackupMessage("复制失败，请检查浏览器权限");

      window.setTimeout(() => {
        setBackupMessage("");
      }, 2000);
    }
  }

  function restoreFromBackup(backup: SchedulerBackup) {
    const storeExists = STORE_CONFIGS.some(
      (store) => store.id === backup.activeStoreId,
    );
    const planExists = PLAN_OPTIONS.some(
      (plan) => plan.id === backup.activePlanId,
    );

    const nextStoreId = storeExists ? backup.activeStoreId : DEFAULT_STORE_ID;
    const nextPlanId = planExists ? backup.activePlanId : DEFAULT_PLAN_ID;
    const nextEmployeePool = backup.employeePool.map(normalizeEmployee);
    const nextStoreEmployeeIds = {
      ...createEmptyStoreEmployeeMap(),
      ...backup.storeEmployeeIds,
    };
    const nextSchedulePlansByWeek = pruneSchedulePlansByWeek(
      backup.schedulePlansByWeek,
      getTodayDateInputValue(),
    );
    const nextStoreRules = {
      ...createEmptyStoreRuleMap(),
      ...backup.storeRules,
    };

    setEmployeePool(nextEmployeePool);
    setStoreEmployeeIds(nextStoreEmployeeIds);
    setSchedulePlansByWeek(nextSchedulePlansByWeek);
    setActiveStoreId(nextStoreId);
    setActivePlanId(nextPlanId);
    setStoreRules(nextStoreRules);

    saveToStorage(STORAGE_KEYS.employeePool, nextEmployeePool);
    saveToStorage(STORAGE_KEYS.storeEmployeeIds, nextStoreEmployeeIds);
    saveToStorage(STORAGE_KEYS.schedulePlansByWeek, nextSchedulePlansByWeek);
    saveToStorage(STORAGE_KEYS.activeStoreId, nextStoreId);
    saveToStorage(STORAGE_KEYS.activePlanId, nextPlanId);
    saveToStorage(STORAGE_KEYS.storeRules, nextStoreRules);
  }

  function handleImportFullBackupFromText() {
    setBackupMessage("");

    try {
      const parsed = JSON.parse(backupJsonInput) as unknown;

      if (!isValidBackup(parsed)) {
        throw new Error("备份 JSON 格式不正确");
      }

      restoreFromBackup(parsed);

      setBackupJsonInput("");
      setBackupMessage("完整备份已导入");
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "导入失败");
    }
  }

  async function handleImportFullBackupFromFile(file: File) {
    setBackupMessage("");

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;

      if (!isValidBackup(parsed)) {
        throw new Error("备份 JSON 格式不正确");
      }

      restoreFromBackup(parsed);

      if (backupFileInputRef.current) {
        backupFileInputRef.current.value = "";
      }

      setBackupMessage("完整备份文件已导入");
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : "导入文件失败");
    }
  }

  return (
    <AuthGuard>
      <Header />
      <main className="min-h-screen bg-neutral-950 text-neutral-50">
        <section className="mx-auto max-w-7xl px-6 py-8">
          <header className="mb-8 flex flex-col gap-4 border-b border-neutral-800 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-amber-400">
                Damee Scheduler
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                员工排班工具
              </h1>
              <p className="mt-2 text-sm text-neutral-400">
                员工池、多门店选择、自动生成和拖拽调整排班。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={activeStoreId}
                onChange={(event) => handleStoreChange(event.target.value)}
                className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-200 outline-none hover:bg-neutral-900 focus:border-amber-500"
              >
                {STORE_CONFIGS.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>

              <select
                value={activePlanId}
                onChange={(event) => handlePlanChange(event.target.value)}
                className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-200 outline-none hover:bg-neutral-900 focus:border-amber-500"
              >
                {PLAN_OPTIONS.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerateSchedule}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
              >
                生成排班
              </button>

              <button
                onClick={() => setShowBackupPanel(true)}
                className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
              >
                数据 / 导入导出
              </button>

              <button
                onClick={() => setShowEmployeePanel(true)}
                className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
              >
                员工池
              </button>

              <button
                onClick={() => setShowStatsPanel(true)}
                className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
              >
                员工统计
              </button>

              <button
                onClick={() => setShowRulesPanel(true)}
                className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
              >
                门店规则
              </button>

              <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-700 bg-white p-1">
                {PLAN_OPTIONS.filter((plan) => plan.id !== activePlanId).map(
                  (plan) => (
                    <button
                      key={plan.id}
                      onClick={() => handleCopyCurrentPlanTo(plan.id)}
                      className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
                    >
                      复制到{plan.name}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={handleResetSchedule}
                className="rounded-xl border border-red-900/70 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40"
              >
                Reset 当前方案
              </button>
            </div>
          </header>

          <div className="mb-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-400">
            当前门店：
            <span className="text-neutral-100">{activeStore.name}</span>
            <span className="mx-2 text-neutral-700">/</span>
            当前方案：
            <span className="text-neutral-100">{activePlan.name}</span>
            <span className="mx-2 text-neutral-700">/</span>
            <span className="mx-2 text-neutral-700">/</span>
            今天：
            <span className="text-neutral-100">{todayValue}</span>
            <span className="mx-2 text-neutral-700">/</span>
            排班周：
            <span className="text-neutral-100">
              {weekDates[0]?.dateLabel} - {weekDates[6]?.dateLabel}
            </span>
            <span className="mx-2 text-neutral-700">/</span>
            本周方案数：
            <span className="text-neutral-100">
              {
                Object.values(activeWeekSchedulePlans).filter(
                  (plan) => plan.cells.length > 0,
                ).length
              }
            </span>
            <label className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-white px-3 py-2 text-sm text-neutral-500">
              <span>周一</span>
              <input
                type="date"
                value={weekStartDate}
                onChange={(event) => {
                  setWeekStartDate(
                    normalizeToMondayDateInputValue(event.target.value),
                  );
                }}
                className="border-none bg-transparent text-sm text-neutral-900 outline-none"
              />
            </label>
            <button
              onClick={() => {
                setTodayValue(getTodayDateInputValue());
                setWeekStartDate(getNextMondayDateInputValue());
              }}
              className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            >
              回到下周
            </button>
            门店员工：
            <span className="text-neutral-100">{activeEmployees.length}</span>
            <span className="mx-2 text-neutral-700">/</span>
            员工池：
            <span className="text-neutral-100">{employeePool.length}</span>
            <span className="mx-2 text-neutral-700">/</span>
            已安排岗位：
            <span className="text-neutral-100">
              {activeScheduleCells.filter((cell) => cell.employeeId).length}
            </span>
            <span className="text-neutral-500">
              {" "}
              / {activeStoreRoles.length * 7}
            </span>
          </div>

          {copyPlanMessage ? (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {copyPlanMessage}
            </div>
          ) : null}

          <ScheduleIssuesPanel
            issues={scheduleIssues}
            employees={activeEmployees}
            onAssignEmployee={handleAssignEmployee}
          />

          <ScheduleBoard
            roleGroups={activeStore.roleGroups}
            roles={activeStoreRoles}
            weekDates={weekDates}
            employees={activeEmployees}
            cells={activeScheduleCells}
            onAssignEmployee={handleAssignEmployee}
            onMoveScheduleEmployee={handleMoveScheduleEmployee}
            onToggleCellLock={handleToggleCellLock}
          />

          {showBackupPanel ? (
            <div
              onClick={() => setShowBackupPanel(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            >
              <div
                onClick={(event) => event.stopPropagation()}
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
              >
                {" "}
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-amber-400">数据管理</p>
                    <h2 className="mt-1 text-xl font-bold text-neutral-100">
                      导入 / 导出 / 备份
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      复制文本用于发群，完整备份用于迁移或恢复全部数据。
                    </p>
                  </div>

                  <button
                    onClick={() => setShowBackupPanel(false)}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-900"
                  >
                    关闭
                  </button>
                </div>
                <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <button
                    onClick={() => handleCopyScheduleText("wechat-compact")}
                    className="rounded-xl border border-neutral-700 px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-900"
                  >
                    <span className="block font-semibold text-neutral-100">
                      复制微信群简洁版
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500">
                      每天一行岗位汇总，适合直接发群。
                    </span>
                  </button>

                  <button
                    onClick={() => handleCopyScheduleText("by-date")}
                    className="rounded-xl border border-neutral-700 px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-900"
                  >
                    <span className="block font-semibold text-neutral-100">
                      复制按日期详细版
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500">
                      每天按岗位逐行显示，并标记锁定格子。
                    </span>
                  </button>

                  <button
                    onClick={() => handleCopyScheduleText("by-employee")}
                    className="rounded-xl border border-neutral-700 px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-900"
                  >
                    <span className="block font-semibold text-neutral-100">
                      复制按员工版
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500">
                      每个员工一行，方便员工查看自己哪天上班。
                    </span>
                  </button>

                  <button
                    onClick={handleDownloadScheduleJson}
                    className="rounded-xl border border-neutral-700 px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-900"
                  >
                    <span className="block font-semibold text-neutral-100">
                      下载当前方案 JSON
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500">
                      只导出当前门店、当前方案和当前排班。
                    </span>
                  </button>

                  <button
                    onClick={handleCopyFullBackup}
                    className="rounded-xl border border-neutral-700 px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-900"
                  >
                    <span className="block font-semibold text-neutral-100">
                      复制完整备份 JSON
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500">
                      不显示 JSON 文本，直接复制到剪贴板。
                    </span>
                  </button>

                  <button
                    onClick={handleDownloadFullBackup}
                    className="rounded-xl border border-neutral-700 px-4 py-3 text-left text-sm text-neutral-200 hover:bg-neutral-900"
                  >
                    <span className="block font-semibold text-neutral-100">
                      下载完整备份文件
                    </span>
                    <span className="mt-1 block text-xs text-neutral-500">
                      包含员工池、门店员工选择、方案和所有排班。
                    </span>
                  </button>
                </div>
                <div className="mb-5 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                  <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-200">
                        上传完整备份 JSON 文件
                      </h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        选择之前通过“下载完整备份文件”得到的 .json 文件。
                      </p>
                    </div>

                    <div>
                      <input
                        ref={backupFileInputRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];

                          if (!file) return;

                          void handleImportFullBackupFromFile(file);
                        }}
                      />

                      <button
                        onClick={() => backupFileInputRef.current?.click()}
                        className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-white"
                      >
                        上传 JSON 文件
                      </button>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-neutral-200">
                      粘贴完整备份 JSON
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      适合从“复制完整备份
                      JSON”得到的内容恢复。导入会覆盖当前全部数据。
                    </p>
                  </div>

                  <textarea
                    value={backupJsonInput}
                    onChange={(event) => setBackupJsonInput(event.target.value)}
                    placeholder="粘贴完整备份 JSON"
                    className="min-h-44 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 font-mono text-xs text-neutral-100 outline-none placeholder:text-neutral-700 focus:border-amber-500"
                  />

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleImportFullBackupFromText}
                      className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
                    >
                      导入粘贴内容并覆盖
                    </button>
                  </div>
                </div>
                {backupMessage ? (
                  <p
                    className={
                      backupMessage.includes("失败") ||
                      backupMessage.includes("不正确")
                        ? "mt-3 text-sm text-red-300"
                        : "mt-3 text-sm text-emerald-300"
                    }
                  >
                    {backupMessage}
                  </p>
                ) : null}
                {copyMessage ? (
                  <p className="mt-3 text-sm text-emerald-300">{copyMessage}</p>
                ) : null}
                <div className="mt-6 border-t border-neutral-800 pt-4">
                  <button
                    onClick={handleClearAllData}
                    className="rounded-xl border border-red-900/70 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40"
                  >
                    清空全部数据
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {showEmployeePanel ? (
            <div
              onClick={() => setShowEmployeePanel(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            >
              <div
                onClick={(event) => event.stopPropagation()}
                className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
              >
                {" "}
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-amber-400">员工池</p>
                    <h2 className="mt-1 text-xl font-bold text-neutral-100">
                      员工池 / 当前门店员工
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      所有员工统一进入员工池。当前门店只会使用已勾选的员工参与排班。
                    </p>
                  </div>

                  <button
                    onClick={() => setShowEmployeePanel(false)}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-900"
                  >
                    关闭
                  </button>
                </div>
                <EmployeeManager
                  roles={activeStoreRoles}
                  activeStoreId={activeStoreId}
                  activeStoreName={activeStore.name}
                  employeePool={employeePool}
                  setEmployeePool={setEmployeePool}
                  activeStoreEmployeeIds={activeStoreEmployeeIds}
                  setStoreEmployeeIds={setStoreEmployeeIds}
                  editOrder={editOrder}
                  onEmployeeEdited={handleEmployeeEdited}
                />
              </div>
            </div>
          ) : null}

          {showStatsPanel ? (
            <div
              onClick={() => setShowStatsPanel(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            >
              <div
                onClick={(event) => event.stopPropagation()}
                className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
              >
                {" "}
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-amber-400">排班统计</p>
                    <h2 className="mt-1 text-xl font-bold text-neutral-100">
                      员工排班统计
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      查看当前门店员工本周安排天数、岗位数和目标完成情况。
                    </p>
                  </div>

                  <button
                    onClick={() => setShowStatsPanel(false)}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-900"
                  >
                    关闭
                  </button>
                </div>
                <ScheduleStatsPanel stats={scheduleStats} />
              </div>
            </div>
          ) : null}

          {showRulesPanel ? (
            <div
              onClick={() => setShowRulesPanel(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            >
              <div
                onClick={(event) => event.stopPropagation()}
                className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
              >
                {" "}
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-amber-400">规则设置</p>
                    <h2 className="mt-1 text-xl font-bold text-neutral-100">
                      门店排班规则
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      设置当前门店员工之间的同班规则。
                    </p>
                  </div>

                  <button
                    onClick={() => setShowRulesPanel(false)}
                    className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-900"
                  >
                    关闭
                  </button>
                </div>
                <StoreRulesPanel
                  activeStoreId={activeStoreId}
                  activeStoreName={activeStore.name}
                  employees={activeEmployees}
                  rules={activeStoreRules}
                  setStoreRules={setStoreRules}
                />
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </AuthGuard>
  );
}
