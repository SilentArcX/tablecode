// src/main.ts
import { renderKiosk1 } from './pages/kiosk1';
import { renderKiosk2 } from './pages/kiosk2';
import { renderScreen } from './pages/screen';
import { renderPos } from './pages/pos';

const root = document.getElementById('root')!;

function router() {
	const path = window.location.pathname;
	root.innerHTML = '';
	switch (path) {
		case '/kiosk1': renderKiosk1(root); break;
		case '/kiosk2': renderKiosk2(root); break;
		case '/screen': renderScreen(root); break;
		case '/pos': renderPos(root); break;
		default: navigateTo('/kiosk1'); break;
	}
}

function navigateTo(path: string) {
	window.history.pushState({}, '', path);
	router();
}

window.addEventListener('popstate', router);
window.addEventListener('load', router);

// nav 링크 클릭 이벤트 연결
document.querySelectorAll<HTMLSpanElement>('.nav-link')
	.forEach(link => link.addEventListener('click', () => link.dataset.path && navigateTo(link.dataset.path)));