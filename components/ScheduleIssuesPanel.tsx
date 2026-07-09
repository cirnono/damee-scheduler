"use client";

import { useState } from "react";
import type { ScheduleIssue } from "@/lib/schedule-validation";
import type { Employee } from "@/lib/types";
import type { WeekdayKey } from "@/lib/scheduler-config";

type ScheduleIssuesPanelProps = {
  issues: ScheduleIssue[];
  employees: Employee[];
  onAssignEmployee: (
    day: WeekdayKey,
    role: string,
    employeeId: string | null,
  ) => void;
  issues: ScheduleIssue[];
  employees: Employee[];
  onAssignEmployee: (
    day: WeekdayKey,
    role: string,
    employeeId: string | null,
  ) => void;
};

function canEmployeeWorkOnDay(employee: Employee, day: WeekdayKey) {
  if (employee.availabilityMode === "specific-days") {
    return employee.availableDays.includes(day);
  }
  if (employee.availabilityMode === "specific-days") {
    return employee.availableDays.includes(day);
  }

  return true;
  return true;
}

function canEmployeeDoRole(employee: Employee, role: string) {
  return employee.capableRoles.includes(role);
  return employee.capableRoles.includes(role);
}

function getSuitableEmployees(
  employees: Employee[],
  day: WeekdayKey,
  role: string,
  employees: Employee[],
  day: WeekdayKey,
  role: string,
) {
  return employees
    .filter(
      (employee) =>
        canEmployeeWorkOnDay(employee, day) &&
        canEmployeeDoRole(employee, role),
    )
    .sort((a, b) => {
      const aPreferred = a.preferredRoles?.includes(role) ? 1 : 0;
      const bPreferred = b.preferredRoles?.includes(role) ? 1 : 0;
      return employees
        .filter(
          (employee) =>
            canEmployeeWorkOnDay(employee, day) &&
            canEmployeeDoRole(employee, role),
        )
        .sort((a, b) => {
          const aPreferred = a.preferredRoles?.includes(role) ? 1 : 0;
          const bPreferred = b.preferredRoles?.includes(role) ? 1 : 0;

          if (aPreferred !== bPreferred) return bPreferred - aPreferred;
          if (aPreferred !== bPreferred) return bPreferred - aPreferred;

          const aAvoid = a.avoidRoles?.includes(role) ? 1 : 0;
          const bAvoid = b.avoidRoles?.includes(role) ? 1 : 0;
          const aAvoid = a.avoidRoles?.includes(role) ? 1 : 0;
          const bAvoid = b.avoidRoles?.includes(role) ? 1 : 0;

          if (aAvoid !== bAvoid) return aAvoid - bAvoid;
          if (aAvoid !== bAvoid) return aAvoid - bAvoid;

          return a.name.localeCompare(b.name, "zh-Hans-CN");
        });
      return a.name.localeCompare(b.name, "zh-Hans-CN");
    });
}

export function ScheduleIssuesPanel({
  issues,
  employees,
  onAssignEmployee,
  issues,
  employees,
  onAssignEmployee,
}: ScheduleIssuesPanelProps) {
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  const errorCount = issues.filter(
    (issue) => issue.severity === "error",
  ).length;
  const warningCount = issues.filter(
    (issue) => issue.severity === "warning",
  ).length;
  const errorCount = issues.filter(
    (issue) => issue.severity === "error",
  ).length;
  const warningCount = issues.filter(
    (issue) => issue.severity === "warning",
  ).length;

  return (
    <section className="mb-5 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
      <button
        type="button"
        onClick={() => setPanelCollapsed((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-neutral-100">排班检查</h2>
          <span className="rounded-full border border-red-900/70 px-3 py-1 text-xs text-red-300">
            错误 {errorCount}
          </span>
          <span className="rounded-full border border-amber-900/70 px-3 py-1 text-xs text-amber-300">
            提醒 {warningCount}
          </span>
        </div>
        <span
          className={`text-neutral-400 text-lg transition-transform duration-200 ${panelCollapsed ? "" : "rotate-90"
            }`}
        >
          ▶
        </span>
      </button>

      {!panelCollapsed && (
        <>
          <p className="mt-3 mb-3 text-xs text-neutral-500">
            自动检查空缺、岗位能力、上班日期和重复安排。点击可处理的提醒可以直接安排员工。
          </p>

          {issues.length === 0 ? (
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">
              当前排班没有发现明显问题。
            </div>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {issues.map((issue) => {
                const canQuickAssign = Boolean(
                  issue.day && issue.role && issue.message.includes("未安排员工"),
                );
                const isExpanded = expandedIssueId === issue.id;
                const suitableEmployees =
                  issue.day && issue.role
                    ? getSuitableEmployees(employees, issue.day, issue.role)
                    : [];
                {
                  issues.length === 0 ? (
                    <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">
                      当前排班没有发现明显问题。
                    </div>
                  ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {issues.map((issue) => {
                      const canQuickAssign = Boolean(
                        issue.day && issue.role && issue.message.includes("未安排员工"),
                      );
                      const isExpanded = expandedIssueId === issue.id;
                      const suitableEmployees =
                        issue.day && issue.role
                          ? getSuitableEmployees(employees, issue.day, issue.role)
                          : [];

                      return (
                        <div
                          key={issue.id}
                          className={
                            issue.severity === "error"
                              ? "rounded-xl border border-red-900/70 bg-red-950/20 px-4 py-3 text-sm text-red-200"
                              : "rounded-xl border border-amber-900/70 bg-amber-950/20 px-4 py-3 text-sm text-amber-200"
                          }
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (!canQuickAssign) return;
                              return (
                                <div
                                  key={issue.id}
                                  className={
                                    issue.severity === "error"
                                      ? "rounded-xl border border-red-900/70 bg-red-950/20 px-4 py-3 text-sm text-red-200"
                                      : "rounded-xl border border-amber-900/70 bg-amber-950/20 px-4 py-3 text-sm text-amber-200"
                                  }
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!canQuickAssign) return;

                                      setExpandedIssueId((current) =>
                                        current === issue.id ? null : issue.id,
                                      );
                                    }}
                                    className={
                                      canQuickAssign
                                        ? "flex w-full items-start gap-3 text-left"
                                        : "flex w-full cursor-default items-start gap-3 text-left"
                                    }
                                  >
                                    <span
                                      className={
                                        issue.severity === "error"
                                          ? "mt-0.5 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-neutral-950"
                                          : "mt-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-neutral-950"
                                      }
                                    >
                                      {issue.severity === "error" ? "错误" : "提醒"}
                                    </span>
                    setExpandedIssueId((current) =>
                                    current === issue.id ? null : issue.id,
                                    );
                  }}
                                    className={
                                      canQuickAssign
                                        ? "flex w-full items-start gap-3 text-left"
                                        : "flex w-full cursor-default items-start gap-3 text-left"
                                    }
                >
                                    <span
                                      className={
                                        issue.severity === "error"
                                          ? "mt-0.5 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-neutral-950"
                                          : "mt-0.5 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-neutral-950"
                                      }
                                    >
                                      {issue.severity === "error" ? "错误" : "提醒"}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                      <p>{issue.message}</p>
                                      <div className="min-w-0 flex-1">
                                        <p>{issue.message}</p>

                                        {canQuickAssign ? (
                                          <p className="mt-1 text-xs opacity-70">
                                            {isExpanded
                                              ? "点击收起员工列表"
                                              : "点击查看符合要求的员工"}
                                          </p>
                                        ) : null}
                                      </div>
                                  </button>
                                  {canQuickAssign ? (
                                    <p className="mt-1 text-xs opacity-70">
                                      {isExpanded
                                        ? "点击收起员工列表"
                                        : "点击查看符合要求的员工"}
                                    </p>
                                  ) : null}
                                </div>
                </button>

                {
                        isExpanded && issue.day && issue.role ? (
                          <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3">
                            {suitableEmployees.length === 0 ? (
                              <p className="text-sm text-neutral-500">
                                当前门店员工里没有符合「当天可上班 + 会该岗位」的员工。
                              </p>
                            ) : (
                              <>
                                <p className="mb-2 text-xs text-neutral-500">
                                  符合要求的员工，点击即可安排到「
                                  {issue.role}」：
                                </p>
                                {isExpanded && issue.day && issue.role ? (
                                  <div className="mt-3 rounded-xl border border-neutral-200 bg-white p-3">
                                    {suitableEmployees.length === 0 ? (
                                      <p className="text-sm text-neutral-500">
                                        当前门店员工里没有符合「当天可上班 + 会该岗位」的员工。
                                      </p>
                                    ) : (
                                      <>
                                        <p className="mb-2 text-xs text-neutral-500">
                                          符合要求的员工，点击即可安排到「
                                          {issue.role}」：
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                          {suitableEmployees.map((employee) => {
                                            const isPreferred =
                                              employee.preferredRoles?.includes(
                                                issue.role ?? "",
                                              );
                                            const isAvoid = employee.avoidRoles?.includes(
                                              issue.role ?? "",
                                            );
                                            <div className="flex flex-wrap gap-2">
                                              {suitableEmployees.map((employee) => {
                                                const isPreferred =
                                                  employee.preferredRoles?.includes(
                                                    issue.role ?? "",
                                                  );
                                                const isAvoid = employee.avoidRoles?.includes(
                                                  issue.role ?? "",
                                                );

                                                return (
                                                  <button
                                                    key={employee.id}
                                                    type="button"
                                                    onClick={() => {
                                                      onAssignEmployee(
                                                        issue.day!,
                                                        issue.role!,
                                                        employee.id,
                                                      );
                                                      setExpandedIssueId(null);
                                                    }}
                                                    className={
                                                      isPreferred
                                                        ? "rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                                                        : isAvoid
                                                          ? "rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                                                          : "rounded-full border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                                                    }
                                                    title={
                                                      isPreferred
                                                        ? "偏好岗位"
                                                        : isAvoid
                                                          ? "可做但尽量避免"
                                                          : "符合要求"
                                                    }
                                                  >
                                                    {employee.name}
                                                    {isPreferred ? " · 偏好" : null}
                                                    {isAvoid ? " · 避免" : null}
                                                  </button>
                                                );
                                              })}
                                            </div>
                      </>
                    )}
                                      </div>
                ) : null}
                                  </div>
                                );
          })}
                              </div>
      )}
                          </>
                        )}
    </section>
                );
                }
