// ===============================
// Detectar secuencia de teclas
// ===============================

// Solo ejecutar en el navegador
if (typeof document !== 'undefined') {
    let keySequence = "";
    const DEV_CODE = "pcdev";
    
    // Variable global para rastrear si dev mode está activo
    window.isDevModeActive = false;

    document.addEventListener("keydown", (e) => {
        keySequence += e.key.toLowerCase();

        // Mantener solo los últimos caracteres
        if (keySequence.length > DEV_CODE.length) {
            keySequence = keySequence.slice(-DEV_CODE.length);
        }

        if (keySequence === DEV_CODE) {
            toggleDevFeatures();
            keySequence = "";
        }
    });

    // ===============================
    // Toggle de features de desarrollo
    // ===============================
    function toggleDevFeatures() {
        const devComControls = document.getElementById("dev-com-controls");
        const devLogControls = document.getElementById("dev-log-controls");

        devComControls?.classList.toggle("hidden");
        devLogControls?.classList.toggle("hidden");
        
        // Actualizar estado global
        window.isDevModeActive = !window.isDevModeActive;
        
        // Habilitar/deshabilitar selectores de cabina
        const selectoresCabina = document.querySelectorAll('[data-select="cabina"]');
        selectoresCabina.forEach(selector => {
            selector.disabled = !window.isDevModeActive;
            if (window.isDevModeActive) {
                selector.classList.remove("opacity-50", "cursor-not-allowed");
                selector.title = "";
            } else {
                selector.classList.add("opacity-50", "cursor-not-allowed");
                selector.title = "Modo desarrollador requerido (pcdev)";
            }
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

        // Función legacy (compatibilidad)
        function _addLog(
            container,
            message,
            icono = "🟡",
        ) {
            removePlaceholder(container);

            const now = new Date().toLocaleTimeString();
            const logItem = document.createElement("div");
            logItem.className = "bg-gray-100 p-1 rounded whitespace-pre-wrap";
            logItem.textContent = `${icono} [${now}] ${message}`;

            container.appendChild(logItem);
            container.scrollTop = container.scrollHeight;
        }
    });
}
