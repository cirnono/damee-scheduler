export function loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;

    try {
        const rawValue = window.localStorage.getItem(key);

        if (!rawValue) return fallback;

        return JSON.parse(rawValue) as T;
    } catch {
        return fallback;
    }
}

export function saveToStorage<T>(key: string, value: T) {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeFromStorage(key: string) {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem(key);
}
