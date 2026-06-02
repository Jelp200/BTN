/**
 * * loaderAnimation.js
 * * Maneja la animación de la pantalla de carga (Loader)
*/

function initHexGrid() {
    const grid = document.getElementById('hex-grid');
    if (!grid) return;

    const COLORS = ['#ff5757', '#7ed957', '#0cc0df', '#ffbd59', '#8c52ff'];

    // R_SLOT = radio de posicionamiento, R_HEX = radio visual (más pequeño → gap visible)
    const R_SLOT = 40;
    const R_HEX  = 39;
    const W_SLOT = R_SLOT * Math.sqrt(3);
    const H_SLOT = R_SLOT * 2;
    const W_HEX  = R_HEX  * Math.sqrt(3);
    const H_HEX  = R_HEX  * 2;
    const STEP_X = W_SLOT;
    const STEP_Y = H_SLOT * 0.75;

    const offsetX = (W_SLOT - W_HEX) / 2;
    const offsetY = (H_SLOT - H_HEX) / 2;

    const cols = Math.ceil(window.innerWidth  / STEP_X) + 3;
    const rows = Math.ceil(window.innerHeight / STEP_Y) + 3;

    const fragment = document.createDocumentFragment();

    for (let row = -1; row < rows; row++) {
        const isOdd = Math.abs(row) % 2 === 1;
        for (let col = -1; col < cols; col++) {
            const slotLeft = col * STEP_X + (isOdd ? STEP_X / 2 : 0);
            const slotTop  = row * STEP_Y;

            // Área de hit: tamaño completo del slot, sin clip-path, maneja los eventos
            const cell = document.createElement('div');
            cell.style.position = 'absolute';
            cell.style.left     = `${slotLeft}px`;
            cell.style.top      = `${slotTop}px`;
            cell.style.width    = `${W_SLOT}px`;
            cell.style.height   = `${H_SLOT}px`;

            // Visual: hexágono con clip-path y animación, sin eventos propios
            const hex = document.createElement('div');
            hex.className           = 'hex-cell';
            hex.style.left          = `${offsetX}px`;
            hex.style.top           = `${offsetY}px`;
            hex.style.width         = `${W_HEX}px`;
            hex.style.height        = `${H_HEX}px`;
            hex.style.pointerEvents = 'none';

            cell.appendChild(hex);

            cell.addEventListener('mouseenter', () => {
                clearTimeout(cell._t);
                const color = COLORS[Math.floor(Math.random() * COLORS.length)];
                hex.style.transition = 'transform 0.06s ease-in';
                hex.style.transform  = 'scaleX(0)';
                cell._t = setTimeout(() => {
                    hex.style.background = color;
                    hex.style.transition = 'transform 0.06s ease-out';
                    hex.style.transform  = 'scaleX(1)';
                }, 60);
            });

            cell.addEventListener('mouseleave', () => {
                clearTimeout(cell._t);
                hex.style.transition = 'transform 0.06s ease-in';
                hex.style.transform  = 'scaleX(0)';
                cell._t = setTimeout(() => {
                    hex.style.background = '#ffffff';
                    hex.style.transition = 'transform 0.06s ease-out';
                    hex.style.transform  = 'scaleX(1)';
                }, 60);
            });

            fragment.appendChild(cell);
        }
    }

    grid.appendChild(fragment);
}

function initLoaderAnimation(waitMs) {
    initHexGrid();

    const progressBar = document.getElementById("progress-bar");
    const splash = document.getElementById("splash-screen");
    
    // Animar la barra de carga de 0% a 95% en el tiempo especificado
    const startTime = Date.now();
    const animationInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / waitMs) * 95, 95); // Hasta 95%
        if (progressBar) {
            progressBar.style.width = progress + "%";
        }
        
        if (elapsed >= waitMs) {
            clearInterval(animationInterval);
            // Llenar al 100% rápidamente
            if (progressBar) {
                progressBar.style.width = "100%";
            }
        }
    }, 30);

    // Desvanecer la pantalla después del tiempo especificado
    setTimeout(() => {
        if (splash) {
            splash.classList.add("opacity-0");
            setTimeout(() => {
                splash.style.display = "none";
            }, 700);
        }
    }, waitMs);
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const splash = document.getElementById("splash-screen");
        if (splash) {
            const waitMs = parseInt(splash.getAttribute('data-wait-ms') || '8000', 10);
            initLoaderAnimation(waitMs);
        }
    });
} else {
    const splash = document.getElementById("splash-screen");
    if (splash) {
        const waitMs = parseInt(splash.getAttribute('data-wait-ms') || '8000', 10);
        initLoaderAnimation(waitMs);
    }
}
