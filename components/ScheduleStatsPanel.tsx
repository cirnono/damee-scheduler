import type { EmployeeScheduleStat } from "@/lib/schedule-stats";

type ScheduleStatsPanelProps = {
    stats: EmployeeScheduleStat[];
};

export function ScheduleStatsPanel({ stats }: ScheduleStatsPanelProps) {
    const sortedStats = [...stats].sort((a, b) => {
        if (a.assignedDaysCount !== b.assignedDaysCount) {
            return b.assignedDaysCount - a.assignedDaysCount;
        }

        return b.assignedShiftsCount - a.assignedShiftsCount;
    });

    return (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="font-semibold text-neutral-100">
                        员工排班统计
                    </h2>
                    <p className="mt-1 text-xs text-neutral-500">
                        查看每个员工本周被安排的天数、岗位数和具体岗位。
                    </p>
                </div>

                <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400">
                    {stats.length} 人
                </span>
            </div>

            {sortedStats.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-700 p-5 text-center text-sm text-neutral-500">
                    暂无员工统计。请先添加员工并生成排班。
                </div>
            ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {sortedStats.map((stat) => {
                        const isTargetMode =
                            stat.availabilityMode === "days-per-week";
                        const isUnderTarget =
                            isTargetMode &&
                            stat.assignedDaysCount < stat.targetWorkDays;
                        const isOverTarget =
                            isTargetMode &&
                            stat.assignedDaysCount > stat.targetWorkDays;
                        const isOnTarget =
                            isTargetMode &&
                            stat.assignedDaysCount === stat.targetWorkDays;

                        return (
                            <article
                                key={stat.employeeId}
                                className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4"
                            >
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-semibold text-neutral-100">
                                            {stat.employeeName}
                                        </h3>
                                        <p className="mt-1 text-xs text-neutral-500">
                                            {stat.assignedDaysCount} 天 /{" "}
                                            {stat.assignedShiftsCount} 个岗位 /{" "}
                                            {stat.assignedHours} 小时
                                        </p>

                                        <p className="mt-1 text-xs text-neutral-500">
                                            {stat.estimatedPay === null
                                                ? "未设置时薪"
                                                : `预估工资 $${stat.estimatedPay.toFixed(2)}`}
                                        </p>
                                    </div>

                                    {isTargetMode ? (
                                        <span
                                            className={
                                                isOnTarget
                                                    ? "rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-neutral-950"
                                                    : isOverTarget
                                                      ? "rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-neutral-950"
                                                      : "rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-neutral-950"
                                            }
                                        >
                                            目标 {stat.targetWorkDays} 天
                                        </span>
                                    ) : (
                                        <span className="rounded-full border border-neutral-700 px-2.5 py-1 text-xs text-neutral-400">
                                            指定星期
                                        </span>
                                    )}
                                </div>

                                {isUnderTarget ? (
                                    <p className="mb-3 rounded-lg border border-amber-900/70 bg-amber-950/20 px-3 py-2 text-xs text-amber-300">
                                        未达到目标，还差{" "}
                                        {stat.targetWorkDays -
                                            stat.assignedDaysCount}{" "}
                                        天。
                                    </p>
                                ) : null}

                                {isOverTarget ? (
                                    <p className="mb-3 rounded-lg border border-red-900/70 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                                        超过目标，多了{" "}
                                        {stat.assignedDaysCount -
                                            stat.targetWorkDays}{" "}
                                        天。
                                    </p>
                                ) : null}

                                <div className="space-y-2">
                                    {stat.dayRoles.map((item) => (
                                        <div
                                            key={item.day}
                                            className={
                                                item.roles.length > 0
                                                    ? "rounded-lg border border-neutral-800 bg-neutral-900/70 px-3 py-2"
                                                    : "rounded-lg border border-neutral-900 bg-neutral-950/40 px-3 py-2"
                                            }
                                        >
                                            <p className="text-xs text-neutral-500">
                                                {item.dayLabel}
                                            </p>
                                            <p
                                                className={
                                                    item.roles.length > 0
                                                        ? "mt-1 text-xs text-neutral-200"
                                                        : "mt-1 text-xs text-neutral-700"
                                                }
                                            >
                                                {item.roles.length > 0
                                                    ? `${item.roles.join("、")}（${item.hours}h）`
                                                    : "未安排"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
