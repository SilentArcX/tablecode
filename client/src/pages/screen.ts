// src/pages/screen.ts
import '../styles/screen.css';

interface Order {
    id: number;
    current_status?: 'ACCEPTED' | 'READY' | 'COMPLETED' | 'CANCELLED';
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export function renderScreen(root: HTMLElement) {
    document.title = "TableCode - 주문 현황판";

    // 1. 레이아웃 (좌: 조리중 / 우: 준비완료)
    root.innerHTML = `
        <div class="monitor-container">
            <div class="panel preparing">
                <h2>👨‍🍳 조리 중 (Preparing)</h2>
                <div id="list-preparing" class="number-grid">
                    </div>
            </div>

            <div class="panel ready">
                <h2>🔔 준비 완료 (Pickup)</h2>
                <div id="list-ready" class="number-grid">
                    </div>
            </div>
        </div>
    `;

    // 2. 데이터 가져오기 및 렌더링 함수
    const updateScreen = async () => {
        try {
            const response = await fetch(`${API_BASE}/order`);
            if (!response.ok) return;

            const orders: Order[] = await response.json();

            // 필터링: 조리중(ACCEPTED) vs 준비완료(READY)
            // COMPLETED나 CANCELLED는 화면에서 제거됨
            const preparingList = orders.filter(o => o.current_status === 'ACCEPTED' || !o.current_status);
            const readyList = orders.filter(o => o.current_status === 'READY');

            renderList('list-preparing', preparingList);
            renderList('list-ready', readyList);

        } catch (error) {
            console.error("화면 갱신 실패:", error);
        }
    };

    // 3. 리스트 HTML 생성 도우미 함수
    const renderList = (elementId: string, list: Order[]) => {
        const container = document.getElementById(elementId);
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = `<div class="empty-msg">-</div>`;
            return;
        }

        // 주문 ID만 큼직하게 표시
        container.innerHTML = list.map(order => `
            <div class="order-num">
                ${order.id}
            </div>
        `).join('');
    };

    // 4. 초기 실행 및 주기적 갱신 (3초마다)
    updateScreen();
    setInterval(updateScreen, 3000); 
}