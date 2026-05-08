import type { WeekdayKey } from "./scheduler-config";

export type AvailabilityMode = "specific-days" | "days-per-week";

export type Employee = {
    id: string;
    name: string;
    avatar?: string;

    availabilityMode: AvailabilityMode;
    availableDays: WeekdayKey[];
    targetWorkDays: number;

    capableRoles: string[];

    preferredRoles: string[];
    avoidRoles: string[];

    hourlyRate?: number;
};

export type ScheduleCell = {
    day: WeekdayKey;
    role: string;
    employeeId: string | null;
    locked?: boolean;
};

export type SchedulePlan = {
    id: string;
    name: string;
    storeId: string;
    cells: ScheduleCell[];
};

export type SchedulePlanMap = Record<string, SchedulePlan>;

export type SchedulePlansByWeek = Record<string, SchedulePlanMap>;

export type StoreEmployeeMap = Record<string, string[]>;

export type SchedulerBackup = {
    version: 1;
    exportedAt: string;
    employeePool: Employee[];
    storeEmployeeIds: StoreEmployeeMap;
    storeRules: StoreRuleMap;
    schedulePlansByWeek: SchedulePlansByWeek;
    activeStoreId: string;
    activePlanId: string;
};

export type StaffPairRuleType = "avoid-same-day" | "prefer-same-day";

export type StaffPairRule = {
    id: string;
    type: StaffPairRuleType;
    employeeAId: string;
    employeeBId: string;
    note?: string;
};

export type StoreRuleMap = Record<string, StaffPairRule[]>;
