// ===============================
// Extender la interfaz Window
// ===============================
declare global {
    interface Window {
        addSentLog: (message: string) => void;
        addReceivedLog: (message: string) => void;
        isDevModeActive: boolean;
    }
}

export {};

// ===============================
// Detectar secuencia de teclas
// ===============================

// Solo ejecutar en el navegador
if (typeof document !== 'undefined') {
    let keySequence: string = "";
    const DEV_CODE: string = "gitsdev";
    
    // Variable global para rastrear si dev mode está activo
    (window as any).isDevModeActive = false;

    document.addEventListener("keydown", (e: KeyboardEvent) => {
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
    function toggleDevFeatures(): void {
        const devComControls = document.getElementById("dev-com-controls");
        const devLogControls = document.getElementById("dev-log-controls");

        devComControls?.classList.toggle("hidden");
        devLogControls?.classList.toggle("hidden");
        
        // Actualizar estado global
        (window as any).isDevModeActive = !((window as any).isDevModeActive);
    }
    
    // ===============================
    // Proteger menú contextual
    // ===============================
    document.addEventListener("contextmenu", (e: MouseEvent) => {
        // Si dev mode no está activo, prevenir el menú contextual
        if (!(window as any).isDevModeActive) {
            e.preventDefault();
        }
    });
    
    // ===============================
    // Proteger tecla F12 (Developer Tools)
    // ===============================
    document.addEventListener("keydown", (e: KeyboardEvent) => {
        // Si dev mode no está activo, prevenir F12
        if (!(window as any).isDevModeActive && e.key === "F12") {
            e.preventDefault();
        }
    });

    // ===============================
    // DOM Ready
    // ===============================
    document.addEventListener("DOMContentLoaded", () => {
        const btnToggleSent = document.getElementById("btn-toggle-sent") as HTMLElement | null;
        const btnToggleReceived = document.getElementById("btn-toggle-received") as HTMLElement | null;

        const logSent = document.getElementById("log-sent") as HTMLElement | null;
        const logReceived = document.getElementById("log-received") as HTMLElement | null;
        const ucSelector = document.getElementById("uc-selector") as HTMLSelectElement | null;

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
        document.addEventListener("click", (e: MouseEvent) => {
            if (!logSent || !logReceived || !btnToggleSent || !btnToggleReceived) return;

            const target = e.target as Node;

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
        const applyUcIcon = (): void => {
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
        window.addSentLog = (message: string): void => {
            const logContainer = document.getElementById("log-sent-messages") as HTMLElement | null;
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
        window.addReceivedLog = (message: string): void => {
            const logContainer = document.getElementById("log-received-messages") as HTMLElement | null;
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
        function removePlaceholder(container: HTMLElement): void {
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
            container: HTMLElement,
            message: string,
            icono: string = "🟡",
        ): void {
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
