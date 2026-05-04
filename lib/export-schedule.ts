import { WEEKDAYS, type WeekdayKey } from "./scheduler-config";
import type { Employee, ScheduleCell } from "./types";

export type ScheduleTextFormat = "wechat-compact" | "by-date" | "by-employee";

type BuildScheduleTextParams = {
    storeName: string;
    planName: string;
    roles: string[];
    employees: Employee[];
    cells: ScheduleCell[];
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

function getEmployeeAssignedCells(employeeId: string, cells: ScheduleCell[]) {
    return cells.filter((cell) => cell.employeeId === employeeId);
}

function buildWechatCompactText({
    storeName,
    planName,
    roles,
    employees,
    cells,
}: Required<BuildScheduleTextParams>) {
    const lines: string[] = [];

    lines.push(`${storeName} ${planName} 排班`);
    lines.push("");

    for (const day of WEEKDAYS) {
        const assignedTexts = roles.map((role) => {
            const cell = getCell(cells, day.key, role);
            const employeeName = getEmployeeName(
                employees,
                cell?.employeeId ?? null,
            );

            return `${role}：${employeeName}`;
        });

        lines.push(`${day.label}`);
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
}: Required<BuildScheduleTextParams>) {
    const lines: string[] = [];

    lines.push(`${planName} - ${storeName} 排班表`);
    lines.push("");

    for (const day of WEEKDAYS) {
        lines.push(`【${day.label}】`);

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
}: Required<BuildScheduleTextParams>) {
    const lines: string[] = [];

    lines.push(`${planName} - ${storeName} 员工排班`);
    lines.push("");

    for (const employee of employees) {
        const assignedCells = getEmployeeAssignedCells(employee.id, cells);

        if (assignedCells.length === 0) {
            lines.push(`${employee.name}：未安排`);
            continue;
        }

        const dayTexts = WEEKDAYS.map((day) => {
            const roles = assignedCells
                .filter((cell) => cell.day === day.key)
                .map((cell) => cell.role);

            if (roles.length === 0) return null;

            return `${day.shortLabel} ${roles.join("、")}`;
        }).filter(Boolean);

        lines.push(`${employee.name}：${dayTexts.join("；")}`);
    }

    return lines.join("\n").trim();
}

export function buildScheduleText(params: BuildScheduleTextParams) {
    const fullParams: Required<BuildScheduleTextParams> = {
        ...params,
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
