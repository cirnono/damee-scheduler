const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1/scheduler";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.code ?? `HTTP ${res.status}`);
  }
  return body.data as T;
}

// ─── Employee Types ────────────────────────────────────

export type WeekdayKey =
  | "monday" | "tuesday" | "wednesday" | "thursday"
  | "friday" | "saturday" | "sunday";

export type AvailabilityMode = "specific-days" | "days-per-week";

export interface ApiEmployee {
  id: string;
  name: string;
  avatar: string | null;
  availabilityMode: AvailabilityMode;
  availableDays: WeekdayKey[];
  targetWorkDays: number;
  capableRoles: string[];
  preferredRoles: string[];
  avoidRoles: string[];
  hourlyRate: number | null;
  isArchived: boolean;
  storeIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── API Calls ─────────────────────────────────────────

export async function listEmployees(storeId?: string): Promise<ApiEmployee[]> {
  const params = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
  return fetchJson<ApiEmployee[]>(`${API_BASE}/employees${params}`);
}

export async function createEmployee(
  data: Partial<ApiEmployee>,
): Promise<ApiEmployee> {
  return fetchJson<ApiEmployee>(`${API_BASE}/employees`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEmployee(
  id: string,
  data: Partial<ApiEmployee>,
): Promise<ApiEmployee> {
  return fetchJson<ApiEmployee>(`${API_BASE}/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteEmployee(id: string): Promise<void> {
  await fetchJson<void>(`${API_BASE}/employees/${id}`, { method: "DELETE" });
}

export async function updateEmployeeStores(
  id: string,
  storeIds: string[],
): Promise<{ storeIds: string[] }> {
  return fetchJson<{ storeIds: string[] }>(
    `${API_BASE}/employees/${id}/stores`,
    { method: "PUT", body: JSON.stringify({ storeIds }) },
  );
}
