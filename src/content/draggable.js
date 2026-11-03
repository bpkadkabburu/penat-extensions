/**
 * Membuat container tombol extension bisa digeser (drag) supaya tidak menutup
 * elemen SIPD lain (mis. tombol logout). Posisi disimpan per container.
 */
(function () {
    'use strict';

    const SELECTOR = '.sipd-extractor-container, .sipd-dashboard-container';
    const DRAG_THRESHOLD = 4;
    const STORE_PREFIX = 'sipd-btn-pos:';

    function clamp(el, left, top) {
        const maxLeft = Math.max(0, window.innerWidth - el.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - el.offsetHeight);
        return [Math.min(Math.max(0, left), maxLeft), Math.min(Math.max(0, top), maxTop)];
    }

    function place(el, left, top) {
        [left, top] = clamp(el, left, top);
        el.style.left = left + 'px';
        el.style.top = top + 'px';
        el.style.right = 'auto';
    }

    function makeDraggable(el) {
        if (el.dataset.sipdDraggable) return;
        el.dataset.sipdDraggable = '1';
        el.style.touchAction = 'none';
        el.title = el.title || 'Tarik untuk memindahkan';

        const key = STORE_PREFIX + (el.id || el.className);
        try {
            const saved = JSON.parse(localStorage.getItem(key));
            if (saved) place(el, saved.left, saved.top);
        } catch (e) { /* abaikan */ }

        let startX, startY, originLeft, originTop, dragging = false, pressed = false;

        el.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            const rect = el.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            originLeft = rect.left;
            originTop = rect.top;
            pressed = true;
            dragging = false;
        });

        window.addEventListener('pointermove', (e) => {
            if (!pressed) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (!dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
            if (!dragging) {
                dragging = true;
                el.style.cursor = 'grabbing';
            }
            place(el, originLeft + dx, originTop + dy);
        });

        window.addEventListener('pointerup', () => {
            if (!pressed) return;
            pressed = false;
            el.style.cursor = '';
            if (dragging) {
                try {
                    localStorage.setItem(key, JSON.stringify({
                        left: parseFloat(el.style.left),
                        top: parseFloat(el.style.top)
                    }));
                } catch (e) { /* abaikan */ }
            }
        });

        // Cegah klik tombol setelah selesai drag
        el.addEventListener('click', (e) => {
            if (dragging) {
                e.stopPropagation();
                e.preventDefault();
                dragging = false;
            }
        }, true);

        window.addEventListener('resize', () => {
            const rect = el.getBoundingClientRect();
            place(el, rect.left, rect.top);
        });
    }

    function scan() {
        document.querySelectorAll(SELECTOR).forEach(makeDraggable);
    }

    scan();
    new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
