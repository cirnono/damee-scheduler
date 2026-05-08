import { WEEKDAYS, type WeekdayKey } from "./scheduler-config";

export type WeekDateInfo = {
    key: WeekdayKey;
    label: string;
    shortLabel: string;
    date: string;
    dateLabel: string;
    fullLabel: string;
};

export function toDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function fromDateInputValue(value: string) {
    const [year, month, day] = value.split("-").map(Number);

    return new Date(year, month - 1, day);
}

export function getTodayDateInputValue() {
    return toDateInputValue(new Date());
}

export function getNextMondayDateInputValue(today = new Date()) {
    const date = new Date(today);
    const day = date.getDay();

    /**
     * JS: Sunday = 0, Monday = 1
     * 下一周周一：
     * 周一当天也跳到 7 天后，不使用今天。
     */
    const daysUntilNextMonday = day === 0 ? 1 : 8 - day;

    date.setDate(date.getDate() + daysUntilNextMonday);

    return toDateInputValue(date);
}

export function buildWeekDates(weekStartDateValue: string): WeekDateInfo[] {
    const startDate = fromDateInputValue(weekStartDateValue);

    return WEEKDAYS.map((weekday, index) => {
        const date = new Date(startDate);

        date.setDate(startDate.getDate() + index);

        const dateValue = toDateInputValue(date);
        const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;

        return {
            key: weekday.key,
            label: weekday.label,
            shortLabel: weekday.shortLabel,
            date: dateValue,
            dateLabel,
            fullLabel: `${weekday.label} ${dateLabel}`,
        };
    });
}

export function getDateDiffInDays(dateAValue: string, dateBValue: string) {
    const dateA = fromDateInputValue(dateAValue);
    const dateB = fromDateInputValue(dateBValue);

    const diffMs = dateA.getTime() - dateB.getTime();

    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function normalizeToMondayDateInputValue(dateValue: string) {
    const date = fromDateInputValue(dateValue);
    const day = date.getDay();

    /**
     * JS: Sunday = 0, Monday = 1
     * 如果选了周中日期，自动归到该周周一。
     */
    const diffToMonday = day === 0 ? -6 : 1 - day;

    date.setDate(date.getDate() + diffToMonday);

    return toDateInputValue(date);
}
