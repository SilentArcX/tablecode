// client/src/modules/systemMonitor.ts
import { API_BASE, STATS_REFRESH_INTERVAL } from '../config';

const timeElem = document.querySelector('.time-display') as HTMLDivElement;
const cpuElem = document.getElementById('cpu') as HTMLSpanElement;
const ramElem = document.getElementById('ram') as HTMLSpanElement;
const cpuBar = document.getElementById('cpu-bar') as HTMLDivElement;
const ramBar = document.getElementById('ram-bar') as HTMLDivElement;

let currentTime: Date | null = null;

interface StatsData {
    cpu: number;
    ram: { used: number; total: number; percent: number; };
    timeStamp: string;
}

function formatTime(date: Date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function updateClockDisplay() {
    if (!timeElem) return;
    timeElem.textContent = currentTime ? formatTime(currentTime) : '--:--:--';
}

// 서버에서 현재 정보 가져오기
async function fetchStats(): Promise<StatsData> {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
}

export function startStatsUpdater() {
    async function updateStats() {
        try {
            const data = await fetchStats();

            // stats 값 UI 업데이트
            if (cpuElem) cpuElem.textContent = `${Math.min(Math.max(data.cpu, 0), 100)}%`;
            if (ramElem) ramElem.textContent = `${Math.min(Math.max(data.ram.percent, 0), 100)}%`;
            if (cpuBar) cpuBar.style.width = `${Math.min(Math.max(data.cpu, 0), 100)}%`;
            if (ramBar) ramBar.style.width = `${Math.min(Math.max(data.ram.percent, 0), 100)}%`;

            // 시계가 아직 시작되지 않았으면 초기화
            if (currentTime === null) {
                currentTime = new Date(data.timeStamp);
            }

        } catch (error) {
            console.error('Error fetching stats:', error);
            if (cpuElem) cpuElem.textContent = 'N/A';
            if (ramElem) ramElem.textContent = 'N/A';
            if (cpuBar) cpuBar.style.width = `0%`;
            if (ramBar) ramBar.style.width = `0%`;

            currentTime = null; // 실패 시 시계 정지
        }

        updateClockDisplay();
    }

    // 초기 실행 및 주기적 갱신
    updateStats();
    setInterval(updateStats, STATS_REFRESH_INTERVAL);

    // 1초마다 시계 증가
    setInterval(() => {
        if (currentTime) {
            currentTime.setSeconds(currentTime.getSeconds() + 1);
            updateClockDisplay();
        }
    }, 1000);
}