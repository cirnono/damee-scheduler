"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { WEEKDAYS } from "@/lib/scheduler-config";
import type { AvailabilityMode, Employee, StoreEmployeeMap } from "@/lib/types";

type EmployeeManagerProps = {
  roles: string[];
  activeStoreId: string;
  activeStoreName: string;
  employeePool: Employee[];
  setEmployeePool: Dispatch<SetStateAction<Employee[]>>;
  activeStoreEmployeeIds: string[];
  setStoreEmployeeIds: Dispatch<SetStateAction<StoreEmployeeMap>>;
  editOrder: Record<string, number>;
  onEmployeeEdited: (employeeId: string) => void;
  syncedEmployeeIds: Set<string>;
  onSaveToCloud: () => void;
  cloudSyncing: boolean;
  cloudSyncMessage: string;
};

type EmployeeFilter = "all" | "active-store" | "not-active-store";



export function EmployeeManager({
  roles,
  activeStoreId,
  activeStoreName,
  employeePool,
  setEmployeePool,
  activeStoreEmployeeIds,
  setStoreEmployeeIds,
  editOrder,
  onEmployeeEdited,
  syncedEmployeeIds,
  onSaveToCloud,
  cloudSyncing,
  cloudSyncMessage,
}: EmployeeManagerProps) {
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [, setImportError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filter, setFilter] = useState<EmployeeFilter>("all");
  const [expandedPreferenceEmployeeIds, setExpandedPreferenceEmployeeIds] =
    useState<string[]>([]);
  const [filterCollapsed, setFilterCollapsed] = useState(true);
  const [snapshotOrder] = useState<Record<string, number>>(() => ({
    ...editOrder,
  }));

  const activeStoreEmployeeIdSet = useMemo(
    () => new Set(activeStoreEmployeeIds),
    [activeStoreEmployeeIds],
  );
  const activeStoreEmployeeIdSet = useMemo(
    () => new Set(activeStoreEmployeeIds),
    [activeStoreEmployeeIds],
  );

  const filteredEmployees = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    const filteredEmployees = useMemo(() => {
      const keyword = searchKeyword.trim().toLowerCase();

      return employeePool
        .filter((employee) => {
          const isInActiveStore = activeStoreEmployeeIdSet.has(employee.id);
          return employeePool
            .filter((employee) => {
              const isInActiveStore = activeStoreEmployeeIdSet.has(employee.id);

              if (filter === "active-store" && !isInActiveStore) return false;
              if (filter === "not-active-store" && isInActiveStore) return false;
              if (filter === "active-store" && !isInActiveStore) return false;
              if (filter === "not-active-store" && isInActiveStore) return false;

              if (!keyword) return true;
              if (!keyword) return true;

              return employee.name.toLowerCase().includes(keyword);
            })
            .sort((a, b) => {
              const aInStore = activeStoreEmployeeIdSet.has(a.id);
              const bInStore = activeStoreEmployeeIdSet.has(b.id);
              return employee.name.toLowerCase().includes(keyword);
            })
            .sort((a, b) => {
              const aInStore = activeStoreEmployeeIdSet.has(a.id);
              const bInStore = activeStoreEmployeeIdSet.has(b.id);

              if (aInStore !== bInStore) return aInStore ? -1 : 1;
              if (aInStore !== bInStore) return aInStore ? -1 : 1;

              const aOrder = snapshotOrder[a.id] ?? 0;
              const bOrder = snapshotOrder[b.id] ?? 0;
              const aOrder = snapshotOrder[a.id] ?? 0;
              const bOrder = snapshotOrder[b.id] ?? 0;

              if (aOrder !== bOrder) return bOrder - aOrder;
              if (aOrder !== bOrder) return bOrder - aOrder;

              return a.name.localeCompare(b.name, "zh-Hans-CN");
            });
        }, [
          employeePool,
          activeStoreEmployeeIdSet,
          filter,
          searchKeyword,
          snapshotOrder,
        ]);
      return a.name.localeCompare(b.name, "zh-Hans-CN");
    });
  }, [
    employeePool,
    activeStoreEmployeeIdSet,
    filter,
    searchKeyword,
    snapshotOrder,
  ]);

  function addEmployeeIdToCurrentStore(employeeId: string) {
    setStoreEmployeeIds((current) => {
      const currentIds = current[activeStoreId] ?? [];
      function addEmployeeIdToCurrentStore(employeeId: string) {
        setStoreEmployeeIds((current) => {
          const currentIds = current[activeStoreId] ?? [];

          if (currentIds.includes(employeeId)) return current;
          if (currentIds.includes(employeeId)) return current;

          return {
            ...current,
            [activeStoreId]: [...currentIds, employeeId],
          };
        });
      }
      return {
        ...current,
        [activeStoreId]: [...currentIds, employeeId],
      };
    });
  }

  function addEmployeeIdsToCurrentStore(employeeIds: string[]) {
    setStoreEmployeeIds((current) => {
      const currentIds = current[activeStoreId] ?? [];
      const nextIds = Array.from(new Set([...currentIds, ...employeeIds]));
      function addEmployeeIdsToCurrentStore(employeeIds: string[]) {
        setStoreEmployeeIds((current) => {
          const currentIds = current[activeStoreId] ?? [];
          const nextIds = Array.from(new Set([...currentIds, ...employeeIds]));

          return {
            ...current,
            [activeStoreId]: nextIds,
          };
        });
      }
      return {
        ...current,
        [activeStoreId]: nextIds,
      };
    });
  }

  function toggleEmployeeForCurrentStore(employeeId: string) {
    setStoreEmployeeIds((current) => {
      const currentIds = current[activeStoreId] ?? [];
      const exists = currentIds.includes(employeeId);
      function toggleEmployeeForCurrentStore(employeeId: string) {
        setStoreEmployeeIds((current) => {
          const currentIds = current[activeStoreId] ?? [];
          const exists = currentIds.includes(employeeId);

          return {
            ...current,
            [activeStoreId]: exists
              ? currentIds.filter((id) => id !== employeeId)
              : [...currentIds, employeeId],
          };
        });
      }
      return {
        ...current,
        [activeStoreId]: exists
          ? currentIds.filter((id) => id !== employeeId)
          : [...currentIds, employeeId],
      };
    });
  }

  function selectAllFilteredEmployeesForCurrentStore() {
    addEmployeeIdsToCurrentStore(
      filteredEmployees.map((employee) => employee.id),
    );
  }
  function selectAllFilteredEmployeesForCurrentStore() {
    addEmployeeIdsToCurrentStore(
      filteredEmployees.map((employee) => employee.id),
    );
  }

  function removeAllFilteredEmployeesFromCurrentStore() {
    const filteredIds = new Set(
      filteredEmployees.map((employee) => employee.id),
    );
    function removeAllFilteredEmployeesFromCurrentStore() {
      const filteredIds = new Set(
        filteredEmployees.map((employee) => employee.id),
      );

      setStoreEmployeeIds((current) => {
        const currentIds = current[activeStoreId] ?? [];
        setStoreEmployeeIds((current) => {
          const currentIds = current[activeStoreId] ?? [];

          return {
            ...current,
            [activeStoreId]: currentIds.filter((id) => !filteredIds.has(id)),
          };
        });
      }
      return {
        ...current,
        [activeStoreId]: currentIds.filter((id) => !filteredIds.has(id)),
      };
    });
  }

  function addEmployee() {
    const name = newEmployeeName.trim();
    function addEmployee() {
      const name = newEmployeeName.trim();

      if (!name) return;
      if (!name) return;

      const employee: Employee = {
        id: crypto.randomUUID(),
        name,
        avatar: "",
        availabilityMode: "specific-days",
        availableDays: [],
        targetWorkDays: 5,
        capableRoles: [],
        preferredRoles: [],
        avoidRoles: [],
        hourlyRate: undefined,
      };
      const employee: Employee = {
        id: crypto.randomUUID(),
        name,
        avatar: "",
        availabilityMode: "specific-days",
        availableDays: [],
        targetWorkDays: 5,
        capableRoles: [],
        preferredRoles: [],
        avoidRoles: [],
        hourlyRate: undefined,
      };

      setEmployeePool((current) => [...current, employee]);
      addEmployeeIdToCurrentStore(employee.id);
      setNewEmployeeName("");
    }
    setEmployeePool((current) => [...current, employee]);
    addEmployeeIdToCurrentStore(employee.id);
    setNewEmployeeName("");
  }

  function deleteEmployee(employeeId: string) {
    setEmployeePool((current) =>
      current.filter((employee) => employee.id !== employeeId),
    );
    function deleteEmployee(employeeId: string) {
      setEmployeePool((current) =>
        current.filter((employee) => employee.id !== employeeId),
      );

      setStoreEmployeeIds((current) => {
        const next: StoreEmployeeMap = {};
        setStoreEmployeeIds((current) => {
          const next: StoreEmployeeMap = {};

          for (const [storeId, employeeIds] of Object.entries(current)) {
            next[storeId] = employeeIds.filter((id) => id !== employeeId);
          }
          for (const [storeId, employeeIds] of Object.entries(current)) {
            next[storeId] = employeeIds.filter((id) => id !== employeeId);
          }

          return next;
        });
      }
      return next;
    });
  }

  function updateEmployee(
    employeeId: string,
    updater: (employee: Employee) => Employee,
  ) {
    onEmployeeEdited(employeeId);
    function updateEmployee(
      employeeId: string,
      updater: (employee: Employee) => Employee,
    ) {
      onEmployeeEdited(employeeId);

      setEmployeePool((current) =>
        current.map((employee) => {
          if (employee.id !== employeeId) return employee;
          setEmployeePool((current) =>
            current.map((employee) => {
              if (employee.id !== employeeId) return employee;

              return updater(employee);
            }),
          );
        }
        return updater(employee);
    }),
    );
  }

  function toggleAvailableDay(
    employeeId: string,
    dayKey: Employee["availableDays"][number],
  ) {
    updateEmployee(employeeId, (employee) => {
      const exists = employee.availableDays.includes(dayKey);
      function toggleAvailableDay(
        employeeId: string,
        dayKey: Employee["availableDays"][number],
      ) {
        updateEmployee(employeeId, (employee) => {
          const exists = employee.availableDays.includes(dayKey);

          return {
            ...employee,
            availableDays: exists
              ? employee.availableDays.filter((day) => day !== dayKey)
              : [...employee.availableDays, dayKey],
          };
        });
      }
      return {
        ...employee,
        availableDays: exists
          ? employee.availableDays.filter((day) => day !== dayKey)
          : [...employee.availableDays, dayKey],
      };
    });
  }

  function toggleRoleField(
    employeeId: string,
    field: "capableRoles" | "preferredRoles" | "avoidRoles",
    role: string,
  ) {
    updateEmployee(employeeId, (employee) => {
      const currentRoles = employee[field] ?? [];
      const exists = currentRoles.includes(role);
      function toggleRoleField(
        employeeId: string,
        field: "capableRoles" | "preferredRoles" | "avoidRoles",
        role: string,
      ) {
        updateEmployee(employeeId, (employee) => {
          const currentRoles = employee[field] ?? [];
          const exists = currentRoles.includes(role);

          return {
            ...employee,
            [field]: exists
              ? currentRoles.filter((item) => item !== role)
              : [...currentRoles, role],
          };
        });
      }
      return {
        ...employee,
        [field]: exists
          ? currentRoles.filter((item) => item !== role)
          : [...currentRoles, role],
      };
    });
  }

  function toggleAllAvailableDays(employeeId: string) {
    updateEmployee(employeeId, (employee) => {
      const allSelected = WEEKDAYS.every((day) =>
        employee.availableDays.includes(day.key),
      );
      function toggleAllAvailableDays(employeeId: string) {
        updateEmployee(employeeId, (employee) => {
          const allSelected = WEEKDAYS.every((day) =>
            employee.availableDays.includes(day.key),
          );

          return {
            ...employee,
            availableDays: allSelected ? [] : WEEKDAYS.map((day) => day.key),
          };
        });
      }
      return {
        ...employee,
        availableDays: allSelected ? [] : WEEKDAYS.map((day) => day.key),
      };
    });
  }

  function toggleAllRoles(
    employeeId: string,
    field: "capableRoles" | "preferredRoles" | "avoidRoles",
  ) {
    updateEmployee(employeeId, (employee) => {
      const currentRoles = employee[field] ?? [];
      const allSelected = roles.every((role) => currentRoles.includes(role));
      function toggleAllRoles(
        employeeId: string,
        field: "capableRoles" | "preferredRoles" | "avoidRoles",
      ) {
        updateEmployee(employeeId, (employee) => {
          const currentRoles = employee[field] ?? [];
          const allSelected = roles.every((role) => currentRoles.includes(role));

          return {
            ...employee,
            [field]: allSelected ? [] : [...roles],
          };
        });
      }
      return {
        ...employee,
        [field]: allSelected ? [] : [...roles],
      };
    });
  }

  function setAvailabilityMode(
    employeeId: string,
    mode: Employee["availabilityMode"],
  ) {
    updateEmployee(employeeId, (employee) => ({
      ...employee,
      availabilityMode: mode,
    }));
  }
  function setAvailabilityMode(
    employeeId: string,
    mode: Employee["availabilityMode"],
  ) {
    updateEmployee(employeeId, (employee) => ({
      ...employee,
      availabilityMode: mode,
    }));
  }

  function setTargetWorkDays(employeeId: string, value: number) {
    const safeValue = Math.max(0, Math.min(7, value));
    function setTargetWorkDays(employeeId: string, value: number) {
      const safeValue = Math.max(0, Math.min(7, value));

      updateEmployee(employeeId, (employee) => ({
        ...employee,
        targetWorkDays: safeValue,
      }));
    }
    updateEmployee(employeeId, (employee) => ({
      ...employee,
      targetWorkDays: safeValue,
    }));
  }

  function setHourlyRate(employeeId: string, value: string) {
    const trimmedValue = value.trim();
    function setHourlyRate(employeeId: string, value: string) {
      const trimmedValue = value.trim();

      updateEmployee(employeeId, (employee) => {
        if (!trimmedValue) {
          return {
            ...employee,
            hourlyRate: undefined,
          };
        }
        updateEmployee(employeeId, (employee) => {
          if (!trimmedValue) {
            return {
              ...employee,
              hourlyRate: undefined,
            };
          }

          const parsedValue = Number(trimmedValue);
          const parsedValue = Number(trimmedValue);

          if (!Number.isFinite(parsedValue)) {
            return employee;
          }
          if (!Number.isFinite(parsedValue)) {
            return employee;
          }

          return {
            ...employee,
            hourlyRate: Math.max(0, parsedValue),
          };
        });
      }

  function generateTestEmployees() {
          const testEmployees: Employee[] = [
            {
              id: crypto.randomUUID(),
              name: "张三",
              avatar: "",
              availabilityMode: "specific-days",
              availableDays: WEEKDAYS.map((day) => day.key),
              targetWorkDays: 5,
              capableRoles: [...roles],
              preferredRoles: ["后厨切", "卤切"].filter((role) =>
                roles.includes(role),
              ),
              avoidRoles: [],
              hourlyRate: 30,
            },
            {
              id: crypto.randomUUID(),
              name: "李四",
              avatar: "",
              availabilityMode: "specific-days",
              availableDays: WEEKDAYS.map((day) => day.key),
              targetWorkDays: 5,
              capableRoles: ["卤切", "卤收银", "后厨切"].filter((role) =>
                roles.includes(role),
              ),
              preferredRoles: ["卤收银"].filter((role) => roles.includes(role)),
              avoidRoles: ["后厨切"].filter((role) => roles.includes(role)),
              hourlyRate: 29,
            },
            {
              id: crypto.randomUUID(),
              name: "王五",
              avatar: "",
              availabilityMode: "specific-days",
              availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
              targetWorkDays: 5,
              capableRoles: ["豆", "肠粉", "卤收银"].filter((role) =>
                roles.includes(role),
              ),
              preferredRoles: ["豆"].filter((role) => roles.includes(role)),
              avoidRoles: [],
              hourlyRate: 28,
            },
            {
              id: crypto.randomUUID(),
              name: "赵六",
              avatar: "",
              availabilityMode: "days-per-week",
              availableDays: [],
              targetWorkDays: 3,
              capableRoles: ["后厨豆", "后厨切", "后厨炸", "后厨卤"].filter((role) =>
                roles.includes(role),
              ),
              preferredRoles: ["后厨炸"].filter((role) => roles.includes(role)),
              avoidRoles: ["后厨卤"].filter((role) => roles.includes(role)),
              hourlyRate: 31,
            },
            {
              id: crypto.randomUUID(),
              name: "陈七",
              avatar: "",
              availabilityMode: "days-per-week",
              availableDays: [],
              targetWorkDays: 4,
              capableRoles: ["卤切", "后厨切", "后厨卤"].filter((role) =>
                roles.includes(role),
              ),
              preferredRoles: ["后厨切"].filter((role) => roles.includes(role)),
              avoidRoles: [],
              hourlyRate: 32,
            },
            {
              id: crypto.randomUUID(),
              name: "周八",
              avatar: "",
              availabilityMode: "specific-days",
              availableDays: ["friday", "saturday", "sunday"],
              targetWorkDays: 3,
              capableRoles: ["肠粉", "豆", "卤收银"].filter((role) =>
                roles.includes(role),
              ),
              preferredRoles: ["肠粉"].filter((role) => roles.includes(role)),
              avoidRoles: [],
              hourlyRate: 30,
            },
            {
              id: crypto.randomUUID(),
              name: "吴九",
              avatar: "",
              availabilityMode: "days-per-week",
              availableDays: [],
              targetWorkDays: 5,
              capableRoles: [...roles],
              preferredRoles: [],
              avoidRoles: [],
              hourlyRate: 29,
            },
            {
              id: crypto.randomUUID(),
              name: "郑十",
              avatar: "",
              availabilityMode: "specific-days",
              availableDays: ["monday", "wednesday", "friday", "sunday"],
              targetWorkDays: 4,
              capableRoles: ["后厨炸", "后厨豆", "豆"].filter((role) =>
                roles.includes(role),
              ),
              preferredRoles: ["后厨豆"].filter((role) => roles.includes(role)),
              avoidRoles: ["后厨炸"].filter((role) => roles.includes(role)),
              hourlyRate: 28,
            },
          ];
          function generateTestEmployees() {
            const testEmployees: Employee[] = [
              {
                id: crypto.randomUUID(),
                name: "张三",
                avatar: "",
                availabilityMode: "specific-days",
                availableDays: WEEKDAYS.map((day) => day.key),
                targetWorkDays: 5,
                capableRoles: [...roles],
                preferredRoles: ["后厨切", "卤切"].filter((role) =>
                  roles.includes(role),
                ),
                avoidRoles: [],
                hourlyRate: 30,
              },
              {
                id: crypto.randomUUID(),
                name: "李四",
                avatar: "",
                availabilityMode: "specific-days",
                availableDays: WEEKDAYS.map((day) => day.key),
                targetWorkDays: 5,
                capableRoles: ["卤切", "卤收银", "后厨切"].filter((role) =>
                  roles.includes(role),
                ),
                preferredRoles: ["卤收银"].filter((role) => roles.includes(role)),
                avoidRoles: ["后厨切"].filter((role) => roles.includes(role)),
                hourlyRate: 29,
              },
              {
                id: crypto.randomUUID(),
                name: "王五",
                avatar: "",
                availabilityMode: "specific-days",
                availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
                targetWorkDays: 5,
                capableRoles: ["豆", "肠粉", "卤收银"].filter((role) =>
                  roles.includes(role),
                ),
                preferredRoles: ["豆"].filter((role) => roles.includes(role)),
                avoidRoles: [],
                hourlyRate: 28,
              },
              {
                id: crypto.randomUUID(),
                name: "赵六",
                avatar: "",
                availabilityMode: "days-per-week",
                availableDays: [],
                targetWorkDays: 3,
                capableRoles: ["后厨豆", "后厨切", "后厨炸", "后厨卤"].filter((role) =>
                  roles.includes(role),
                ),
                preferredRoles: ["后厨炸"].filter((role) => roles.includes(role)),
                avoidRoles: ["后厨卤"].filter((role) => roles.includes(role)),
                hourlyRate: 31,
              },
              {
                id: crypto.randomUUID(),
                name: "陈七",
                avatar: "",
                availabilityMode: "days-per-week",
                availableDays: [],
                targetWorkDays: 4,
                capableRoles: ["卤切", "后厨切", "后厨卤"].filter((role) =>
                  roles.includes(role),
                ),
                preferredRoles: ["后厨切"].filter((role) => roles.includes(role)),
                avoidRoles: [],
                hourlyRate: 32,
              },
              {
                id: crypto.randomUUID(),
                name: "周八",
                avatar: "",
                availabilityMode: "specific-days",
                availableDays: ["friday", "saturday", "sunday"],
                targetWorkDays: 3,
                capableRoles: ["肠粉", "豆", "卤收银"].filter((role) =>
                  roles.includes(role),
                ),
                preferredRoles: ["肠粉"].filter((role) => roles.includes(role)),
                avoidRoles: [],
                hourlyRate: 30,
              },
              {
                id: crypto.randomUUID(),
                name: "吴九",
                avatar: "",
                availabilityMode: "days-per-week",
                availableDays: [],
                targetWorkDays: 5,
                capableRoles: [...roles],
                preferredRoles: [],
                avoidRoles: [],
                hourlyRate: 29,
              },
              {
                id: crypto.randomUUID(),
                name: "郑十",
                avatar: "",
                availabilityMode: "specific-days",
                availableDays: ["monday", "wednesday", "friday", "sunday"],
                targetWorkDays: 4,
                capableRoles: ["后厨炸", "后厨豆", "豆"].filter((role) =>
                  roles.includes(role),
                ),
                preferredRoles: ["后厨豆"].filter((role) => roles.includes(role)),
                avoidRoles: ["后厨炸"].filter((role) => roles.includes(role)),
                hourlyRate: 28,
              },
            ];

            setEmployeePool((current) => [...current, ...testEmployees]);
            addEmployeeIdsToCurrentStore(testEmployees.map((employee) => employee.id));
            setImportError("");
          }

          function renderRoleButtons(
            employee: Employee,
            field: "capableRoles" | "preferredRoles" | "avoidRoles",
            activeClass: string,
          ) {
            const currentRoles = employee[field] ?? [];
            function renderRoleButtons(
              employee: Employee,
              field: "capableRoles" | "preferredRoles" | "avoidRoles",
              activeClass: string,
            ) {
              const currentRoles = employee[field] ?? [];

              return (
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => {
                    const checked = currentRoles.includes(role);
                    return (
                      <div className="flex flex-wrap gap-2">
                        {roles.map((role) => {
                          const checked = currentRoles.includes(role);

                          return (
                            <button
                              key={role}
                              onClick={() => toggleRoleField(employee.id, field, role)}
                              className={
                                checked
                                  ? `rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-950 ${activeClass}`
                                  : "rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900"
                              }
                            >
                              {role}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }
          return (
                  <button
                    key={role}
                    onClick={() => toggleRoleField(employee.id, field, role)}
                    className={
                      checked
                        ? `rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-950 ${activeClass}`
                        : "rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900"
                    }
                  >
                    {role}
                  </button>
                  );
        })}
                </div>
              );
            }

            function togglePreferencePanel(employeeId: string) {
              setExpandedPreferenceEmployeeIds((current) =>
                current.includes(employeeId)
                  ? current.filter((id) => id !== employeeId)
                  : [...current, employeeId],
              );
            }
            function togglePreferencePanel(employeeId: string) {
              setExpandedPreferenceEmployeeIds((current) =>
                current.includes(employeeId)
                  ? current.filter((id) => id !== employeeId)
                  : [...current, employeeId],
              );
            }

            return (
              <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">员工池</h2>
                    <p className="mt-1 text-sm text-neutral-400">
                      当前门店：{activeStoreName}
                      。勾选员工后，该员工才会参与当前门店排班。
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      员工池 {employeePool.length} 人，当前门店已选{" "}
                      {activeStoreEmployeeIds.length} 人。
                    </p>
                  </div>
                  return (
                  <section className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6">
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div>
                        <h2 className="text-xl font-bold">员工池</h2>
                        <p className="mt-1 text-sm text-neutral-400">
                          当前门店：{activeStoreName}
                          。勾选员工后，该员工才会参与当前门店排班。
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          员工池 {employeePool.length} 人，当前门店已选{" "}
                          {activeStoreEmployeeIds.length} 人。
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <input
                          value={newEmployeeName}
                          onChange={(event) => setNewEmployeeName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") addEmployee();
                          }}
                          placeholder="员工姓名"
                          className="w-44 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-amber-500"
                        />
                        <div className="flex flex-wrap gap-3">
                          <input
                            value={newEmployeeName}
                            onChange={(event) => setNewEmployeeName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") addEmployee();
                            }}
                            placeholder="员工姓名"
                            className="w-44 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-amber-500"
                          />

                          <button
                            onClick={addEmployee}
                            className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-white"
                          >
                            + 添加员工
                          </button>
                          <button
                            onClick={addEmployee}
                            className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-white"
                          >
                            + 添加员工
                          </button>

                          <button
                            onClick={generateTestEmployees}
                            className="rounded-xl border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-950/40"
                          >
                            生成测试数据
                          </button>

                          <button
                            onClick={onSaveToCloud}
                            disabled={cloudSyncing}
                            className={
                              cloudSyncing
                                ? "rounded-xl border border-sky-700/40 bg-sky-950/20 px-4 py-2 text-sm font-semibold text-sky-400/60"
                                : "rounded-xl border border-sky-700 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-950/40"
                            }
                          >
                            {cloudSyncing ? "保存中…" : "☁ 保存到云端"}
                          </button>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
                          <button
                            onClick={() => setFilterCollapsed((v) => !v)}
                            className="flex w-full items-center justify-between"
                          >
                            <h3 className="font-semibold text-neutral-100">筛选员工池</h3>
                            <span
                              className={`text-neutral-400 text-lg transition-transform duration-200 ${filterCollapsed ? "" : "rotate-90"
                                }`}
                            >
                              ▶
                            </span>
                          </button>

                          {!filterCollapsed && (
                            <>
                              <div className="mt-4 flex flex-wrap gap-3">
                                <input
                                  value={searchKeyword}
                                  onChange={(event) => setSearchKeyword(event.target.value)}
                                  placeholder="搜索员工姓名"
                                  className="w-56 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-amber-500"
                                />
                                {!filterCollapsed && (
                                  <>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                      <input
                                        value={searchKeyword}
                                        onChange={(event) => setSearchKeyword(event.target.value)}
                                        placeholder="搜索员工姓名"
                                        className="w-56 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-amber-500"
                                      />

                                      <select
                                        value={filter}
                                        onChange={(event) =>
                                          setFilter(event.target.value as EmployeeFilter)
                                        }
                                        className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-100 outline-none focus:border-amber-500"
                                      >
                                        <option value="all">全部员工</option>
                                        <option value="active-store">当前门店已选</option>
                                        <option value="not-active-store">当前门店未选</option>
                                      </select>
                                      <select
                                        value={filter}
                                        onChange={(event) =>
                                          setFilter(event.target.value as EmployeeFilter)
                                        }
                                        className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-100 outline-none focus:border-amber-500"
                                      >
                                        <option value="all">全部员工</option>
                                        <option value="active-store">当前门店已选</option>
                                        <option value="not-active-store">当前门店未选</option>
                                      </select>

                                      <button
                                        onClick={selectAllFilteredEmployeesForCurrentStore}
                                        className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
                                      >
                                        当前筛选全选入门店
                                      </button>
                                      <button
                                        onClick={selectAllFilteredEmployeesForCurrentStore}
                                        className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
                                      >
                                        当前筛选全选入门店
                                      </button>

                                      <button
                                        onClick={removeAllFilteredEmployeesFromCurrentStore}
                                        className="rounded-xl border border-red-900/70 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40"
                                      >
                                        当前筛选移出门店
                                      </button>
                                    </div>
                                    <button
                                      onClick={removeAllFilteredEmployeesFromCurrentStore}
                                      className="rounded-xl border border-red-900/70 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40"
                                    >
                                      当前筛选移出门店
                                    </button>
                                  </div>

                                <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-500">
                                  提示：员工是否愿意跨店不作为系统字段。使用者在这里勾选时自行判断。
                                </div>
                              </>
          )}
                            </div>
                        </div>
                        <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 text-sm text-neutral-500">
                          提示：员工是否愿意跨店不作为系统字段。使用者在这里勾选时自行判断。
                        </div>
                      </>
          )}
                    </div>
                </div>

                {filteredEmployees.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-700 p-8 text-center text-sm text-neutral-500">
                    没有匹配的员工
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEmployees.map((employee) => {
                      const inCurrentStore = activeStoreEmployeeIdSet.has(employee.id);
                      {
                        filteredEmployees.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-neutral-700 p-8 text-center text-sm text-neutral-500">
                            没有匹配的员工
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {filteredEmployees.map((employee) => {
                              const inCurrentStore = activeStoreEmployeeIdSet.has(employee.id);

                              return (
                                <article
                                  key={employee.id}
                                  className={
                                    inCurrentStore
                                      ? "rounded-2xl border border-amber-300 bg-white p-4"
                                      : "rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 opacity-80"
                                  }
                                >
                                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold text-neutral-100">
                                          {employee.name}
                                        </h3>
                                        return (
                                        <article
                                          key={employee.id}
                                          className={
                                            inCurrentStore
                                              ? "rounded-2xl border border-amber-300 bg-white p-4"
                                              : "rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 opacity-80"
                                          }
                                        >
                                          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                              <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-neutral-100">
                                                  {employee.name}
                                                </h3>

                                                <button
                                                  onClick={() =>
                                                    toggleEmployeeForCurrentStore(employee.id)
                                                  }
                                                  className={
                                                    inCurrentStore
                                                      ? "rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-neutral-950"
                                                      : "rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400 hover:bg-neutral-900"
                                                  }
                                                >
                                                  {inCurrentStore
                                                    ? `已加入 ${activeStoreName}`
                                                    : `加入 ${activeStoreName}`}
                                                </button>

                                                <span
                                                  className={
                                                    syncedEmployeeIds.has(employee.id)
                                                      ? "rounded-full border border-emerald-700 px-2 py-0.5 text-[10px] text-emerald-400"
                                                      : "rounded-full border border-amber-700 px-2 py-0.5 text-[10px] text-amber-400"
                                                  }
                                                >
                                                  {syncedEmployeeIds.has(employee.id)
                                                    ? "云端"
                                                    : "本地"}
                                                </span>
                                              </div>

                                              <p className="mt-1 text-xs text-neutral-500">
                                                {employee.availabilityMode === "specific-days"
                                                  ? `可上班 ${employee.availableDays.length} 天`
                                                  : `每周目标 ${employee.targetWorkDays} 天`}
                                                ，可做 {employee.capableRoles.length} 个岗位，偏好{" "}
                                                {employee.preferredRoles.length} 个，避免{" "}
                                                {employee.avoidRoles.length} 个
                                                {typeof employee.hourlyRate === "number"
                                                  ? `，时薪 $${employee.hourlyRate.toFixed(2)}/h`
                                                  : "，未设置时薪"}
                                              </p>
                                            </div>
                                            <p className="mt-1 text-xs text-neutral-500">
                                              {employee.availabilityMode === "specific-days"
                                                ? `可上班 ${employee.availableDays.length} 天`
                                                : `每周目标 ${employee.targetWorkDays} 天`}
                                              ，可做 {employee.capableRoles.length} 个岗位，偏好{" "}
                                              {employee.preferredRoles.length} 个，避免{" "}
                                              {employee.avoidRoles.length} 个
                                              {typeof employee.hourlyRate === "number"
                                                ? `，时薪 $${employee.hourlyRate.toFixed(2)}/h`
                                                : "，未设置时薪"}
                                            </p>
                                          </div>

                                          <div className="flex flex-wrap gap-2">
                                            <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500">
                                              <span>时薪</span>
                                              <span className="text-neutral-400">$</span>
                                              <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                value={employee.hourlyRate ?? ""}
                                                onChange={(event) =>
                                                  setHourlyRate(employee.id, event.target.value)
                                                }
                                                placeholder="0.00"
                                                className="w-20 border-none bg-transparent p-0 text-xs text-neutral-900 outline-none"
                                              />
                                              <span className="text-neutral-400">/h</span>
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                              <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-500">
                                                <span>时薪</span>
                                                <span className="text-neutral-400">$</span>
                                                <input
                                                  type="number"
                                                  min={0}
                                                  step={0.01}
                                                  value={employee.hourlyRate ?? ""}
                                                  onChange={(event) =>
                                                    setHourlyRate(employee.id, event.target.value)
                                                  }
                                                  placeholder="0.00"
                                                  className="w-20 border-none bg-transparent p-0 text-xs text-neutral-900 outline-none"
                                                />
                                                <span className="text-neutral-400">/h</span>
                                              </label>

                                              <button
                                                onClick={() => deleteEmployee(employee.id)}
                                                className="rounded-lg border border-red-900/70 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/40"
                                              >
                                                删除
                                              </button>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => deleteEmployee(employee.id)}
                                            className="rounded-lg border border-red-900/70 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/40"
                                          >
                                            删除
                                          </button>
                                      </div>
                                    </div>

                                    <div className="grid gap-5 xl:grid-cols-2">
                                      <div>
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                          <p className="text-sm font-medium text-neutral-300">
                                            上班时间约束
                                          </p>
                                        </div>
                                        <div className="grid gap-5 xl:grid-cols-2">
                                          <div>
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                              <p className="text-sm font-medium text-neutral-300">
                                                上班时间约束
                                              </p>
                                            </div>

                                            <div className="mb-3 flex flex-wrap gap-2">
                                              <button
                                                onClick={() =>
                                                  setAvailabilityMode(employee.id, "specific-days")
                                                }
                                                className={
                                                  employee.availabilityMode === "specific-days"
                                                    ? "rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-neutral-950"
                                                    : "rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900"
                                                }
                                              >
                                                指定星期
                                              </button>
                                              <div className="mb-3 flex flex-wrap gap-2">
                                                <button
                                                  onClick={() =>
                                                    setAvailabilityMode(employee.id, "specific-days")
                                                  }
                                                  className={
                                                    employee.availabilityMode === "specific-days"
                                                      ? "rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-neutral-950"
                                                      : "rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900"
                                                  }
                                                >
                                                  指定星期
                                                </button>

                                                <button
                                                  onClick={() =>
                                                    setAvailabilityMode(employee.id, "days-per-week")
                                                  }
                                                  className={
                                                    employee.availabilityMode === "days-per-week"
                                                      ? "rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-neutral-950"
                                                      : "rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900"
                                                  }
                                                >
                                                  每周上 X 天
                                                </button>
                                              </div>
                                              <button
                                                onClick={() =>
                                                  setAvailabilityMode(employee.id, "days-per-week")
                                                }
                                                className={
                                                  employee.availabilityMode === "days-per-week"
                                                    ? "rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-neutral-950"
                                                    : "rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900"
                                                }
                                              >
                                                每周上 X 天
                                              </button>
                                            </div>

                                            {employee.availabilityMode === "specific-days" ? (
                                              <>
                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                  <p className="text-xs text-neutral-500">
                                                    选择这个员工可以上班的星期
                                                  </p>
                                                  <button
                                                    onClick={() => toggleAllAvailableDays(employee.id)}
                                                    className="rounded-lg border border-neutral-700 px-2.5 py-1 text-xs text-neutral-400 hover:bg-neutral-900"
                                                  >
                                                    {WEEKDAYS.every((day) =>
                                                      employee.availableDays.includes(day.key),
                                                    )
                                                      ? "取消全选"
                                                      : "全选"}
                                                  </button>
                                                </div>
                                                {employee.availabilityMode === "specific-days" ? (
                                                  <>
                                                    <div className="mb-2 flex items-center justify-between gap-3">
                                                      <p className="text-xs text-neutral-500">
                                                        选择这个员工可以上班的星期
                                                      </p>
                                                      <button
                                                        onClick={() => toggleAllAvailableDays(employee.id)}
                                                        className="rounded-lg border border-neutral-700 px-2.5 py-1 text-xs text-neutral-400 hover:bg-neutral-900"
                                                      >
                                                        {WEEKDAYS.every((day) =>
                                                          employee.availableDays.includes(day.key),
                                                        )
                                                          ? "取消全选"
                                                          : "全选"}
                                                      </button>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                      {WEEKDAYS.map((day) => {
                                                        const checked = employee.availableDays.includes(
                                                          day.key,
                                                        );
                                                        <div className="flex flex-wrap gap-2">
                                                          {WEEKDAYS.map((day) => {
                                                            const checked = employee.availableDays.includes(
                                                              day.key,
                                                            );

                                                            return (
                                                              <button
                                                                key={day.key}
                                                                onClick={() =>
                                                                  toggleAvailableDay(employee.id, day.key)
                                                                }
                                                                className={
                                                                  checked
                                                                    ? "rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-neutral-950"
                                                                    : "rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900"
                                                                }
                                                              >
                                                                {day.shortLabel}
                                                              </button>
                                                            );
                                                          })}
                                                        </div>
                      </>
                                                    ) : (
                                                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                                                      <label className="block text-xs text-neutral-500">
                                                        这周需要上班天数
                                                      </label>
                                                      return (
                                                      <button
                                                        key={day.key}
                                                        onClick={() =>
                                                          toggleAvailableDay(employee.id, day.key)
                                                        }
                                                        className={
                                                          checked
                                                            ? "rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-neutral-950"
                                                            : "rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:bg-neutral-900"
                                                        }
                                                      >
                                                        {day.shortLabel}
                                                      </button>
                                                      );
                          })}
                                                    </div>
                                                  </>
                                                ) : (
                                                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                                                    <label className="block text-xs text-neutral-500">
                                                      这周需要上班天数
                                                    </label>

                                                    <div className="mt-2 flex items-center gap-3">
                                                      <input
                                                        type="number"
                                                        min={0}
                                                        max={7}
                                                        value={employee.targetWorkDays}
                                                        onChange={(event) =>
                                                          setTargetWorkDays(
                                                            employee.id,
                                                            Number(event.target.value),
                                                          )
                                                        }
                                                        className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-500"
                                                      />
                                                      <div className="mt-2 flex items-center gap-3">
                                                        <input
                                                          type="number"
                                                          min={0}
                                                          max={7}
                                                          value={employee.targetWorkDays}
                                                          onChange={(event) =>
                                                            setTargetWorkDays(
                                                              employee.id,
                                                              Number(event.target.value),
                                                            )
                                                          }
                                                          className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-500"
                                                        />

                                                        <span className="text-sm text-neutral-400">天</span>
                                                      </div>
                                                      <span className="text-sm text-neutral-400">天</span>
                                                    </div>

                                                    <p className="mt-2 text-xs text-neutral-600">
                                                      不限定具体星期，生成排班时会尽量安排到{" "}
                                                      {employee.targetWorkDays} 天。
                                                    </p>
                                                  </div>
                                                )}
                                              </div>
                                            <p className="mt-2 text-xs text-neutral-600">
                                              不限定具体星期，生成排班时会尽量安排到{" "}
                                              {employee.targetWorkDays} 天。
                                            </p>
                                          </div>
                    )}
                                        </div>

                                        <div className="space-y-4">
                                          <div>
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                              <p className="text-sm font-medium text-neutral-300">
                                                可做岗位
                                              </p>
                                              <button
                                                onClick={() =>
                                                  toggleAllRoles(employee.id, "capableRoles")
                                                }
                                                className="rounded-lg border border-neutral-700 px-2.5 py-1 text-xs text-neutral-400 hover:bg-neutral-900"
                                              >
                                                {roles.every((role) =>
                                                  employee.capableRoles.includes(role),
                                                )
                                                  ? "取消全选"
                                                  : "全选"}
                                              </button>
                                            </div>
                                            <div className="space-y-4">
                                              <div>
                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                  <p className="text-sm font-medium text-neutral-300">
                                                    可做岗位
                                                  </p>
                                                  <button
                                                    onClick={() =>
                                                      toggleAllRoles(employee.id, "capableRoles")
                                                    }
                                                    className="rounded-lg border border-neutral-700 px-2.5 py-1 text-xs text-neutral-400 hover:bg-neutral-900"
                                                  >
                                                    {roles.every((role) =>
                                                      employee.capableRoles.includes(role),
                                                    )
                                                      ? "取消全选"
                                                      : "全选"}
                                                  </button>
                                                </div>

                                                {renderRoleButtons(
                                                  employee,
                                                  "capableRoles",
                                                  "bg-emerald-500",
                                                )}
                                              </div>
                                              {renderRoleButtons(
                                                employee,
                                                "capableRoles",
                                                "bg-emerald-500",
                                              )}
                                            </div>

                                            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                                              <button
                                                onClick={() => togglePreferencePanel(employee.id)}
                                                className="flex w-full items-center justify-between gap-3 text-left"
                                              >
                                                <div>
                                                  <p className="text-sm font-medium text-neutral-800">
                                                    偏好 / 避免岗位
                                                  </p>
                                                  <p className="mt-1 text-xs text-neutral-500">
                                                    偏好 {employee.preferredRoles.length} 个，避免{" "}
                                                    {employee.avoidRoles.length} 个
                                                  </p>
                                                </div>
                                                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                                                  <button
                                                    onClick={() => togglePreferencePanel(employee.id)}
                                                    className="flex w-full items-center justify-between gap-3 text-left"
                                                  >
                                                    <div>
                                                      <p className="text-sm font-medium text-neutral-800">
                                                        偏好 / 避免岗位
                                                      </p>
                                                      <p className="mt-1 text-xs text-neutral-500">
                                                        偏好 {employee.preferredRoles.length} 个，避免{" "}
                                                        {employee.avoidRoles.length} 个
                                                      </p>
                                                    </div>

                                                    <span className="rounded-full border border-neutral-300 px-2.5 py-1 text-xs text-neutral-500">
                                                      {expandedPreferenceEmployeeIds.includes(employee.id)
                                                        ? "收起"
                                                        : "展开"}
                                                    </span>
                                                  </button>
                                                  <span className="rounded-full border border-neutral-300 px-2.5 py-1 text-xs text-neutral-500">
                                                    {expandedPreferenceEmployeeIds.includes(employee.id)
                                                      ? "收起"
                                                      : "展开"}
                                                  </span>
                                              </button>

                                              {expandedPreferenceEmployeeIds.includes(employee.id) ? (
                                                <div className="mt-4 space-y-4 border-t border-neutral-200 pt-4">
                                                  <div>
                                                    <div className="mb-2">
                                                      <p className="text-sm font-medium text-neutral-700">
                                                        偏好岗位
                                                      </p>
                                                      <p className="mt-1 text-xs text-neutral-500">
                                                        生成排班时会优先安排这些岗位。
                                                      </p>
                                                    </div>
                                                    {expandedPreferenceEmployeeIds.includes(employee.id) ? (
                        <div className="mt-4 space-y-4 border-t border-neutral-200 pt-4">
                          <div>
                            <div className="mb-2">
                              <p className="text-sm font-medium text-neutral-700">
                                偏好岗位
                              </p>
                              <p className="mt-1 text-xs text-neutral-500">
                                生成排班时会优先安排这些岗位。
                              </p>
                            </div>

                            {renderRoleButtons(
                              employee,
                              "preferredRoles",
                              "bg-sky-500",
                            )}
                          </div>
                            {renderRoleButtons(
                              employee,
                              "preferredRoles",
                              "bg-sky-500",
                            )}
                          </div>

                          <div>
                            <div className="mb-2">
                              <p className="text-sm font-medium text-neutral-700">
                                尽量避免岗位
                              </p>
                              <p className="mt-1 text-xs text-neutral-500">
                                生成排班时会尽量避免，但必要时仍可能安排。
                              </p>
                            </div>
                          <div>
                            <div className="mb-2">
                              <p className="text-sm font-medium text-neutral-700">
                                尽量避免岗位
                              </p>
                              <p className="mt-1 text-xs text-neutral-500">
                                生成排班时会尽量避免，但必要时仍可能安排。
                              </p>
                            </div>

                            {renderRoleButtons(
                              employee,
                              "avoidRoles",
                              "bg-red-500",
                            )}
                          </div>
                        </div>
                                                    ) : null}
                                                  </div>
                                                </div>
                </div>
                                          </article>
                                          );
          })}
                                        </div>
      )}
                                      </section>
                                      );
                                      {renderRoleButtons(
                                        employee,
                                        "avoidRoles",
                                        "bg-red-500",
                                      )}
                                    </div>
                                  </div>
                      ) : null}
                                </div>
                  </div>
                </div>
              </article>
            );
          })
    }
        </div >
      )
  }
    </section >
  );
}
