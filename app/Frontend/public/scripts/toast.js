// =============================================================================
//  toast.js — Sistema de notificaciones tipo toast
//  Gradus Technologies · ControlPanel
// =============================================================================
//  API pública:
//    window.showToast(message, type)
//    type: 'success' | 'error' | 'warning' | 'info'  (default: auto-detect)
//
//  window.alert queda reemplazado automáticamente al final de este archivo.
// =============================================================================

(function () {
    if (typeof document === 'undefined') return;

    // ─── Constantes ──────────────────────────────────────────────────────────
    const DURATION = { success: 4000, info: 4000, warning: 5000, error: 6000 };
    const MAX_TOASTS = 5;

    const ICONS = {
        success: `<svg viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;flex-shrink:0">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/>
                  </svg>`,
        error:   `<svg viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;flex-shrink:0">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>
                  </svg>`,
        warning: `<svg viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;flex-shrink:0">
                    <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                  </svg>`,
        info:    `<svg viewBox="0 0 20 20" fill="currentColor" style="width:18px;height:18px;flex-shrink:0">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/>
                  </svg>`,
    };

    const COLORS = {
        success: { border: '#22c55e', icon: '#16a34a', bg: '#f0fdf4', text: '#14532d', bar: '#22c55e' },
        error:   { border: '#ef4444', icon: '#dc2626', bg: '#fef2f2', text: '#7f1d1d', bar: '#ef4444' },
        warning: { border: '#f59e0b', icon: '#d97706', bg: '#fffbeb', text: '#78350f', bar: '#f59e0b' },
        info:    { border: '#3b82f6', icon: '#2563eb', bg: '#eff6ff', text: '#1e3a5f', bar: '#3b82f6' },
    };

    // ─── Contenedor ──────────────────────────────────────────────────────────
    function getContainer() {
        let el = document.getElementById('gt-toast-container');
        if (!el) {
            el = document.createElement('div');
            el.id = 'gt-toast-container';
            el.setAttribute('aria-live', 'polite');
            el.setAttribute('aria-atomic', 'false');
            el.style.cssText = [
                'position:fixed',
                'top:20px',
                'right:20px',
                'z-index:99998',
                'display:flex',
                'flex-direction:column',
                'gap:10px',
                'pointer-events:none',
                'max-width:360px',
                'width:calc(100vw - 40px)',
            ].join(';');
            document.body.appendChild(el);
        }
        return el;
    }

    // ─── Detectar tipo automáticamente ───────────────────────────────────────
    function detectType(message) {
        const msg = (message || '').toString();
        if (msg.includes('✅')) return 'success';
        if (msg.includes('❌')) return 'error';
        if (msg.includes('⚠️') || msg.includes('⚠')) return 'warning';
        return 'info';
    }

    // ─── Limpiar emojis de tipo del mensaje ──────────────────────────────────
    function cleanMessage(message) {
        return (message || '')
            .toString()
            .replace(/^[✅❌⚠️⚠ℹ️ℹ]\s*/u, '')
            .trim();
    }

    // ─── Crear y mostrar un toast ─────────────────────────────────────────────
    function showToast(message, type) {
        const container = getContainer();

        // Limitar cantidad máxima
        const existing = container.querySelectorAll('.gt-toast');
        if (existing.length >= MAX_TOASTS) {
            existing[0].dispatchEvent(new Event('gt-dismiss'));
        }

        const resolvedType = type && COLORS[type] ? type : detectType(message);
        const c = COLORS[resolvedType];
        const duration = DURATION[resolvedType];
        const cleanMsg = cleanMessage(message);

        // ── Elemento toast ──
        const toast = document.createElement('div');
        toast.className = 'gt-toast';
        toast.setAttribute('role', 'alert');
        toast.style.cssText = [
            `background:${c.bg}`,
            `border:1px solid ${c.border}`,
            `border-left:4px solid ${c.border}`,
            'border-radius:10px',
            'box-shadow:0 4px 20px rgba(0,0,0,0.12)',
            'padding:12px 14px 8px',
            'pointer-events:all',
            'cursor:pointer',
            'overflow:hidden',
            'position:relative',
            'transform:translateX(110%)',
            'transition:transform 0.3s cubic-bezier(.21,1.02,.73,1), opacity 0.3s ease',
            'opacity:0',
            'will-change:transform,opacity',
            'width:100%',
            'box-sizing:border-box',
        ].join(';');

        // ── Fila icono + texto + cierre ──
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:flex-start;gap:10px;';

        // Icono
        const iconWrap = document.createElement('span');
        iconWrap.style.cssText = `color:${c.icon};margin-top:1px;`;
        iconWrap.innerHTML = ICONS[resolvedType];

        // Texto
        const textEl = document.createElement('span');
        textEl.style.cssText = `flex:1;font-size:13px;line-height:1.45;color:${c.text};font-family:system-ui,sans-serif;word-break:break-word;`;
        textEl.textContent = cleanMsg;

        // Botón cerrar
        const closeBtn = document.createElement('button');
        closeBtn.setAttribute('aria-label', 'Cerrar notificación');
        closeBtn.style.cssText = [
            `color:${c.icon}`,
            'background:none',
            'border:none',
            'cursor:pointer',
            'padding:0',
            'line-height:1',
            'opacity:0.6',
            'font-size:16px',
            'flex-shrink:0',
            'margin-top:-1px',
        ].join(';');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dismiss(toast);
        });

        row.appendChild(iconWrap);
        row.appendChild(textEl);
        row.appendChild(closeBtn);
        toast.appendChild(row);

        // ── Barra de progreso ──
        const bar = document.createElement('div');
        bar.style.cssText = [
            `background:${c.bar}`,
            'height:3px',
            'border-radius:2px',
            'margin-top:8px',
            'width:100%',
            `transition:width ${duration}ms linear`,
            'will-change:width',
        ].join(';');
        toast.appendChild(bar);

        container.appendChild(toast);

        // ── Animación de entrada ──
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.style.transform = 'translateX(0)';
                toast.style.opacity = '1';
                // Iniciar barra
                bar.style.width = '0%';
            });
        });

        // ── Auto-dismiss ──
        const timer = setTimeout(() => dismiss(toast), duration);

        // ── Pausar en hover ──
        let remaining = duration;
        let startTime;
        let rafId;

        toast.addEventListener('mouseenter', () => {
            clearTimeout(timer);
            bar.style.transition = 'none';
            cancelAnimationFrame(rafId);
        });

        toast.addEventListener('mouseleave', () => {
            const elapsed = performance.now() - (startTime || performance.now());
            remaining = Math.max(0, remaining - elapsed);
            bar.style.transition = `width ${remaining}ms linear`;
            bar.style.width = '0%';
            const t = setTimeout(() => dismiss(toast), remaining);
            toast.dataset.timer = t;
        });

        toast.addEventListener('click', () => dismiss(toast));

        // ── Dismiss ──
        function dismiss(el) {
            el.style.transform = 'translateX(110%)';
            el.style.opacity = '0';
            el.addEventListener('transitionend', () => el.remove(), { once: true });
        }

        toast.addEventListener('gt-dismiss', () => dismiss(toast));
    }

    // ─── Exponer globalmente ──────────────────────────────────────────────────
    window.showToast = showToast;

    // Reemplazar window.alert por toasts (preservar referencia original por si se necesita)
    window._nativeAlert = window.alert;
    window.alert = function (message) {
        showToast(String(message ?? ''));
    };

})();
