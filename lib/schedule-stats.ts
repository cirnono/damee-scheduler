import { WEEKDAYS, type WeekdayKey } from "./scheduler-config";
import type { Employee, ScheduleCell } from "./types";

export type EmployeeScheduleStat = {
    employeeId: string;
    employeeName: string;
    availabilityMode: Employee["availabilityMode"];
    targetWorkDays: number;
    hourlyRate?: number;

    assignedDaysCount: number;
    assignedShiftsCount: number;
    assignedHours: number;
    estimatedPay: number | null;

    dayRoles: {
        day: WeekdayKey;
        dayLabel: string;
        roles: string[];
        hours: number;
    }[];
};

export function buildEmployeeScheduleStats(
    employees: Employee[],
    cells: ScheduleCell[],
    roleHours: Record<string, number>,
): EmployeeScheduleStat[] {
    return employees.map((employee) => {
        const assignedCells = cells.filter(
            (cell) => cell.employeeId === employee.id,
        );

        const dayRoles = WEEKDAYS.map((day) => {
            const roles = assignedCells
                .filter((cell) => cell.day === day.key)
                .map((cell) => cell.role);

            const hours = roles.reduce((sum, role) => {
                return sum + (roleHours[role] ?? 0);
            }, 0);

            return {
                day: day.key,
                dayLabel: day.shortLabel,
                roles,
                hours,
            };
        });

        const assignedDaysCount = dayRoles.filter(
            (item) => item.roles.length > 0,
        ).length;
        const assignedShiftsCount = assignedCells.length;
        const assignedHours = dayRoles.reduce(
            (sum, item) => sum + item.hours,
            0,
        );
        const estimatedPay =
            typeof employee.hourlyRate === "number"
                ? assignedHours * employee.hourlyRate
                : null;

        return {
            employeeId: employee.id,
            employeeName: employee.name,
            availabilityMode: employee.availabilityMode,
            targetWorkDays: employee.targetWorkDays,
            hourlyRate: employee.hourlyRate,
            assignedDaysCount,
            assignedShiftsCount,
            assignedHours,
            estimatedPay,
            dayRoles,
        };
    });
}
