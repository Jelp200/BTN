// Solo ejecutar en el navegador
if (typeof document !== 'undefined') {
    // ===============================
    // Estado global de dev mode
    // ===============================
    window.isDevModeActive = false;

    // ===============================
    // Detección de secuencia "pcdev"
    // ===============================
    let keySequence = "";
    const DEV_CODE = "pcdev";

    document.addEventListener("keydown", (e) => {
        // No acumular si el foco está en un input/textarea
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea") return;

        keySequence += e.key.toLowerCase();
        if (keySequence.length > DEV_CODE.length) {
            keySequence = keySequence.slice(-DEV_CODE.length);
        }

        if (keySequence === DEV_CODE) {
            keySequence = "";
            if (window.isDevModeActive) {
                deactivateDevMode();
            } else {
                openDevPasswordModal();
            }
        }
    });

    // ===============================
    // Modal de autenticación
    // ===============================
    const DEV_PASSWORD = "pcdev-nezahualcoyotl-gt";

    function openDevPasswordModal() {
        if (document.getElementById("dev-auth-modal")) return;

        const overlay = document.createElement("div");
        overlay.id = "dev-auth-modal";
        overlay.style.cssText = [
            "position:fixed", "inset:0", "z-index:99999",
            "display:flex", "align-items:center", "justify-content:center",
            "background:rgba(0,0,0,0.6)", "backdrop-filter:blur(3px)"
        ].join(";");

        overlay.innerHTML = `
            <div style="background:#1e1e2e;border:1px solid #3b3b5c;border-radius:12px;
                        padding:28px 32px;width:340px;max-width:90vw;
                        box-shadow:0 20px 60px rgba(0,0,0,0.5);font-family:monospace;">
                <p style="margin:0 0 6px;font-size:11px;color:#6b7280;letter-spacing:2px;
                           text-transform:uppercase;">Modo Desarrollador</p>
                <p style="margin:0 0 20px;font-size:15px;color:#e2e8f0;font-weight:600;">
                    Ingresa la contraseña
                </p>
                <input
                    id="dev-password-input"
                    type="password"
                    autocomplete="off"
                    placeholder="••••••••••••••••••••"
                    style="width:100%;box-sizing:border-box;padding:10px 12px;
                           background:#0f0f1a;border:1px solid #3b3b5c;border-radius:8px;
                           color:#e2e8f0;font-size:14px;font-family:monospace;outline:none;
                           margin-bottom:8px;"
                />
                <p id="dev-auth-error"
                   style="margin:0 0 14px;font-size:12px;color:#f87171;min-height:16px;"></p>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button id="dev-auth-cancel"
                        style="padding:8px 16px;background:transparent;border:1px solid #3b3b5c;
                               border-radius:8px;color:#9ca3af;font-size:13px;cursor:pointer;">
                        Cancelar
                    </button>
                    <button id="dev-auth-submit"
                        style="padding:8px 16px;background:#6366f1;border:none;
                               border-radius:8px;color:#fff;font-size:13px;
                               cursor:pointer;font-weight:600;">
                        Acceder
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const input  = document.getElementById("dev-password-input");
        const error  = document.getElementById("dev-auth-error");
        const submit = document.getElementById("dev-auth-submit");
        const cancel = document.getElementById("dev-auth-cancel");

        // Foco automático
        setTimeout(() => input?.focus(), 50);

        function attemptUnlock() {
            if (input.value === DEV_PASSWORD) {
                closeDevPasswordModal();
                activateDevMode();
            } else {
                error.textContent = "Contraseña incorrecta. Inténtalo de nuevo.";
                input.value = "";
                input.focus();
            }
        }

        submit.addEventListener("click", attemptUnlock);
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") attemptUnlock();
            if (e.key === "Escape") closeDevPasswordModal();
        });
        cancel.addEventListener("click", closeDevPasswordModal);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeDevPasswordModal();
        });
    }

    function closeDevPasswordModal() {
        document.getElementById("dev-auth-modal")?.remove();
    }

    // ===============================
    // Activar / desactivar dev mode
    // ===============================
    function activateDevMode() {
        window.isDevModeActive = true;

        document.getElementById("dev-com-controls")?.classList.remove("hidden");
        document.getElementById("dev-log-controls")?.classList.remove("hidden");

        document.querySelectorAll('[data-select="cabina"]').forEach(selector => {
            selector.disabled = false;
            selector.classList.remove("opacity-50", "cursor-not-allowed");
            selector.title = "";
        });
    }

    function deactivateDevMode() {
        window.isDevModeActive = false;

        document.getElementById("dev-com-controls")?.classList.add("hidden");
        document.getElementById("dev-log-controls")?.classList.add("hidden");

        document.querySelectorAll('[data-select="cabina"]').forEach(selector => {
            selector.disabled = true;
            selector.classList.add("opacity-50", "cursor-not-allowed");
            selector.title = "Modo desarrollador requerido (pcdev)";
        });
    }

    // ===============================
    // Proteger menú contextual
    // ===============================
    document.addEventListener("contextmenu", (e) => {
        // Si dev mode no está activo, prevenir el menú contextual
        if (!window.isDevModeActive) {
            e.preventDefault();
        }
    });
    
    // ===============================
    // Proteger tecla F12 y Ctrl+Shift+I (Developer Tools)
    // ===============================
    document.addEventListener("keydown", (e) => {
        // Si dev mode no está activo, prevenir F12 y Ctrl+Shift+I
        if (!window.isDevModeActive) {
            // F12
            if (e.key === "F12") {
                e.preventDefault();
            }
            // Ctrl+Shift+I (Windows/Linux) o Cmd+Option+I (Mac)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") {
                e.preventDefault();
            }
        }
    });

    // ===============================
    // DOM Ready
    // ===============================
    document.addEventListener("DOMContentLoaded", () => {
        // Deshabilitar selectores de cabina por defecto
        const selectoresCabina = document.querySelectorAll('[data-select="cabina"]');
        selectoresCabina.forEach(selector => {
            selector.disabled = true;
            selector.classList.add("opacity-50", "cursor-not-allowed");
            selector.title = "Modo desarrollador requerido (pcdev)";
        });
        
        const btnToggleSent = document.getElementById("btn-toggle-sent");
        const btnToggleReceived = document.getElementById("btn-toggle-received");

        const logSent = document.getElementById("log-sent");
        const logReceived = document.getElementById("log-received");
        const ucSelector = document.getElementById("uc-selector");

        // -------------------------------
        // Toggle logs enviados
        // -------------------------------
        btnToggleSent?.addEventListener("click", () => {
            if (!logSent || !logReceived || !btnToggleReceived) return;

            const isVisible = !logSent.classList.contains("hidden");
            logSent.classList.toggle("hidden", isVisible);
            btnToggleSent.setAttribute("aria-expanded", String(!isVisible));

            if (!logReceived.classList.contains("hidden")) {
                logReceived.classList.add("hidden");
                btnToggleReceived.setAttribute("aria-expanded", "false");
            }
        });

        // -------------------------------
        // Toggle logs recibidos
        // -------------------------------
        btnToggleReceived?.addEventListener("click", () => {
            if (!logSent || !logReceived || !btnToggleSent) return;

            const isVisible = !logReceived.classList.contains("hidden");
            logReceived.classList.toggle("hidden", isVisible);
            btnToggleReceived.setAttribute("aria-expanded", String(!isVisible));

            if (!logSent.classList.contains("hidden")) {
                logSent.classList.add("hidden");
                btnToggleSent.setAttribute("aria-expanded", "false");
            }
        });

        // -------------------------------
        // Click fuera → ocultar logs
        // -------------------------------
        document.addEventListener("click", (e) => {
            if (!logSent || !logReceived || !btnToggleSent || !btnToggleReceived) return;

            const target = e.target;

            const clickedInSent =
                logSent.contains(target) || btnToggleSent.contains(target);

            const clickedInReceived =
                logReceived.contains(target) || btnToggleReceived.contains(target);

            if (!clickedInSent) logSent.classList.add("hidden");
            if (!clickedInReceived) logReceived.classList.add("hidden");

            btnToggleSent.setAttribute(
                "aria-expanded",
                String(!logSent.classList.contains("hidden")),
            );
            btnToggleReceived.setAttribute(
                "aria-expanded",
                String(!logReceived.classList.contains("hidden")),
            );
        });

        // -------------------------------
        // Icono dinámico del selector uC
        // -------------------------------
        const applyUcIcon = () => {
            if (!ucSelector) return;
            const opt = ucSelector.selectedOptions?.[0];
            const icon = opt?.getAttribute("data-icon") || "";
            if (icon) {
                ucSelector.style.backgroundImage = `url('${icon}')`;
            }
        };

        ucSelector?.addEventListener("change", applyUcIcon);
        // Aplicar icono al cargar
        applyUcIcon();

        // ===============================
        // Logs enviados (global)
        // ===============================
        window.addSentLog = (message) => {
            const logContainer = document.getElementById("log-sent-messages");
            if (!logContainer) return;

            removePlaceholder(logContainer);

            const now = new Date().toLocaleTimeString();
            const logItem = document.createElement("div");
            logItem.className = "bg-gray-100 p-1 rounded whitespace-pre-wrap";
            logItem.textContent = `🔵 [${now}] ${message}`;

            logContainer.appendChild(logItem);
            logContainer.scrollTop = logContainer.scrollHeight;
        };

        // ===============================
        // Logs recibidos (global)
        // ===============================
        window.addReceivedLog = (message) => {
            const logContainer = document.getElementById("log-received-messages");
            if (!logContainer) return;

            removePlaceholder(logContainer);

            const now = new Date().toLocaleTimeString();
            const logItem = document.createElement("div");
            logItem.className = "bg-gray-100 p-1 rounded whitespace-pre-wrap";
            logItem.textContent = `🟢 [${now}] ${message}`;

            logContainer.appendChild(logItem);
            logContainer.scrollTop = logContainer.scrollHeight;
        };

        // ===============================
        // Helpers
        // ===============================
        function removePlaceholder(container) {
            const placeholder = container.querySelector(".text-center");
            if (
                placeholder &&
                placeholder.textContent?.includes("No hay tramas aún")
            ) {
                placeholder.remove();
            }
        }


    });
}
