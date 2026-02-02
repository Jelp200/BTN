/**
 * * loaderAnimation.js
 * * Maneja la animación de la pantalla de carga (Loader)
*/

function initLoaderAnimation(waitMs) {
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
