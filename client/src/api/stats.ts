// src/api/stats.ts
export interface Stats {
  cpu: number;
  ram: { used: number; total: number; percent: number };
  timeStamp: string;
}

export async function fetchStats(baseUrl: string): Promise<Stats> {
  const res = await fetch(`${baseUrl}/stats`);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data: Stats = await res.json();
  return data;
}