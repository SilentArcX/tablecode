// src/pages/screen.ts
export function renderScreen(root: HTMLElement) {
	document.title = "TableCode - 주문 번호 모니터";
	root.innerHTML = `
    <h2>주문 번호 모니터</h2>
    <p>현재 주문 번호 표시</p>
  `;
}