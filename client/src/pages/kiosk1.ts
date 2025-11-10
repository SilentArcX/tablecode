// src/pages/kiosk1.ts
export function renderKiosk1(root: HTMLElement) {
	document.title = "TableCode - Kiosk 1";
	root.innerHTML = `
    <h2>Kiosk 1 화면</h2>
    <p>주문을 시작하세요.</p>
  `;
}