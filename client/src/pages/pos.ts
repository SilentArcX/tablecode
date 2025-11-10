// src/pages/pos.ts
export function renderPos(root: HTMLElement) {
	document.title = "TableCode - POS 화면";
	root.innerHTML = `
    <h2>POS 화면</h2>
    <p>계산기 및 주문 처리</p>
  `;
}