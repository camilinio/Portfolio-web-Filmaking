// --- 0. RESET DE SCROLL INMEDIATO Y CAPTURA DE CARGA ---
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
});

// --- 1. HEADER DINÁMICO ---
const header = document.querySelector('.main-header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.style.backgroundColor = "rgba(7, 7, 7, 0.98)";
        header.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
    } else {
        header.style.backgroundColor = "rgba(10, 10, 10, 0.6)";
        header.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
    }
});

// --- 2. ANIMACIÓN FADE-IN GENÉRICA ---
const faders = document.querySelectorAll('.fade-in');
const appearOptions = { threshold: 0.15, rootMargin: "0px 0px -40px 0px" };

const appearObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            appearObserver.unobserve(entry.target);
        }
    });
}, appearOptions);

faders.forEach(fader => appearObserver.observe(fader));

// --- 3. ANIMACIÓN PROYECTOS DESTACADOS ---
const projects = document.querySelectorAll('.project-row');
const projectObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('focus');
            projectObserver.unobserve(entry.target); 
        }
    });
}, { threshold: 0.15 });

projects.forEach(project => projectObserver.observe(project));

// --- 4. SISTEMA DE GALERÍA MASONRY FLEX ---
const galleryImages = document.querySelectorAll('.gallery-img');

function adjustMasonry() {
    galleryImages.forEach(img => {
        if (img.naturalHeight > 0) {
            const ratio = img.naturalWidth / img.naturalHeight;
            img.parentElement.style.flexGrow = ratio;
            img.parentElement.style.flexBasis = (ratio * 220) + 'px'; 
        }
    });
}

galleryImages.forEach(img => {
    if (img.complete) {
        adjustMasonry();
    } else {
        img.addEventListener('load', adjustMasonry);
    }
});

// --- 5. LIGHTBOX AVANZADO (CON ZOOM, LIMPIEZA DE ESTADOS Y SWIPE MÓVIL) ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.close-lightbox');
const nextBtn = document.querySelector('.next-lightbox');
const prevBtn = document.querySelector('.prev-lightbox');
const zoomBtn = document.querySelector('.zoom-lightbox');

const galleryPhotos = Array.from(document.querySelectorAll('.photo-item img'));
const arriImg = document.getElementById('arri-cert-img');
const arriTrigger = document.getElementById('arri-trigger');

let currentIdx = 0;
let isGalleryMode = false;

function toggleZoom() {
    if (lightboxImg) lightboxImg.classList.toggle('zoomed');
}

function resetZoom() {
    if (lightboxImg) lightboxImg.classList.remove('zoomed');
}

function openLightbox(idx, type) {
    resetZoom();
    lightboxImg.style.opacity = '1';
    lightboxImg.style.transform = 'translateX(0)';
    
    if (type === 'gallery') {
        isGalleryMode = true;
        currentIdx = idx;
        lightboxImg.src = galleryPhotos[currentIdx].src;
        if(prevBtn) prevBtn.style.display = 'block'; 
        if(nextBtn) nextBtn.style.display = 'block';
        if(zoomBtn) zoomBtn.style.display = 'flex';
    } else {
        isGalleryMode = false; 
        if(arriImg) lightboxImg.src = arriImg.src;
        if(prevBtn) prevBtn.style.display = 'none'; 
        if(nextBtn) nextBtn.style.display = 'none';
        if(zoomBtn) zoomBtn.style.display = 'flex';
    }
    if(lightbox) lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

galleryPhotos.forEach((img, idx) => {
    img.parentElement.addEventListener('click', () => openLightbox(idx, 'gallery'));
});

if(arriTrigger && arriImg) {
    arriTrigger.addEventListener('click', () => openLightbox(null, 'arri'));
}

function navigate(dir) {
    if(!isGalleryMode) return; 
    resetZoom(); 
    
    // Animación de Galería Nativa (Desvanecer y Mover)
    lightboxImg.style.opacity = '0';
    lightboxImg.style.transform = dir > 0 ? 'translateX(-20px)' : 'translateX(20px)';
    
    setTimeout(() => {
        currentIdx = (currentIdx + dir + galleryPhotos.length) % galleryPhotos.length;
        lightboxImg.src = galleryPhotos[currentIdx].src;
        
        lightboxImg.onload = () => {
            lightboxImg.style.opacity = '1';
            lightboxImg.style.transform = 'translateX(0)';
        };
    }, 200); 
}

if (zoomBtn) zoomBtn.onclick = (e) => { e.stopPropagation(); toggleZoom(); };
if (lightboxImg) lightboxImg.onclick = (e) => { e.stopPropagation(); toggleZoom(); };
if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); navigate(1); };
if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); navigate(-1); };
if (closeBtn) closeBtn.onclick = () => { 
    lightbox.classList.remove('active'); 
    document.body.style.overflow = 'auto'; 
    resetZoom(); 
};

if (lightbox) {
    lightbox.onclick = (e) => { 
        if(e.target === lightbox || e.target.classList.contains('close-lightbox') || e.target.classList.contains('close-cross')) {
            closeBtn.onclick(); 
        }
    };
}

document.addEventListener('keydown', (e) => {
    if(!lightbox || !lightbox.classList.contains('active')) return;
    if(e.key === "Escape") closeBtn.onclick();
    if(e.key === "ArrowRight") navigate(1);
    if(e.key === "ArrowLeft") navigate(-1);
    if(e.key.toLowerCase() === "z") { e.preventDefault(); toggleZoom(); }
});

// Novedad: Lógica de Swipe con Escudo Anti-Zoom
let touchstartX = 0;
let touchendX = 0;
let isZooming = false; // El guardián anti-bug

if (lightbox) {
    lightbox.addEventListener('touchstart', e => {
        if (e.touches.length > 1) { isZooming = true; return; } // Si detecta 2 dedos, cancela swipe
        isZooming = false;
        touchstartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchmove', e => {
        if (e.touches.length > 1) { isZooming = true; } // Por si el segundo dedo entra una fracción de segundo después
    }, { passive: true });

    lightbox.addEventListener('touchend', e => {
        if (isZooming || e.changedTouches.length === 0) return;
        touchendX = e.changedTouches[0].screenX;
        handleSwipe();
    });
}

function handleSwipe() {
    if (!isGalleryMode || isZooming) return; 
    const swipeThreshold = 70; // Sensibilidad un poco más exigente para no saltar sin querer

    if (touchendX < touchstartX - swipeThreshold) navigate(1);
    if (touchendX > touchstartX + swipeThreshold) navigate(-1);
}

// --- 6. DINÁMICA DE REVEAL DEL FOOTER & MEDIDAS EN TIEMPO REAL ---
const contentWrapper = document.querySelector('.content-wrapper');
const footerSection = document.getElementById('contacto');

function syncFooterReveal() {
    if (window.innerWidth > 1000 && footerSection) {
        const footerHeight = footerSection.offsetHeight;
        contentWrapper.style.marginBottom = `${footerHeight}px`;
    } else if (contentWrapper) {
        contentWrapper.style.marginBottom = "0px";
    }
}

window.addEventListener('resize', syncFooterReveal);
window.addEventListener('DOMContentLoaded', syncFooterReveal);

// --- 7. MEJORAS SECCIÓN FORMATO CORTO (DRAG-TO-SCROLL & CLIC INTEGRAL) ---
const shortsSlider = document.getElementById('shorts-slider-container');
let hasBounced = false;

const shortsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !hasBounced) {
            hasBounced = true; 
            
            // Condición: Solo rebota si estás en computadora
            if (window.innerWidth > 900) {
                setTimeout(() => {
                    if(shortsSlider) {
                        shortsSlider.scrollBy({ left: 80, behavior: 'smooth' });
                        setTimeout(() => {
                            shortsSlider.scrollBy({ left: -80, behavior: 'smooth' });
                        }, 400);
                    }
                }, 800);
            }
        }
    });
}, { threshold: 0.6 }); 

if (shortsSlider) shortsObserver.observe(shortsSlider);

let isDown = false;
let startX;
let scrollLeft;
let dragStartTime;
let dragStartX;

if (shortsSlider) {
    shortsSlider.addEventListener('mousedown', (e) => {
        isDown = true;
        shortsSlider.classList.add('active');
        startX = e.pageX - shortsSlider.offsetLeft;
        scrollLeft = shortsSlider.scrollLeft;
        dragStartTime = new Date().getTime();
        dragStartX = e.pageX;
    });

    shortsSlider.addEventListener('mouseleave', () => { isDown = false; shortsSlider.classList.remove('active'); });
    shortsSlider.addEventListener('mouseup', () => { isDown = false; shortsSlider.classList.remove('active'); });

    shortsSlider.addEventListener('mousemove', (e) => {
        if(!isDown) return;
        e.preventDefault(); 
        const x = e.pageX - shortsSlider.offsetLeft;
        const walk = (x - startX) * 2.5; 
        shortsSlider.scrollLeft = scrollLeft - walk;
    });

    document.querySelectorAll('.short-slide').forEach(slide => {
        slide.addEventListener('click', (e) => {
            if (e.target.closest('iframe') || e.target.closest('.short-video-container')) return;
            const dragDuration = new Date().getTime() - dragStartTime;
            const dragDistance = Math.abs(e.pageX - dragStartX);

            if (dragDuration < 250 && dragDistance < 10) {
                const slideRect = slide.getBoundingClientRect();
                const sliderRect = shortsSlider.getBoundingClientRect();
                const slideCenter = slideRect.left + (slideRect.width / 2);
                const sliderCenter = sliderRect.left + (sliderRect.width / 2);
                const direction = slideCenter < sliderCenter ? -1 : 1;
                const scrollAmount = (slide.offsetWidth + 40) * direction;
                shortsSlider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        });
    });
}

// --- 8. FIX: SCROLL HACIA EL FOOTER Y CUE DE SCROLL ---
const btnHablemos = document.querySelector('.header-cta .btn-primary');
const scrollCue = document.getElementById('contact-scroll-cue');

if (btnHablemos) {
    btnHablemos.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    });
}

if (scrollCue) {
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        if (scrollPosition >= documentHeight - 100) {
            scrollCue.style.opacity = '0';
            scrollCue.style.transform = 'translateX(-50%) translateY(10px)';
            scrollCue.style.pointerEvents = 'none';
        } else {
            scrollCue.style.opacity = '1';
            scrollCue.style.transform = 'translateX(-50%) translateY(0)';
        }
    });
}

// --- 9. AUTO-PLAY HERO VIDEO REFUERZO ---
window.addEventListener('load', () => {
    const vid = document.getElementById('hero-vid');
    if(vid) vid.play().catch(() => console.log("Autoplay mitigado por política del navegador."));
    adjustMasonry();
    syncFooterReveal();
});

// --- 10. DOM CONTENT LOADED: MENÚ RESPONSIVE Y BOTONES DEL SLIDER ---
document.addEventListener('DOMContentLoaded', () => {
    
    // A. Lógica del Menú Hamburguesa
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.main-nav ul li a');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mainNav.classList.toggle('active');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                mainNav.classList.remove('active');
            });
        });
    }

    // B. Lógica de los botones del formato corto
    const slider = document.querySelector('.shorts-slider');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if(slider && prevBtn && nextBtn) {
        const getScrollAmount = () => {
            const slide = document.querySelector('.short-slide');
            return slide.offsetWidth + 40; 
        };

        nextBtn.addEventListener('click', () => {
            slider.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            slider.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });

        const updateButtons = () => {
            if (slider.scrollLeft <= 15) {
                prevBtn.classList.add('hidden');
            } else {
                prevBtn.classList.remove('hidden');
            }

            if (Math.ceil(slider.scrollLeft + slider.clientWidth) >= slider.scrollWidth - 15) {
                nextBtn.classList.add('hidden');
            } else {
                nextBtn.classList.remove('hidden');
            }
        };

        slider.addEventListener('scroll', updateButtons);
        window.addEventListener('resize', updateButtons);
        updateButtons();
    }

// --- 11. OCULTAR WHATSAPP FLOTANTE AL FINAL ---
const floatingWa = document.querySelector('.floating-wa');

if (floatingWa) {
    floatingWa.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        if (documentHeight - scrollPosition < 150) {
            floatingWa.style.opacity = '0';
            floatingWa.style.pointerEvents = 'none';
            floatingWa.style.transform = 'translateY(20px) scale(0.9)';
        } else {
            floatingWa.style.opacity = '1';
            floatingWa.style.pointerEvents = 'auto';
            floatingWa.style.transform = 'translateY(0) scale(1)';
        }
    });
}
});