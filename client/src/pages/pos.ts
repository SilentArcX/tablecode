// src/pages/pos.ts
import '../styles/pos.css';

// --- [Interfaces] 데이터 타입 정의 ---

interface Order {
    id: number;
    order_number: string;
    total_price: number;
    created_at: string;
    payment_status: string;
    current_status?: 'ACCEPTED' | 'READY' | 'COMPLETED' | 'CANCELLED';
}

interface OrderDetail {
    orderId: number;
    orderNumber: string;
    totalPrice: number;
    paymentMethod: string;
    paymentStatus: string;
    orderedAt: string;
    items: {
        productName: string;
        quantity: number;
        itemPrice: number;
        options: { optionName: string; optionPrice: number }[];
    }[];
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// --- [Main Function] POS 메인 화면 렌더링 ---
export async function renderPos(root: HTMLElement) {
    document.title = "TableCode - POS (주문 관리)";

    // 1. HTML 구조 설정 (버튼 제거)
    root.innerHTML = `
        <div class="pos-container">
            <header class="pos-header">
                <div class="header-title">
                    <h2>📑 POS 주문 관리</h2>
                    <span id="current-time"></span>
                </div>
            </header>
            
            <div id="order-list-container" class="order-list-container">
                <p class="loading">데이터를 불러오는 중...</p>
            </div>
        </div>

        <div id="detail-modal" class="modal-overlay">
            <div class="modal-window">
                <div class="modal-header">
                    <h3>🧾 주문 상세</h3>
                    <button id="modal-close" class="close-btn">&times;</button>
                </div>
                <div id="modal-content"></div>
            </div>
        </div>
    `;

    // 2. 주문 목록 로드 함수
    const loadOrders = async () => {
        const listContainer = document.getElementById('order-list-container');
        if (!listContainer) return;

        try {
            const response = await fetch(`${API_BASE}/order`);
            if (!response.ok) throw new Error('조회 실패');
            
            const orders: Order[] = await response.json();
            
            if (orders.length === 0) {
                listContainer.innerHTML = '<p class="empty-msg">대기 중인 주문이 없습니다.</p>';
                return;
            }

            listContainer.innerHTML = orders.map(order => {
                const date = new Date(order.created_at).toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', minute:'2-digit' 
                });

                const status = order.current_status || 'ACCEPTED';
                const isPaid = order.payment_status === 'PAID';

                let actionButtonHtml = '';

                if (!isPaid) {
                    actionButtonHtml = `<button class="btn-status-change disabled" disabled>결제 대기</button>`;
                } else {
                    switch (status) {
                        case 'ACCEPTED':
                            actionButtonHtml = `<button class="btn-status-change accept" data-id="${order.id}" data-next="READY">조리 완료</button>`;
                            break;
                        case 'READY':
                            actionButtonHtml = `<button class="btn-status-change complete" data-id="${order.id}" data-next="COMPLETED">픽업 완료</button>`;
                            break;
                        case 'COMPLETED':
                            actionButtonHtml = `<button class="btn-status-change disabled" disabled>처리 완료</button>`;
                            break;
                        case 'CANCELLED':
                            actionButtonHtml = `<button class="btn-status-change disabled" disabled>취소됨</button>`;
                            break;
                    }
                }

                return `
                    <div class="order-card">
                        <div class="order-header">
                            <span class="order-time">${date}</span>
                            <span class="order-id">#${order.id}</span>
                        </div>
                        <div class="order-body">
                            <h3 class="order-number">${order.order_number.split('-')[1] || order.order_number}</h3>
                            <p class="order-price">${order.total_price.toLocaleString()}원</p>
                            <div class="badges">
                                <span class="payment-badge ${order.payment_status.toLowerCase()}">${order.payment_status}</span>
                                <span class="status-badge ${status.toLowerCase()}">${status}</span>
                            </div>
                        </div>
                        <div class="order-actions">
                            ${actionButtonHtml}
                            <button class="btn-detail" data-id="${order.id}">상세</button>
                        </div>
                    </div>
                `;
            }).join('');

            // (1) 상태 변경 버튼
            document.querySelectorAll('.btn-status-change').forEach(btn => {
                if ((btn as HTMLButtonElement).disabled) return;
                
                btn.addEventListener('click', (e) => {
                    const target = e.target as HTMLButtonElement;
                    const orderId = target.dataset.id;
                    const nextStatus = target.dataset.next;
                    if (orderId && nextStatus) handleStatusChange(orderId, nextStatus);
                });
            });

            // (2) 상세 버튼
            document.querySelectorAll('.btn-detail').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = (e.target as HTMLElement).dataset.id;
                    if (id) openOrderDetail(id);
                });
            });

        } catch (error) {
            console.error(error);
            listContainer.innerHTML = '<p class="error-msg">로드 실패</p>';
        }
    };

    // 3. 모달 닫기 이벤트
    const modal = document.getElementById('detail-modal');
    document.getElementById('modal-close')?.addEventListener('click', () => modal?.classList.remove('open'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

    // 4. 초기 실행 + 자동 새로고침
    loadOrders();
    setInterval(loadOrders, 3000);
}

// --- [Status Change Handler] 상태 변경 요청 ---
async function handleStatusChange(orderId: string, nextStatus: string) {
    let confirmMsg = '';
    if (nextStatus === 'READY') confirmMsg = '주문을 수락하고 조리를 시작하시겠습니까?';
    else if (nextStatus === 'COMPLETED') confirmMsg = '픽업이 완료되었습니까?';
    else return;

    if (!confirm(confirmMsg)) return;

    try {
        const res = await fetch(`${API_BASE}/order/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
        });

        if (!res.ok) throw new Error('상태 변경 실패');
        
        // 목록 갱신은 setInterval이 자동처리
    } catch (error) {
        alert('오류가 발생했습니다.');
        console.error(error);
    }
}

// --- [Detail Modal Handler] 상세 보기 ---
async function openOrderDetail(orderId: string) {
    const modal = document.getElementById('detail-modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;

    modal.classList.add('open');
    content.innerHTML = '<p>로딩중...</p>';

    try {
        const res = await fetch(`${API_BASE}/order/${orderId}`);
        const data: OrderDetail = await res.json();

        content.innerHTML = `
            <div class="receipt-meta">
                <p>주문번호: ${data.orderNumber}</p>
                <p>시간: ${new Date(data.orderedAt).toLocaleString()}</p>
            </div>
            <div class="receipt-list">
                ${data.items.map(item => `
                    <div class="receipt-item">
                        <div class="item-row">
                            <span>${item.productName} x${item.quantity}</span>
                            <span>${(item.itemPrice * item.quantity).toLocaleString()}</span>
                        </div>
                        ${item.options.map(opt => `
                            <div class="option-row">└ ${opt.optionName} (+${opt.optionPrice})</div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
            <div class="receipt-total">
                <span>합계</span>
                <span>${data.totalPrice.toLocaleString()}원</span>
            </div>
        `;
    } catch (e) {
        content.innerHTML = '<p>정보 로드 실패</p>';
    }
}
