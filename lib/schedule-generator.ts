import { WEEKDAYS, type WeekdayKey } from "./scheduler-config";
import type { Employee, ScheduleCell, StaffPairRule } from "./types";

type EmployeeStats = {
  totalShifts: number;
  assignedDays: Set<WeekdayKey>;
};

type GenerateScheduleOptions = {
  existingCells?: ScheduleCell[];
  rules?: StaffPairRule[];
};

function createInitialStats(
  employees: Employee[],
  existingCells: ScheduleCell[],
) {
  const statsByEmployeeId = new Map<string, EmployeeStats>();

  for (const employee of employees) {
    statsByEmployeeId.set(employee.id, {
      totalShifts: 0,
      assignedDays: new Set(),
    });
  }

  for (const cell of existingCells) {
    if (!cell.employeeId) continue;

    const stats = statsByEmployeeId.get(cell.employeeId);

    if (!stats) continue;

    stats.totalShifts += 1;
    stats.assignedDays.add(cell.day);
  }

  return statsByEmployeeId;
}

function getStats(
  statsByEmployeeId: Map<string, EmployeeStats>,
  employeeId: string,
) {
  return (
    statsByEmployeeId.get(employeeId) ?? {
      totalShifts: 0,
      assignedDays: new Set<WeekdayKey>(),
    }
  );
}

function canEmployeeWorkOnDay(
  employee: Employee,
  day: WeekdayKey,
  stats: EmployeeStats,
) {
  if (employee.availabilityMode === "specific-days") {
    return employee.availableDays.includes(day);
  }

  return (
    stats.assignedDays.has(day) ||
    stats.assignedDays.size < employee.targetWorkDays
  );
}

function canEmployeeDoRole(employee: Employee, role: string) {
  return employee.capableRoles.includes(role);
}

function getRoleDifficulty(employees: Employee[], role: string) {
  return employees.filter((employee) => employee.capableRoles.includes(role))
    .length;
}

function getEmployeePairRuleScore(
  employee: Employee,
  day: WeekdayKey,
  assignedToday: Set<string>,
  rules: StaffPairRule[],
) {
  let score = 0;

  for (const rule of rules) {
    const isEmployeeA = rule.employeeAId === employee.id;
    const isEmployeeB = rule.employeeBId === employee.id;

    if (!isEmployeeA && !isEmployeeB) continue;

    const pairEmployeeId = isEmployeeA ? rule.employeeBId : rule.employeeAId;
    const pairAlreadyAssignedToday = assignedToday.has(pairEmployeeId);

    if (rule.type === "avoid-same-day" && pairAlreadyAssignedToday) {
      score += 200;
    }

    if (rule.type === "prefer-same-day") {
      if (pairAlreadyAssignedToday) {
        score -= 60;
      } else {
        /**
         * 小惩罚：如果另一人还没安排，不是完全禁止。
         * 因为可能后续岗位还能把另一人排进来。
         */
        score += 10;
      }
    }
  }

  return score;
}

function getEmployeeScore(
  employee: Employee,
  role: string,
  day: WeekdayKey,
  stats: EmployeeStats,
  assignedToday: Set<string>,
  rules: StaffPairRule[],
) {
  let score = 0;

  /**
   * 分数越低越优先。
   */

  if (assignedToday.has(employee.id)) {
    score += 1000;
  }

  if (employee.preferredRoles?.includes(role)) {
    score -= 40;
  }

  if (employee.avoidRoles?.includes(role)) {
    score += 80;
  }

  score += getEmployeePairRuleScore(employee, day, assignedToday, rules);

  if (employee.availabilityMode === "days-per-week") {
    const alreadyAssignedThisDay = stats.assignedDays.has(day);
    const remainingTargetDays = Math.max(
      0,
      employee.targetWorkDays - stats.assignedDays.size,
    );

    if (!alreadyAssignedThisDay && remainingTargetDays > 0) {
      score -= 20;
    }

    if (
      stats.assignedDays.size >= employee.targetWorkDays &&
      !alreadyAssignedThisDay
    ) {
      score += 500;
    }
  }

  score += stats.totalShifts * 10;
  score += stats.assignedDays.size * 5;

  return score;
}

function sortRolesByDifficulty(employees: Employee[], roles: string[]) {
  return [...roles].sort((a, b) => {
    const aDifficulty = getRoleDifficulty(employees, a);
    const bDifficulty = getRoleDifficulty(employees, b);

    return aDifficulty - bDifficulty;
  });
}

function getLockedCell(
  existingCells: ScheduleCell[],
  day: WeekdayKey,
  role: string,
) {
  return existingCells.find(
    (cell) => cell.day === day && cell.role === role && cell.locked,
  );
}

function getExistingCell(
  existingCells: ScheduleCell[],
  day: WeekdayKey,
  role: string,
) {
  return existingCells.find((cell) => cell.day === day && cell.role === role);
}

export function generateSchedule(
  employees: Employee[],
  roles: string[],
  options: GenerateScheduleOptions = {},
): ScheduleCell[] {
  const existingCells = options.existingCells ?? [];
  const rules = options.rules ?? [];
  const lockedCells = existingCells.filter((cell) => cell.locked);
  const statsByEmployeeId = createInitialStats(employees, lockedCells);
  const result: ScheduleCell[] = [];

  const sortedRoles = sortRolesByDifficulty(employees, roles);

  for (const day of WEEKDAYS) {
    const assignedToday = new Set<string>();

    for (const lockedCell of lockedCells.filter(
      (cell) => cell.day === day.key,
    )) {
      if (lockedCell.employeeId) {
        assignedToday.add(lockedCell.employeeId);
      }
    }

    const dayCells: ScheduleCell[] = [];

    for (const role of sortedRoles) {
      const lockedCell = getLockedCell(existingCells, day.key, role);

      if (lockedCell) {
        dayCells.push(lockedCell);
        continue;
      }

      const candidates = employees
        .filter((employee) => {
          const stats = getStats(statsByEmployeeId, employee.id);

          if (!canEmployeeDoRole(employee, role)) return false;
          if (!canEmployeeWorkOnDay(employee, day.key, stats)) return false;

          /**
           * 自动生成阶段强制避免同一天重复。
           * 手动调整可以允许重复，由检查面板提醒。
           */
          if (assignedToday.has(employee.id)) return false;

          return true;
        })
        .sort((a, b) => {
          const aStats = getStats(statsByEmployeeId, a.id);
          const bStats = getStats(statsByEmployeeId, b.id);

          const aScore = getEmployeeScore(
            a,
            role,
            day.key,
            aStats,
            assignedToday,
            rules,
          );
          const bScore = getEmployeeScore(
            b,
            role,
            day.key,
            bStats,
            assignedToday,
            rules,
          );

          if (aScore !== bScore) return aScore - bScore;

          return a.name.localeCompare(b.name, "zh-Hans-CN");
        });

      const selected = candidates[0] ?? null;

      if (selected) {
        const stats = getStats(statsByEmployeeId, selected.id);

        assignedToday.add(selected.id);
        stats.totalShifts += 1;
        stats.assignedDays.add(day.key);

        statsByEmployeeId.set(selected.id, stats);
      }

      const oldCell = getExistingCell(existingCells, day.key, role);

      dayCells.push({
        day: day.key,
        role,
        employeeId: selected?.id ?? null,
        locked: oldCell?.locked ?? false,
      });
    }

    /**
     * 生成时内部按稀缺岗位优先排。
     * 输出时恢复门店配置里的岗位顺序。
     */
    for (const role of roles) {
      const cell = dayCells.find((item) => item.role === role);

      result.push(
        cell ?? {
          day: day.key,
          role,
          employeeId: null,
          locked: false,
        },
      );
    }
  }

  return result;
}
