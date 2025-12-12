// src/pages/kiosk2.ts
import '../styles/kiosk.css';

// --- [Interfaces] 데이터 타입 정의 ---

interface Category {
    categoryId: number;
    categoryName: string;
    products: Product[];
}

interface Product {
    id: number;
    category_id: number;
    name: string;
    price: number;
    status: string;
}

// 주문 요청을 위한 DTO (Data Transfer Object)
interface OrderItemOptionRequest {
    option_id: number;
    price: number;
}

interface OrderItemRequest {
    product_id: number;
    quantity: number;
    price: number;
    options: OrderItemOptionRequest[];
}

interface CreateOrderRequest {
    kiosk_id: number;
    total_price: number;
    payment_method: string;
    items: OrderItemRequest[];
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// --- [Main Function] 키오스크 메인 화면 렌더링 ---
export async function renderKiosk2(root: HTMLElement) {
    document.title = "TableCode - Kiosk 2";
    
    // 1. 초기 로딩 상태 표시
    root.innerHTML = `
        <div class="kiosk-container">
            <h1 class="kiosk-title">메뉴판</h1>
            <p class="loading">메뉴를 불러오는 중...</p>
        </div>
    `;

    try {
        // 2. 메뉴 API 호출
        const response = await fetch(`${API_BASE}/menu`);
        if (!response.ok) throw new Error('메뉴를 불러올 수 없습니다.');
        
        const menuData: Category[] = await response.json();

        // 3. 메뉴판 HTML 렌더링
        root.innerHTML = `
            <div class="kiosk-container">
                <h1 class="kiosk-title">🍔 메뉴판</h1>
                <div class="categories">
                    ${menuData.map(category => `
                        <div class="category-section">
                            <h2 class="category-name">${category.categoryName}</h2>
                            <div class="products-grid">
                                ${category.products.length > 0 
                                    ? category.products.map(product => `
                                        <div class="product-card" data-product-id="${product.id}">
                                            <div class="product-name">${product.name}</div>
                                            <div class="product-price">${product.price.toLocaleString()}원</div>
                                        </div>
                                    `).join('')
                                    : '<p class="empty-category">준비중인 메뉴입니다</p>'
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // 4. 상품 클릭 이벤트 연결
        const productCards = root.querySelectorAll('.product-card');
        productCards.forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.getAttribute('data-product-id');
                if (productId) {
                    showProductDetail(root, productId);
                }
            });
        });

    } catch (error) {
        console.error('Menu fetch error:', error);
        root.innerHTML = `
            <div class="kiosk-container">
                <h1 class="kiosk-title">메뉴판</h1>
                <p class="error">메뉴를 불러오는데 실패했습니다.</p>
                <button onclick="location.reload()">다시 시도</button>
            </div>
        `;
    }
}

// --- [Detail Function] 상품 상세 및 주문 로직 ---
async function showProductDetail(root: HTMLElement, productId: string) {
    // 1. 상세 화면 로딩
    root.innerHTML = `
        <div class="kiosk-container">
            <h1 class="kiosk-title">상품 상세</h1>
            <p class="loading">상품 정보를 불러오는 중...</p>
        </div>
    `;

    try {
        // 2. 상품 상세 API 호출
        const response = await fetch(`${API_BASE}/menu/${productId}`);
        if (!response.ok) throw new Error('상품 정보를 불러올 수 없습니다.');
        
        const data = await response.json();
        const { product, optionGroups } = data; // optionGroups는 백엔드 응답 구조

        // 3. 상세 화면 HTML 렌더링
        // data-required, data-group-id 등을 추가하여 유효성 검사에 사용합니다.
        root.innerHTML = `
            <div class="kiosk-container">
                <button class="back-button" onclick="location.reload()">← 뒤로가기</button>
                <h1 class="kiosk-title">${product.name}</h1>
                <div class="product-detail">
                    <div class="product-info">
                        <p class="product-price-large">${product.price.toLocaleString()}원</p>
                    </div>
                    
                    ${optionGroups.length > 0 ? `
                        <div class="options-section">
                            <h3>옵션 선택</h3>
                            ${optionGroups.map((group: any) => `
                                <div class="option-group" 
                                     data-group-id="${group.optionGroupId}" 
                                     data-required="${group.isRequired}" 
                                     data-name="${group.optionGroupName}">
                                    
                                    <h4 class="option-group-name">
                                        ${group.optionGroupName}
                                        ${group.isRequired ? '<span class="required">필수</span>' : '<span class="optional">선택</span>'}
                                    </h4>
                                    
                                    <div class="options-list">
                                        ${group.options.map((option: any) => `
                                            <label class="option-item">
                                                <input 
                                                    type="${group.isMultiSelect ? 'checkbox' : 'radio'}" 
                                                    name="option-group-${group.optionGroupId}"
                                                    value="${option.optionId}"
                                                    data-price="${option.optionPrice}"
                                                >
                                                <span class="option-name">${option.optionName}</span>
                                                <span class="option-price">
                                                    ${option.optionPrice > 0 ? `+${option.optionPrice.toLocaleString()}원` : ''}
                                                </span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="total-section">
                        <div class="total-price">
                            <span>총 금액:</span>
                            <span id="total-price">${product.price.toLocaleString()}원</span>
                        </div>
                        <button class="order-button">주문하기</button>
                    </div>
                </div>
            </div>
        `;

        // 4. 가격 실시간 계산 로직
        const basePrice = product.price;
        const inputs = root.querySelectorAll<HTMLInputElement>('input[type="radio"], input[type="checkbox"]');
        const totalPriceEl = root.querySelector('#total-price');
        const orderButton = root.querySelector('.order-button');

        const calculateTotal = () => {
            let total = basePrice;
            inputs.forEach(input => {
                if (input.checked) {
                    const price = parseInt(input.dataset.price || '0');
                    total += price;
                }
            });
            return total;
        };

        const updateTotalPriceUI = () => {
            const total = calculateTotal();
            if (totalPriceEl) {
                totalPriceEl.textContent = `${total.toLocaleString()}원`;
            }
        };

        // 옵션 변경 시 가격 업데이트
        inputs.forEach(input => {
            input.addEventListener('change', updateTotalPriceUI);
        });

        // 5. 주문하기 버튼 클릭 핸들러
        if (orderButton) {
            orderButton.addEventListener('click', async () => {
                // (1) 필수 옵션 검증
                const optionGroupDivs = root.querySelectorAll('.option-group');
                for (const groupDiv of optionGroupDivs) {
                    const isRequired = groupDiv.getAttribute('data-required') === 'true'; // 문자열 "true" 체크
                    const groupName = groupDiv.getAttribute('data-name');
                    const groupId = groupDiv.getAttribute('data-group-id');
                    
                    if (isRequired) {
                        // 해당 그룹 내에 체크된 input이 있는지 확인
                        const checked = groupDiv.querySelector(`input[name="option-group-${groupId}"]:checked`);
                        if (!checked) {
                            alert(`'${groupName}' 옵션을 선택해주세요.`);
                            return; // 검증 실패 시 함수 종료
                        }
                    }
                }

                // (2) 선택된 옵션 데이터 수집
                const selectedOptions: OrderItemOptionRequest[] = [];
                inputs.forEach(input => {
                    if (input.checked) {
                        selectedOptions.push({
                            option_id: parseInt(input.value),
                            price: parseInt(input.dataset.price || '0')
                        });
                    }
                });

                // (3) 주문 데이터 객체 생성
                const finalPrice = calculateTotal();
                const orderData: CreateOrderRequest = {
                    kiosk_id: 1, // 테스트용 ID
                    total_price: finalPrice,
                    payment_method: 'CARD', // 테스트용 결제수단
                    items: [
                        {
                            product_id: product.id,
                            quantity: 1,
                            price: product.price, // 옵션 제외 단가
                            options: selectedOptions
                        }
                    ]
                };

                // (4) POST 요청 전송
                try {
                    // 중복 클릭 방지
                    orderButton.textContent = "주문 처리 중...";
                    (orderButton as HTMLButtonElement).disabled = true;

                    const res = await fetch(`${API_BASE}/order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(orderData)
                    });

                    if (!res.ok) {
                        const errData = await res.json();
                        throw new Error(errData.error || '주문 처리에 실패했습니다.');
                    }

                    const result = await res.json();
                    
                    // 주문 성공 시 알림 및 초기화
                    alert(`주문이 완료되었습니다! \n(주문번호: ${result.orderNumber})`);
                    location.reload(); 

                } catch (error: any) {
                    console.error('Order error:', error);
                    alert(`오류가 발생했습니다: ${error.message}`);
                    // 실패 시 버튼 복구
                    orderButton.textContent = "주문하기";
                    (orderButton as HTMLButtonElement).disabled = false;
                }
            });
        }

    } catch (error) {
        console.error('Product detail fetch error:', error);
        root.innerHTML = `
            <div class="kiosk-container">
                <button class="back-button" onclick="location.reload()">← 뒤로가기</button>
                <h1 class="kiosk-title">상품 상세</h1>
                <p class="error">상품 정보를 불러오는데 실패했습니다.</p>
            </div>
        `;
    }
}