import { describe, expect, it } from "vitest";
import { WEEKDAYS, STORE_CONFIGS, getStoreRoles } from "./scheduler-config";

describe("scheduler-config", () => {
    it("has 7 weekdays", () => {
        expect(WEEKDAYS).toHaveLength(7);
    });

    it("weekdays start with monday", () => {
        expect(WEEKDAYS[0].key).toBe("monday");
    });

    it("has at least one store config", () => {
        expect(STORE_CONFIGS.length).toBeGreaterThan(0);
    });

    it("each store has unique id", () => {
        const ids = STORE_CONFIGS.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("getStoreRoles returns flat role list", () => {
        const store = STORE_CONFIGS[0];
        const roles = getStoreRoles(store);
        const totalFromGroups = store.roleGroups.reduce(
            (sum, g) => sum + g.roles.length,
            0,
        );
        expect(roles).toHaveLength(totalFromGroups);
    });
});

describe("types", () => {
    it("has correct weekday key type shape", () => {
        const day = WEEKDAYS[0];
        expect(day).toHaveProperty("key");
        expect(day).toHaveProperty("label");
        expect(day).toHaveProperty("shortLabel");
    });
});
