import { WEEKDAYS, type WeekdayKey } from "./scheduler-config";
import type { Employee, ScheduleCell, StaffPairRule } from "./types";

export type ScheduleIssueSeverity = "error" | "warning";

export type ScheduleIssue = {
  id: string;
  severity: ScheduleIssueSeverity;
  message: string;
  day?: WeekdayKey;
  role?: string;
  employeeId?: string;
};

type ValidateScheduleParams = {
  roles: string[];
  employees: Employee[];
  cells: ScheduleCell[];
  rules?: StaffPairRule[];
};

function getEmployee(employees: Employee[], employeeId: string | null) {
  if (!employeeId) return null;

  return employees.find((employee) => employee.id === employeeId) ?? null;
}

function getCell(cells: ScheduleCell[], day: WeekdayKey, role: string) {
  return cells.find((cell) => cell.day === day && cell.role === role);
}

function getDayLabel(dayKey: WeekdayKey) {
  return WEEKDAYS.find((day) => day.key === dayKey)?.label ?? dayKey;
}

export function validateSchedule({
  roles,
  employees,
  cells,
  rules = [],
}: ValidateScheduleParams) {
  const issues: ScheduleIssue[] = [];
  const assignedDaysByEmployee = new Map<string, Set<WeekdayKey>>();
  const assignedRolesByEmployeeDay = new Map<string, string[]>();

  for (const day of WEEKDAYS) {
    for (const role of roles) {
      const cell = getCell(cells, day.key, role);
      const employee = getEmployee(employees, cell?.employeeId ?? null);

      if (!cell?.employeeId) {
        issues.push({
          id: `empty:${day.key}:${role}`,
          severity: "warning",
          day: day.key,
          role,
          message: `${day.label}「${role}」未安排员工`,
        });

        continue;
      }

      if (!employee) {
        issues.push({
          id: `unknown:${day.key}:${role}:${cell.employeeId}`,
          severity: "error",
          day: day.key,
          role,
          employeeId: cell.employeeId,
          message: `${day.label}「${role}」安排了不存在的员工`,
        });

        continue;
      }

      if (!employee.capableRoles.includes(role)) {
        issues.push({
          id: `role:${day.key}:${role}:${employee.id}`,
          severity: "error",
          day: day.key,
          role,
          employeeId: employee.id,
          message: `${day.label}「${role}」安排了 ${employee.name}，但该员工不会这个岗位`,
        });
      }

      if (
        employee.availabilityMode === "specific-days" &&
        !employee.availableDays.includes(day.key)
      ) {
        issues.push({
          id: `day:${day.key}:${role}:${employee.id}`,
          severity: "error",
          day: day.key,
          role,
          employeeId: employee.id,
          message: `${day.label}「${role}」安排了 ${employee.name}，但该员工当天不可上班`,
        });
      }

      if (!assignedDaysByEmployee.has(employee.id)) {
        assignedDaysByEmployee.set(employee.id, new Set());
      }

      assignedDaysByEmployee.get(employee.id)?.add(day.key);

      const employeeDayKey = `${employee.id}:${day.key}`;
      const existingRoles =
        assignedRolesByEmployeeDay.get(employeeDayKey) ?? [];

      assignedRolesByEmployeeDay.set(employeeDayKey, [...existingRoles, role]);
    }
  }

  for (const [
    employeeDayKey,
    assignedRoles,
  ] of assignedRolesByEmployeeDay.entries()) {
    if (assignedRoles.length <= 1) continue;

    const [employeeId, dayKey] = employeeDayKey.split(":") as [
      string,
      WeekdayKey,
    ];
    const employee = employees.find((item) => item.id === employeeId);

    if (!employee) continue;

    issues.push({
      id: `duplicate-day:${employeeId}:${dayKey}`,
      severity: "warning",
      day: dayKey,
      employeeId,
      message: `${getDayLabel(dayKey)} ${employee.name} 被安排了 ${assignedRoles.length} 个岗位：${assignedRoles.join("、")}`,
    });
  }

  for (const employee of employees) {
    if (employee.availabilityMode !== "days-per-week") continue;

    const assignedDays = assignedDaysByEmployee.get(employee.id)?.size ?? 0;

    if (assignedDays > employee.targetWorkDays) {
      issues.push({
        id: `target-days:${employee.id}`,
        severity: "error",
        employeeId: employee.id,
        message: `${employee.name} 目标每周 ${employee.targetWorkDays} 天，但当前已安排 ${assignedDays} 天`,
      });
    }
  }

  for (const rule of rules) {
    const employeeA = employees.find(
      (employee) => employee.id === rule.employeeAId,
    );
    const employeeB = employees.find(
      (employee) => employee.id === rule.employeeBId,
    );

    if (!employeeA || !employeeB) continue;

    for (const day of WEEKDAYS) {
      const aWorks = cells.some(
        (cell) => cell.day === day.key && cell.employeeId === employeeA.id,
      );
      const bWorks = cells.some(
        (cell) => cell.day === day.key && cell.employeeId === employeeB.id,
      );

      if (rule.type === "avoid-same-day" && aWorks && bWorks) {
        issues.push({
          id: `rule-avoid:${rule.id}:${day.key}`,
          severity: "warning",
          day: day.key,
          message: `${day.label} ${employeeA.name} 和 ${employeeB.name} 被安排在同一天，但规则是尽量不要同一天`,
        });
      }

      if (rule.type === "prefer-same-day" && aWorks !== bWorks) {
        issues.push({
          id: `rule-prefer:${rule.id}:${day.key}`,
          severity: "warning",
          day: day.key,
          message: `${day.label} ${employeeA.name} 和 ${employeeB.name} 没有一起上班，但规则是最好同一天`,
        });
      }
    }
  }

  return issues;
}
