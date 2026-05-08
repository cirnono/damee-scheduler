"use client";

import { useState } from "react";
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    type DragOverEvent,
    type DragStartEvent,
    useDraggable,
    useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
    WEEKDAYS,
    type RoleGroupConfig,
    type WeekdayKey,
} from "@/lib/scheduler-config";
import type { Employee, ScheduleCell } from "@/lib/types";
import type { WeekDateInfo } from "@/lib/date-utils";

type ScheduleBoardProps = {
    roleGroups: RoleGroupConfig[];
    roles: string[];
    weekDates: WeekDateInfo[];
    employees: Employee[];
    cells: ScheduleCell[];
    onAssignEmployee: (
        day: WeekdayKey,
        role: string,
        employeeId: string | null,
    ) => void;
    onMoveScheduleEmployee: (params: {
        fromDay: WeekdayKey;
        fromRole: string;
        toDay: WeekdayKey;
        toRole: string;
    }) => void;
    onToggleCellLock: (day: WeekdayKey, role: string) => void;
};

type SelectedCell = {
    day: WeekdayKey;
    role: string;
};

type DraggedEmployee = {
    employeeId: string;
    fromDay?: WeekdayKey;
    fromRole?: string;
};

type DragValidation = {
    valid: boolean;
    reasons: string[];
};

type DraggableEmployeeChipProps = {
    employee: Employee;
    highlightedDay: WeekdayKey | null;
    isUnassignedOnHighlightedDay: boolean;
};

type DraggableScheduledEmployeeProps = {
    employeeId: string;
    employeeName: string;
    day: WeekdayKey;
    role: string;
};

type DroppableScheduleCellProps = {
    day: WeekdayKey;
    role: string;
    employeeId: string | null;
    employeeName: string;
    isEmpty: boolean;
    locked: boolean;
    dragValidation: DragValidation | null;
    isDragOver: boolean;
    onClick: () => void;
    onToggleLock: () => void;
};

function canEmployeeWorkOnDay(employee: Employee, day: WeekdayKey) {
    if (employee.availabilityMode === "specific-days") {
        return employee.availableDays.includes(day);
    }

    return true;
}

function canEmployeeDoRole(employee: Employee, role: string) {
    return employee.capableRoles.includes(role);
}

const EMPLOYEE_DOT_COLORS = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
];

function getEmployeeColorClass(employeeId: string) {
    let hash = 0;

    for (const char of employeeId) {
        hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    }

    return EMPLOYEE_DOT_COLORS[hash % EMPLOYEE_DOT_COLORS.length];
}

function getEmployeeAssignedDays(cells: ScheduleCell[], employeeId: string) {
    return new Set(
        cells
            .filter((cell) => cell.employeeId === employeeId)
            .map((cell) => cell.day),
    );
}

function isEmployeeAssignedOnDay(
    cells: ScheduleCell[],
    employeeId: string,
    day: WeekdayKey,
) {
    return cells.some(
        (cell) => cell.employeeId === employeeId && cell.day === day,
    );
}

function getDragValidation(
    employee: Employee | undefined,
    day: WeekdayKey,
    role: string,
) {
    if (!employee) {
        return {
            valid: false,
            reasons: ["找不到员工"],
        };
    }

    const reasons: string[] = [];

    if (!canEmployeeWorkOnDay(employee, day)) {
        reasons.push("当天不可上班");
    }

    if (!canEmployeeDoRole(employee, role)) {
        reasons.push("不会该岗位");
    }

    return {
        valid: reasons.length === 0,
        reasons,
    };
}

function parseCellId(cellId: string) {
    const [, day, ...roleParts] = cellId.split(":");
    const role = roleParts.join(":");

    if (!day || !role) return null;

    return {
        day: day as WeekdayKey,
        role,
    };
}

function parseScheduledId(scheduledId: string) {
    const [, day, role, employeeId] = scheduledId.split(":");

    if (!day || !role || !employeeId) return null;

    return {
        day: day as WeekdayKey,
        role,
        employeeId,
    };
}

function parseDraggedEmployee(activeId: string): DraggedEmployee | null {
    if (activeId.startsWith("employee:")) {
        const employeeId = activeId.replace("employee:", "");

        return {
            employeeId,
        };
    }

    if (activeId.startsWith("scheduled:")) {
        const source = parseScheduledId(activeId);

        if (!source) return null;

        return {
            employeeId: source.employeeId,
            fromDay: source.day,
            fromRole: source.role,
        };
    }

    return null;
}

function DraggableEmployeeChip({
    employee,
    highlightedDay,
    isUnassignedOnHighlightedDay,
}: DraggableEmployeeChipProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: `employee:${employee.id}`,
        });

    const style = {
        transform: CSS.Transform.toString(transform),
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={
                isDragging
                    ? "flex cursor-grabbing items-center gap-2 rounded-full border border-amber-500 bg-amber-500 px-3 py-2 text-sm font-semibold text-neutral-950 opacity-70 shadow-xl"
                    : highlightedDay
                      ? isUnassignedOnHighlightedDay
                          ? "flex cursor-grab items-center gap-2 rounded-full border border-emerald-500 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                          : "flex cursor-grab items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-2 text-sm text-neutral-400 opacity-60 hover:bg-neutral-100"
                      : "flex cursor-grab items-center gap-2 rounded-full border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 hover:border-amber-500 hover:bg-neutral-900"
            }
            title={
                highlightedDay
                    ? isUnassignedOnHighlightedDay
                        ? "该员工在当前选中的日期还未安排"
                        : "该员工在当前选中的日期已经安排过"
                    : "拖到岗位格子即可安排"
            }
        >
            <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${getEmployeeColorClass(employee.id)}`}
            />
            <span>{employee.name}</span>
        </div>
    );
}

function DraggableScheduledEmployee({
    employeeId,
    employeeName,
    day,
    role,
}: DraggableScheduledEmployeeProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: `scheduled:${day}:${role}:${employeeId}`,
        });

    const style = {
        transform: CSS.Transform.toString(transform),
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={(event) => {
                event.stopPropagation();
            }}
            className={
                isDragging
                    ? "mt-1 flex cursor-grabbing items-center gap-2 rounded-lg bg-amber-500 px-2 py-1 text-sm font-semibold text-neutral-950 opacity-80 shadow-xl"
                    : "mt-1 flex cursor-grab items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-neutral-100 hover:bg-neutral-100"
            }
            title="拖到另一个岗位格子可移动或交换"
        >
            <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${getEmployeeColorClass(employeeId)}`}
            />
            <span>{employeeName}</span>
        </div>
    );
}

function DroppableScheduleCell({
    day,
    role,
    employeeId,
    employeeName,
    isEmpty,
    locked,
    dragValidation,
    isDragOver,
    onClick,
    onToggleLock,
}: DroppableScheduleCellProps) {
    const { setNodeRef } = useDroppable({
        id: `cell:${day}:${role}`,
    });

    const draggingClass =
        isDragOver && dragValidation
            ? dragValidation.valid
                ? "border-emerald-500 bg-emerald-950/30"
                : "border-red-500 bg-red-950/30"
            : "";

    const baseClass = locked
        ? "border-amber-400 bg-amber-50 hover:border-amber-500 hover:bg-amber-100"
        : isEmpty
          ? "border-red-900/50 bg-red-950/10 hover:border-red-700 hover:bg-red-950/30"
          : "border-neutral-800 bg-neutral-950/70 hover:border-amber-600/70 hover:bg-neutral-900";

    return (
        <div
            ref={setNodeRef}
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onClick();
                }
            }}
            className={`w-full cursor-pointer rounded-xl border p-3 text-left transition ${draggingClass || baseClass}`}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-neutral-500">{role}</p>

                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggleLock();
                    }}
                    className="flex items-center gap-1.5 rounded-full px-1 py-0.5 hover:bg-neutral-100"
                    title={
                        locked
                            ? "已锁定，重新生成时不会覆盖"
                            : "未锁定，重新生成时可以覆盖"
                    }
                >
                    <span className="text-[10px] text-neutral-500">
                        {locked ? "锁定" : "未锁"}
                    </span>
                    <span
                        className={
                            locked
                                ? "relative h-4 w-8 rounded-full bg-amber-500 transition"
                                : "relative h-4 w-8 rounded-full bg-neutral-300 transition"
                        }
                    >
                        <span
                            className={
                                locked
                                    ? "absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow transition"
                                    : "absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow transition"
                            }
                        />
                    </span>
                </button>
            </div>

            {employeeId ? (
                <DraggableScheduledEmployee
                    employeeId={employeeId}
                    employeeName={employeeName}
                    day={day}
                    role={role}
                />
            ) : (
                <p className="mt-1 text-sm font-medium text-red-300">未安排</p>
            )}

            {isDragOver && dragValidation ? (
                <div className="mt-2 text-xs">
                    {dragValidation.valid ? (
                        <p className="font-medium text-emerald-300">
                            符合约束，松开即可安排 / 交换
                        </p>
                    ) : (
                        <div className="space-y-1 text-red-300">
                            <p className="font-medium">
                                不符合约束，但可强制安排
                            </p>
                            {dragValidation.reasons.map((reason) => (
                                <p key={reason}>- {reason}</p>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}

export function ScheduleBoard({
    roleGroups,
    roles,
    employees,
    cells,
    weekDates,
    onAssignEmployee,
    onMoveScheduleEmployee,
    onToggleCellLock,
}: ScheduleBoardProps) {
    const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);
    const [draggedEmployee, setDraggedEmployee] =
        useState<DraggedEmployee | null>(null);
    const [dragOverCell, setDragOverCell] = useState<SelectedCell | null>(null);
    const [highlightedDay, setHighlightedDay] = useState<WeekdayKey | null>(
        null,
    );

    const selectedDay = WEEKDAYS.find((day) => day.key === selectedCell?.day);

    const draggingFromEmployeeBar =
        draggedEmployee !== null &&
        !draggedEmployee.fromDay &&
        !draggedEmployee.fromRole;

    const draggedEmployeeAssignedDays = draggedEmployee
        ? getEmployeeAssignedDays(cells, draggedEmployee.employeeId)
        : new Set<WeekdayKey>();

    function getEmployeeName(employeeId: string | null) {
        if (!employeeId) return "未安排";

        return (
            employees.find((employee) => employee.id === employeeId)?.name ??
            "未知员工"
        );
    }

    function getEmployee(employeeId: string | null) {
        if (!employeeId) return undefined;

        return employees.find((employee) => employee.id === employeeId);
    }

    function getCell(dayKey: WeekdayKey, role: string) {
        return cells.find((cell) => cell.day === dayKey && cell.role === role);
    }

    function handleAssign(employeeId: string | null) {
        if (!selectedCell) return;

        onAssignEmployee(selectedCell.day, selectedCell.role, employeeId);
        setSelectedCell(null);
    }

    function handleDragStart(event: DragStartEvent) {
        const activeId = String(event.active.id);
        const parsed = parseDraggedEmployee(activeId);

        setDraggedEmployee(parsed);
    }

    function handleDragOver(event: DragOverEvent) {
        const overId = event.over?.id ? String(event.over.id) : "";

        if (!overId.startsWith("cell:")) {
            setDragOverCell(null);
            return;
        }

        const target = parseCellId(overId);

        setDragOverCell(target);
    }

    function handleDragEnd(event: DragEndEvent) {
        const activeId = String(event.active.id);
        const overId = event.over?.id ? String(event.over.id) : "";

        setDraggedEmployee(null);
        setDragOverCell(null);

        if (!overId.startsWith("cell:")) return;

        const target = parseCellId(overId);

        if (!target) return;

        if (activeId.startsWith("employee:")) {
            const employeeId = activeId.replace("employee:", "");

            onAssignEmployee(target.day, target.role, employeeId);
            return;
        }

        if (activeId.startsWith("scheduled:")) {
            const source = parseScheduledId(activeId);

            if (!source) return;

            if (source.day === target.day && source.role === target.role)
                return;

            onMoveScheduleEmployee({
                fromDay: source.day,
                fromRole: source.role,
                toDay: target.day,
                toRole: target.role,
            });
        }
    }

    function handleDragCancel() {
        setDraggedEmployee(null);
        setDragOverCell(null);
    }

    return (
        <>
            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <section className="mb-5 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="font-semibold text-neutral-100">
                                员工拖拽栏
                            </h2>
                            <p className="mt-1 text-xs text-neutral-500">
                                可拖员工到岗位，也可以拖动排班格里的员工移动或交换。点击星期标题可高亮当天还未安排的员工。
                            </p>
                        </div>

                        <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400">
                            {employees.length} 人
                        </span>
                    </div>

                    {employees.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-neutral-700 p-5 text-center text-sm text-neutral-500">
                            还没有员工。请先在员工池中添加员工，或生成测试数据。
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {employees.map((employee) => {
                                const isUnassignedOnHighlightedDay =
                                    highlightedDay
                                        ? !isEmployeeAssignedOnDay(
                                              cells,
                                              employee.id,
                                              highlightedDay,
                                          )
                                        : false;

                                return (
                                    <DraggableEmployeeChip
                                        key={employee.id}
                                        employee={employee}
                                        highlightedDay={highlightedDay}
                                        isUnassignedOnHighlightedDay={
                                            isUnassignedOnHighlightedDay
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="grid gap-4 lg:grid-cols-7">
                    {weekDates.map((day) => (
                        <div
                            key={day.key}
                            className={
                                draggingFromEmployeeBar &&
                                draggedEmployeeAssignedDays.has(day.key)
                                    ? "rounded-2xl border border-neutral-200 bg-neutral-100 p-4 opacity-45 shadow-xl shadow-black/20 transition"
                                    : highlightedDay === day.key
                                      ? "rounded-2xl border border-emerald-400 bg-emerald-50 p-4 shadow-xl shadow-black/20 transition"
                                      : "rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 shadow-xl shadow-black/20 transition"
                            }
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setHighlightedDay((current) =>
                                        current === day.key ? null : day.key,
                                    )
                                }
                                className={
                                    highlightedDay === day.key
                                        ? "mb-4 flex w-full items-center justify-between rounded-xl bg-emerald-100 px-3 py-2 text-left text-lg font-semibold text-emerald-800"
                                        : "mb-4 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-lg font-semibold text-amber-700 hover:bg-amber-50"
                                }
                            >
                                <span>
                                    {day.label}
                                    <span className="ml-2 text-sm font-normal text-neutral-500">
                                        {day.dateLabel}
                                    </span>
                                </span>
                                <span className="text-xs font-normal text-neutral-500">
                                    {highlightedDay === day.key
                                        ? "取消高亮"
                                        : "查看未安排"}
                                </span>
                            </button>

                            <div className="space-y-4">
                                {roleGroups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="rounded-2xl border border-neutral-200 bg-white p-3"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-neutral-700">
                                                {group.name}
                                            </h3>
                                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
                                                {group.roles.length} 岗
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {group.roles.map((role) => {
                                                const cell = getCell(
                                                    day.key,
                                                    role,
                                                );
                                                const employeeId =
                                                    cell?.employeeId ?? null;
                                                const employeeName =
                                                    getEmployeeName(employeeId);
                                                const isEmpty = !employeeId;
                                                const locked =
                                                    cell?.locked ?? false;

                                                const isDragOver =
                                                    dragOverCell?.day ===
                                                        day.key &&
                                                    dragOverCell.role === role;
                                                const dragged = getEmployee(
                                                    draggedEmployee?.employeeId ??
                                                        null,
                                                );
                                                const dragValidation =
                                                    isDragOver && dragged
                                                        ? getDragValidation(
                                                              dragged,
                                                              day.key,
                                                              role,
                                                          )
                                                        : null;

                                                return (
                                                    <DroppableScheduleCell
                                                        key={`${day.key}-${role}`}
                                                        day={day.key}
                                                        role={role}
                                                        employeeId={employeeId}
                                                        employeeName={
                                                            employeeName
                                                        }
                                                        isEmpty={isEmpty}
                                                        locked={locked}
                                                        isDragOver={isDragOver}
                                                        dragValidation={
                                                            dragValidation
                                                        }
                                                        onClick={() =>
                                                            setSelectedCell({
                                                                day: day.key,
                                                                role,
                                                            })
                                                        }
                                                        onToggleLock={() =>
                                                            onToggleCellLock(
                                                                day.key,
                                                                role,
                                                            )
                                                        }
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            </DndContext>

            {selectedCell ? (
                <div
                    onClick={() => setSelectedCell(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
                    >
                        {" "}
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm text-amber-400">
                                    手动调整
                                </p>
                                <h3 className="mt-1 text-xl font-bold text-neutral-100">
                                    {selectedDay?.label} / {selectedCell.role}
                                </h3>
                                <p className="mt-1 text-sm text-neutral-500">
                                    绿色表示符合约束，红色表示不符合约束但仍可强制安排。
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedCell(null)}
                                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-900"
                            >
                                关闭
                            </button>
                        </div>
                        <div className="mb-4 max-h-96 space-y-2 overflow-y-auto pr-1">
                            {employees.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-neutral-700 p-6 text-center text-sm text-neutral-500">
                                    还没有员工，请先在下方员工管理里添加员工。
                                </div>
                            ) : (
                                employees.map((employee) => {
                                    const canWork = canEmployeeWorkOnDay(
                                        employee,
                                        selectedCell.day,
                                    );
                                    const canDoRole = canEmployeeDoRole(
                                        employee,
                                        selectedCell.role,
                                    );
                                    const valid = canWork && canDoRole;

                                    return (
                                        <button
                                            key={employee.id}
                                            onClick={() =>
                                                handleAssign(employee.id)
                                            }
                                            className={
                                                valid
                                                    ? "w-full rounded-xl border border-emerald-900/70 bg-emerald-950/20 p-3 text-left hover:bg-emerald-950/40"
                                                    : "w-full rounded-xl border border-red-900/70 bg-red-950/10 p-3 text-left hover:bg-red-950/30"
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="font-medium text-neutral-100">
                                                        {employee.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-neutral-500">
                                                        {employee.availabilityMode ===
                                                        "specific-days"
                                                            ? `指定星期：${employee.availableDays.length} 天可上班`
                                                            : `每周目标：${employee.targetWorkDays} 天`}
                                                        ，可做{" "}
                                                        {
                                                            employee
                                                                .capableRoles
                                                                .length
                                                        }{" "}
                                                        个岗位
                                                    </p>
                                                </div>

                                                <span
                                                    className={
                                                        valid
                                                            ? "rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-neutral-950"
                                                            : "rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-neutral-950"
                                                    }
                                                >
                                                    {valid ? "符合" : "不符合"}
                                                </span>
                                            </div>

                                            {!valid ? (
                                                <div className="mt-2 space-y-1 text-xs text-red-300">
                                                    {!canWork ? (
                                                        <p>不可在当天上班</p>
                                                    ) : null}
                                                    {!canDoRole ? (
                                                        <p>不会该岗位</p>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        <div className="flex justify-between gap-3 border-t border-neutral-800 pt-4">
                            <button
                                onClick={() => handleAssign(null)}
                                className="rounded-xl border border-red-900/70 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40"
                            >
                                清空该岗位
                            </button>

                            <button
                                onClick={() => setSelectedCell(null)}
                                className="rounded-xl border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-900"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
