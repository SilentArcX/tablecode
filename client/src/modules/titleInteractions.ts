// src/modules/titleInteractions.ts
export function setupHeaderToggle() {
    const header = document.getElementById('header');
    const title = document.getElementById('dashboard-title');
    if (!header || !title) return;

    let firstClickTime: number | null = null;
    let clickCount = 0;

    // Click title
    title.addEventListener('click', () => {
        const now = Date.now();

        if (firstClickTime === null) {
            firstClickTime = now;
            clickCount = 1;
            return;
        }

        const diff = now - firstClickTime;

        if (diff <= 500) {
            clickCount++;
        } else {
            // reset if time exceeded
            firstClickTime = now;
            clickCount = 1;
        }

        if (clickCount === 3) {
            // 3번 클릭 시 헤더 토글
            header.style.display = header.style.display === 'none' ? '' : 'none';
            firstClickTime = null;
            clickCount = 0;
        }
    });
}