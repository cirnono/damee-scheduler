"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type {
    Employee,
    StaffPairRule,
    StaffPairRuleType,
    StoreRuleMap,
} from "@/lib/types";

type StoreRulesPanelProps = {
    activeStoreId: string;
    activeStoreName: string;
    employees: Employee[];
    rules: StaffPairRule[];
    setStoreRules: Dispatch<SetStateAction<StoreRuleMap>>;
};

const ruleTypeLabels: Record<StaffPairRuleType, string> = {
    "avoid-same-day": "尽量不要同一天",
    "prefer-same-day": "最好同一天",
};

export function StoreRulesPanel({
    activeStoreId,
    activeStoreName,
    employees,
    rules,
    setStoreRules,
}: StoreRulesPanelProps) {
    const [type, setType] = useState<StaffPairRuleType>("avoid-same-day");
    const [employeeAId, setEmployeeAId] = useState("");
    const [employeeBId, setEmployeeBId] = useState("");
    const [note, setNote] = useState("");

    function addRule() {
        if (!employeeAId || !employeeBId) return;
        if (employeeAId === employeeBId) return;

        const rule: StaffPairRule = {
            id: crypto.randomUUID(),
            type,
            employeeAId,
            employeeBId,
            note: note.trim(),
        };

        setStoreRules((current) => ({
            ...current,
            [activeStoreId]: [...(current[activeStoreId] ?? []), rule],
        }));

        setEmployeeAId("");
        setEmployeeBId("");
        setNote("");
    }

    function deleteRule(ruleId: string) {
        setStoreRules((current) => ({
            ...current,
            [activeStoreId]: (current[activeStoreId] ?? []).filter(
                (rule) => rule.id !== ruleId,
            ),
        }));
    }

    function getEmployeeName(employeeId: string) {
        return (
            employees.find((employee) => employee.id === employeeId)?.name ??
            "未知员工"
        );
    }

    return (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="mb-5">
                <h2 className="text-xl font-bold text-neutral-900">
                    门店排班规则
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                    当前门店：{activeStoreName}。这些规则只影响当前门店。
                </p>
            </div>

            <div className="mb-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <h3 className="mb-3 font-semibold text-neutral-800">
                    添加同班规则
                </h3>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <select
                        value={type}
                        onChange={(event) =>
                            setType(event.target.value as StaffPairRuleType)
                        }
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 outline-none focus:border-amber-500"
                    >
                        <option value="avoid-same-day">尽量不要同一天</option>
                        <option value="prefer-same-day">最好同一天</option>
                    </select>

                    <select
                        value={employeeAId}
                        onChange={(event) => setEmployeeAId(event.target.value)}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 outline-none focus:border-amber-500"
                    >
                        <option value="">选择员工 A</option>
                        {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                                {employee.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={employeeBId}
                        onChange={(event) => setEmployeeBId(event.target.value)}
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 outline-none focus:border-amber-500"
                    >
                        <option value="">选择员工 B</option>
                        {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                                {employee.name}
                            </option>
                        ))}
                    </select>

                    <input
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="备注，可选"
                        className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-amber-500"
                    />

                    <button
                        onClick={addRule}
                        className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
                    >
                        添加规则
                    </button>
                </div>

                {employeeAId && employeeBId && employeeAId === employeeBId ? (
                    <p className="mt-2 text-sm text-red-600">
                        员工 A 和员工 B 不能是同一个人。
                    </p>
                ) : null}
            </div>

            {rules.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                    当前门店暂无同班规则
                </div>
            ) : (
                <div className="space-y-3">
                    {rules.map((rule) => (
                        <article
                            key={rule.id}
                            className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:flex-row md:items-center md:justify-between"
                        >
                            <div>
                                <p className="font-semibold text-neutral-900">
                                    {getEmployeeName(rule.employeeAId)} /{" "}
                                    {getEmployeeName(rule.employeeBId)}
                                </p>
                                <p className="mt-1 text-sm text-neutral-500">
                                    {ruleTypeLabels[rule.type]}
                                </p>
                                {rule.note ? (
                                    <p className="mt-1 text-xs text-neutral-400">
                                        {rule.note}
                                    </p>
                                ) : null}
                            </div>

                            <button
                                onClick={() => deleteRule(rule.id)}
                                className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                删除
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
