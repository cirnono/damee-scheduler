import { WEEKDAYS, type WeekdayKey } from "./scheduler-config";
import type { Employee, ScheduleCell } from "./types";
import type { WeekDateInfo } from "./date-utils";

export type ScheduleTextFormat = "wechat-compact" | "by-date" | "by-employee";

type BuildScheduleTextParams = {
    storeName: string;
    planName: string;
    roles: string[];
    employees: Employee[];
    cells: ScheduleCell[];
    weekDates?: WeekDateInfo[];
    format?: ScheduleTextFormat;
};

function getEmployeeName(employees: Employee[], employeeId: string | null) {
    if (!employeeId) return "未安排";

    return (
        employees.find((employee) => employee.id === employeeId)?.name ??
        "未知员工"
    );
}

function getCell(cells: ScheduleCell[], day: WeekdayKey, role: string) {
    return cells.find((cell) => cell.day === day && cell.role === role);
}

function getExportWeekDates(weekDates?: WeekDateInfo[]) {
    return (
        weekDates ??
        WEEKDAYS.map((day) => ({
            ...day,
            date: "",
            dateLabel: "",
            fullLabel: day.label,
        }))
    );
}

function getEmployeeAssignedCells(employeeId: string, cells: ScheduleCell[]) {
    return cells.filter((cell) => cell.employeeId === employeeId);
}

function buildWechatCompactText({
    storeName,
    planName,
    roles,
    employees,
    cells,
    weekDates,
}: Required<BuildScheduleTextParams>) {
    const lines: string[] = [];

    const firstDate = weekDates[0]?.dateLabel;
    const lastDate = weekDates[6]?.dateLabel;

    lines.push(
        `${storeName} ${planName} 排班${firstDate && lastDate ? `（${firstDate}-${lastDate}）` : ""}`,
    );
    lines.push("");

    for (const day of getExportWeekDates(weekDates)) {
        const assignedTexts = roles.map((role) => {
            const cell = getCell(cells, day.key, role);
            const employeeName = getEmployeeName(
                employees,
                cell?.employeeId ?? null,
            );

            return `${role}：${employeeName}`;
        });

        lines.push(`${day.fullLabel}`);
        lines.push(assignedTexts.join("，"));
        lines.push("");
    }

    return lines.join("\n").trim();
}

function buildByDateText({
    storeName,
    planName,
    roles,
    employees,
    cells,
    weekDates,
}: Required<BuildScheduleTextParams>) {
    const lines: string[] = [];

    const firstDate = weekDates[0]?.dateLabel;
    const lastDate = weekDates[6]?.dateLabel;

    lines.push(
        `${planName} - ${storeName} 排班表${firstDate && lastDate ? `（${firstDate}-${lastDate}）` : ""}`,
    );
    lines.push("");

    for (const day of getExportWeekDates(weekDates)) {
        lines.push(`【${day.fullLabel}】`);

        for (const role of roles) {
            const cell = getCell(cells, day.key, role);
            const employeeName = getEmployeeName(
                employees,
                cell?.employeeId ?? null,
            );
            const lockedText = cell?.locked ? " 🔒" : "";

            lines.push(`${role}：${employeeName}${lockedText}`);
        }

        lines.push("");
    }

    return lines.join("\n").trim();
}

function buildByEmployeeText({
    storeName,
    planName,
    employees,
    cells,
    weekDates,
}: Required<BuildScheduleTextParams>) {
    const lines: string[] = [];

    const firstDate = weekDates[0]?.dateLabel;
    const lastDate = weekDates[6]?.dateLabel;

    lines.push(
        `${planName} - ${storeName} 员工排班${firstDate && lastDate ? `（${firstDate}-${lastDate}）` : ""}`,
    );
    lines.push("");

    for (const employee of employees) {
        const assignedCells = getEmployeeAssignedCells(employee.id, cells);

        if (assignedCells.length === 0) {
            lines.push(`${employee.name}：未安排`);
            continue;
        }

        const dayTexts = weekDates
            .map((day) => {
                const roles = assignedCells
                    .filter((cell) => cell.day === day.key)
                    .map((cell) => cell.role);

                if (roles.length === 0) return null;

                return `${day.shortLabel}${day.dateLabel ? ` ${day.dateLabel}` : ""} ${roles.join("、")}`;
            })
            .filter(Boolean);

        lines.push(`${employee.name}：${dayTexts.join("；")}`);
    }

    return lines.join("\n").trim();
}

export function buildScheduleText(params: BuildScheduleTextParams) {
    const fullParams: Required<BuildScheduleTextParams> = {
        ...params,
        weekDates: params.weekDates ?? getExportWeekDates(),
        format: params.format ?? "wechat-compact",
    };

    if (fullParams.format === "by-date") {
        return buildByDateText(fullParams);
    }

    if (fullParams.format === "by-employee") {
        return buildByEmployeeText(fullParams);
    }

    return buildWechatCompactText(fullParams);
}

export function downloadJsonFile(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}
