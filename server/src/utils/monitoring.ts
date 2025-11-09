// utils/monitoring.ts
import { exec } from 'child_process';
import os from 'os';

// 리소스 사용량 인터페이스
export interface ResourceUsage {
    used: number;
    total: number;
    percent: number;
}

// 시스템 사용량 인터페이스
export interface SystemUsage {
    cpu: number;
    ram: ResourceUsage;
}

let cachedUsage: SystemUsage | null = null;
let cacheTime = 0;
const CACHE_DURATION_MS = 60 * 1000;

// RAM
function getRamUsage(): ResourceUsage {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const percent = Math.round((used / total) * 100);
    return { used, total, percent };
}

// CPU
function getCpuUsagePercent(): Promise<number> {
    return new Promise((resolve) => {
        const start = os.cpus();
        setTimeout(() => {
            const end = os.cpus();
            let idle = 0, total = 0;
            for (let i = 0; i < start.length; i++) {
                const s = start[i].times, e = end[i].times;
                idle += e.idle - s.idle;
                total += (e.user - s.user) + (e.nice - s.nice) + (e.sys - s.sys) + (e.irq - s.irq) + (e.idle - s.idle);
            }
            resolve(100 - Math.round((idle / total) * 100));
        }, 500);
    });
}

// 시스템 사용량 가져오기
export async function getSystemUsage(): Promise<SystemUsage> {
    const now = Date.now();
    if (cachedUsage && now - cacheTime < CACHE_DURATION_MS) return cachedUsage;

    const cpu = await getCpuUsagePercent();
    const ram = getRamUsage();

    // Cache
    cachedUsage = { cpu, ram };
    cacheTime = now;
    return cachedUsage;
}