export type WeekdayKey =
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";

export type RoleGroupConfig = {
    id: string;
    name: string;
    roles: string[];
};

export type RoleHoursConfig = Record<string, number>;

export type StoreConfig = {
    id: string;
    name: string;
    roleGroups: RoleGroupConfig[];
    roleHours: RoleHoursConfig;
};

export const WEEKDAYS: {
    key: WeekdayKey;
    label: string;
    shortLabel: string;
}[] = [
    {
        key: "monday",
        label: "星期一",
        shortLabel: "周一",
    },
    {
        key: "tuesday",
        label: "星期二",
        shortLabel: "周二",
    },
    {
        key: "wednesday",
        label: "星期三",
        shortLabel: "周三",
    },
    {
        key: "thursday",
        label: "星期四",
        shortLabel: "周四",
    },
    {
        key: "friday",
        label: "星期五",
        shortLabel: "周五",
    },
    {
        key: "saturday",
        label: "星期六",
        shortLabel: "周六",
    },
    {
        key: "sunday",
        label: "星期日",
        shortLabel: "周日",
    },
];

export const STORE_CONFIGS: StoreConfig[] = [
    {
        id: "eastwood",
        name: "Eastwood",
        roleGroups: [
            {
                id: "front",
                name: "前厅",
                roles: ["卤切", "卤收银", "豆", "送货"],
            },
            {
                id: "kitchen",
                name: "后厨",
                roles: ["厨房", "帮厨", "炸", "豆腐"],
            },
        ],
        roleHours: {
            卤切: 8,
            卤收银: 8,
            豆: 8,
            送货: 8,
            厨房: 8,
            帮厨: 8,
            炸: 8,
            豆腐: 8,
        },
    },
    {
        id: "campsie",
        name: "Campsie",
        roleGroups: [
            {
                id: "front",
                name: "前厅",
                roles: ["卤切", "卤收银", "豆", "肠粉"],
            },
            {
                id: "kitchen",
                name: "后厨",
                roles: ["后厨豆", "后厨切", "后厨炸", "后厨卤"],
            },
        ],
        roleHours: {
            卤切: 8,
            卤收银: 8,
            豆: 8,
            肠粉: 8,
            后厨豆: 8,
            后厨切: 8,
            后厨炸: 8,
            后厨卤: 8,
        },
    },
    {
        id: "hurstville",
        name: "Hurstville",
        roleGroups: [
            {
                id: "front",
                name: "前厅",
                roles: ["卤切", "卤收银", "豆", "肠粉"],
            },
            {
                id: "kitchen",
                name: "后厨",
                roles: ["后厨豆", "后厨切", "后厨炸", "后厨卤"],
            },
            {
                id: "prep",
                name: "备货",
                roles: ["备货"],
            },
        ],
        roleHours: {
            卤切: 8,
            卤收银: 8,
            豆: 8,
            肠粉: 8,
            后厨豆: 8,
            后厨切: 8,
            后厨炸: 8,
            后厨卤: 8,
            备货: 6,
        },
    },
];

export function getStoreRoles(store: StoreConfig) {
    return store.roleGroups.flatMap((group) => group.roles);
}

export const DEFAULT_STORE_ID = "campsie";

export const PLAN_OPTIONS = [
    {
        id: "plan-a",
        name: "方案 A",
    },
    {
        id: "plan-b",
        name: "方案 B",
    },
    {
        id: "plan-c",
        name: "方案 C",
    },
];

export const DEFAULT_PLAN_ID = "plan-a";

export const STORAGE_KEYS = {
    employeePool: "damee-scheduler-employee-pool",
    storeEmployeeIds: "damee-scheduler-store-employee-ids",
    storeRules: "damee-scheduler-store-rules",

    employees: "damee-scheduler-employees",

    activeStoreId: "damee-scheduler-active-store-id",
    activePlanId: "damee-scheduler-active-plan-id",
    currentSchedule: "damee-scheduler-current-schedule",
    schedulePlans: "damee-scheduler-schedule-plans",
    schedulePlansByWeek: "damee-scheduler-schedule-plans-by-week",
};

function assertUniqueIds(items: { id: string }[], label: string) {
    const seen = new Set<string>();

    for (const item of items) {
        if (seen.has(item.id)) {
            console.warn(
                `[scheduler-config] duplicate ${label} id: ${item.id}`,
            );
        }

        seen.add(item.id);
    }
}

assertUniqueIds(STORE_CONFIGS, "store");

for (const store of STORE_CONFIGS) {
    assertUniqueIds(store.roleGroups, `${store.id} roleGroup`);
}
