/* ============================================================
   TURQUOISE AUTO CENTRE LTD — main.js
   Modules:
     1.  Theme Toggle
     2.  Hamburger Menu
     3.  Scroll Progress Bar
     4.  Nav Scroll-spy & Background
     5.  Scroll Reveal
     6.  Hero Parallax Grid
     7.  Hero Slideshow
     8.  Service Tabs (with sessionStorage persistence)
     9.  FAQ Accordion
     10. Form Validation & Submission
     11. Toast Notification System
     12. Back to Top Button
     13. WhatsApp FAB
     14. Live Open / Closed Status
     15. Icon & Button Animation Observer
   ============================================================ */

/* ─────────────────────────────────────────────
   ELEMENT REFERENCES
───────────────────────────────────────────── */
const themeToggleBtn   = document.getElementById('theme-toggle');
const hamburger        = document.getElementById('hamburger');
const mobileMenu       = document.getElementById('mobile-menu');
const mobileLinks      = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
const desktopLinks     = document.querySelectorAll('.nav-links a');
const contactSubmitBtn = document.getElementById('enquiry-submit');
const progressBar      = document.getElementById('scroll-progress');
const navEl            = document.querySelector('nav');
const heroGrid         = document.querySelector('.hero-grid');
const backToTopBtn     = document.getElementById('back-to-top');
const whatsappFab      = document.getElementById('whatsapp-fab');

const THEME_KEY    = 'tac-theme';
const LAST_TAB_KEY = 'tac-last-tab';
const NAV_SECTIONS = ['home','services','pricing','faq','about','gallery','blog','contact'];
const sections     = NAV_SECTIONS.map(id => document.getElementById(id)).filter(Boolean);

let currentSectionId = null;
let docHeight        = getDocHeight();
let ticking          = false;

function getDocHeight() {
  return document.documentElement.scrollHeight - window.innerHeight;
}


/* ═══════════════════════════════════════════════════════
   1. THEME TOGGLE
   ═══════════════════════════════════════════════════════ */
function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light', isLight);
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = isLight
      ? '<i class="fa-solid fa-moon" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
    themeToggleBtn.setAttribute('aria-label',
      isLight ? 'Switch to dark mode' : 'Switch to light mode');
  }
}

function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'light');
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const next = document.body.classList.contains('light') ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

initTheme();


/* ═══════════════════════════════════════════════════════
   2. HAMBURGER MENU
   ═══════════════════════════════════════════════════════ */
function openMenu() {
  hamburger.classList.add('open');
  mobileMenu.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.contains('open') ? closeMenu() : openMenu();
  });
}

mobileLinks.forEach(link => link.addEventListener('click', closeMenu));

document.addEventListener('click', (e) => {
  if (
    mobileMenu &&
    mobileMenu.classList.contains('open') &&
    !mobileMenu.contains(e.target) &&
    !hamburger.contains(e.target)
  ) closeMenu();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});


/* ═══════════════════════════════════════════════════════
   3. SCROLL PROGRESS BAR
   ═══════════════════════════════════════════════════════ */
function updateProgress() {
  if (!progressBar) return;
  const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}

function updateDocDimensions() {
  docHeight = getDocHeight();
  updateProgress();
  updateParallax();
}

window.addEventListener('resize', updateDocDimensions, { passive: true });


/* ═══════════════════════════════════════════════════════
   4. NAV: SCROLL-SPY ACTIVE LINK & BACKGROUND
   ═══════════════════════════════════════════════════════ */
function updateNavActive() {
  const pos = window.scrollY + 120;
  let activeId = null;

  sections.forEach(section => {
    const top    = section.offsetTop;
    const bottom = top + section.offsetHeight;
    if (pos >= top && pos < bottom) activeId = section.id;
  });

  // When scrolled near bottom, activate last section
  if (!activeId && window.scrollY + window.innerHeight >= document.body.scrollHeight - 20) {
    activeId = sections[sections.length - 1]?.id || null;
  }

  if (activeId === currentSectionId) return;
  currentSectionId = activeId;

  desktopLinks.forEach(link =>
    link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`)
  );
  mobileLinks.forEach(link =>
    link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`)
  );
}

function updateNavBackground() {
  if (navEl) navEl.classList.toggle('scrolled', window.scrollY > 60);
}


/* ═══════════════════════════════════════════════════════
   5. SCROLL REVEAL (INTERSECTION OBSERVER)
   ═══════════════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    if (!entry.target.classList.contains('heading-wipe')) {
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


/* ═══════════════════════════════════════════════════════
   6. HERO PARALLAX GRID
   ═══════════════════════════════════════════════════════ */
function updateParallax() {
  if (heroGrid && window.scrollY < window.innerHeight) {
    heroGrid.style.transform = `translateY(${window.scrollY * 0.25}px)`;
  }
}


/* ═══════════════════════════════════════════════════════
   7. HERO SLIDESHOW
   ═══════════════════════════════════════════════════════ */
(function initSlideshow() {
  const slides      = document.querySelectorAll('.hero-slide');
  const dots        = document.querySelectorAll('.hero-dot');
  const captionEl   = document.getElementById('slide-caption');
  const captionIcon = document.querySelector('.hero-slide-label i');
  if (!slides.length) return;

  const captions = [
    { text: 'Body Work &amp; Panel Beating',   icon: 'fa-solid fa-hammer' },
    { text: 'Computerized Spray Painting',      icon: 'fa-solid fa-spray-can-sparkles' },
    { text: 'Tyre Centre &amp; Wheel Services', icon: 'fa-solid fa-circle-dot' },
    { text: 'Mechanical &amp; Engine Repairs',  icon: 'fa-solid fa-wrench' },
  ];

  let current  = 0;
  let autoPlay = null;

  function goToSlide(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');

    current = ((index % slides.length) + slides.length) % slides.length;

    slides[current].classList.add('active');
    dots[current].classList.add('active');

    if (captionEl) captionEl.innerHTML = captions[current].text;
    if (captionIcon) {
      captionIcon.className = '';
      captionIcon.classList.add(...captions[current].icon.split(' '));
    }
  }

  function nextSlide() { goToSlide(current + 1); }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlay = setInterval(nextSlide, 5000);
  }

  function stopAutoPlay() {
    if (autoPlay) { clearInterval(autoPlay); autoPlay = null; }
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goToSlide(i); stopAutoPlay(); startAutoPlay(); });
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { goToSlide(current + 1); stopAutoPlay(); startAutoPlay(); }
      if (e.key === 'ArrowLeft')  { goToSlide(current - 1); stopAutoPlay(); startAutoPlay(); }
    });
  });

  const slideshowEl = document.querySelector('.hero-slideshow');
  if (slideshowEl) {
    slideshowEl.addEventListener('mouseenter', stopAutoPlay);
    slideshowEl.addEventListener('mouseleave', startAutoPlay);
    slideshowEl.addEventListener('touchstart', stopAutoPlay,  { passive: true });
    slideshowEl.addEventListener('touchend',   startAutoPlay, { passive: true });
  }

  startAutoPlay();
})();


/* ═══════════════════════════════════════════════════════
   8. SERVICE TABS
   ═══════════════════════════════════════════════════════ */
const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

function showTab(id, clickedBtn) {
  tabPanels.forEach(p => p.classList.remove('active'));
  tabBtns.forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  const panel = document.getElementById('tab-' + id);
  if (!panel) return;

  panel.classList.add('active');
  clickedBtn.classList.add('active');
  clickedBtn.setAttribute('aria-selected', 'true');

  panel.querySelectorAll('.reveal').forEach(el => {
    el.classList.remove('visible');
    void el.offsetWidth;
    el.classList.add('visible');
  });

  panel.querySelectorAll('.service-icon').forEach(icon => {
    icon.style.animation = 'none';
    icon.style.opacity   = '0';
    void icon.offsetWidth;
    icon.style.animation = '';
    icon.style.opacity   = '';
  });

  sessionStorage.setItem(LAST_TAB_KEY, id);
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => showTab(btn.getAttribute('data-tab'), btn));
});

// Restore last viewed tab
(function () {
  const lastTab = sessionStorage.getItem(LAST_TAB_KEY);
  if (!lastTab) return;
  const btn = document.querySelector(`.tab-btn[data-tab="${lastTab}"]`);
  if (btn) showTab(lastTab, btn);
})();


/* ═══════════════════════════════════════════════════════
   9. FAQ ACCORDION
   ═══════════════════════════════════════════════════════ */
document.querySelectorAll('.faq-item').forEach(item => {
  const question = item.querySelector('.faq-question');
  if (!question) return;
  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      question.setAttribute('aria-expanded', 'true');
    }
  });
});


/* ═══════════════════════════════════════════════════════
   10. FORM VALIDATION & SUBMISSION
   ═══════════════════════════════════════════════════════ */
function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + '-error');
  if (field) field.classList.toggle('input-error', !!message);
  if (error) error.textContent = message || '';
}

function clearAllErrors() {
  ['name','email','phone','service'].forEach(id => setFieldError(id, ''));
}

function validateForm() {
  let valid = true;
  clearAllErrors();

  const name    = document.getElementById('name')?.value.trim()  || '';
  const email   = document.getElementById('email')?.value.trim() || '';
  const phone   = document.getElementById('phone')?.value.trim() || '';
  const service = document.getElementById('service')?.value      || '';

  if (!name) {
    setFieldError('name', 'Full name is required.');
    valid = false;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError('email', 'Please enter a valid email address.');
    valid = false;
  }
  if (!phone) {
    setFieldError('phone', 'Phone number is required.');
    valid = false;
  } else if (!/^[\+\d\s\-\(\)]{7,}$/.test(phone)) {
    setFieldError('phone', 'Please enter a valid phone number.');
    valid = false;
  }
  if (!service) {
    setFieldError('service', 'Please select a service.');
    valid = false;
  }

  return valid;
}

['name','email','phone','service'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => setFieldError(id, ''));
});

if (contactSubmitBtn) {
  contactSubmitBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    // Honeypot — if filled, silently fake success (bot submission)
    const honeypot = document.getElementById('hp-name');
    if (honeypot && honeypot.value) {
      contactSubmitBtn.disabled = true;
      contactSubmitBtn.innerHTML = '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Sent!';
      return;
    }

    if (!validateForm()) {
      document.querySelector('.input-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const phone   = document.getElementById('phone').value.trim();
    const service = document.getElementById('service').value;
    const vehicle = document.getElementById('vehicle').value.trim();
    const details = document.getElementById('details').value.trim();

    contactSubmitBtn.disabled = true;
    contactSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending…';

    try {
      const appCheckHeader = await window.getAppCheckHeader?.() || {};
      const response = await fetch(
        `https://us-central1-${FIREBASE_CONFIG.projectId}.cloudfunctions.net/submitEnquiry`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...appCheckHeader },
          body: JSON.stringify({ name, email, phone, service, vehicle, details }),
        }
      );

      if (response.ok) {
        showToast('success', 'Enquiry sent!',
          `Thank you, ${name}. We'll be in touch shortly.`);
        ['name','email','phone','vehicle','details'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });
        document.getElementById('service').value = '';
      } else {
        throw new Error('Server error ' + response.status);
      }
    } catch (err) {
      console.error('Enquiry error:', err);
      showToast('error', 'Sending failed',
        'Please try again or WhatsApp us on <strong>+254 116 967804</strong>.');
    } finally {
      contactSubmitBtn.disabled = false;
      contactSubmitBtn.innerHTML =
        '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i> Send Enquiry';
    }
  });
}


/* ═══════════════════════════════════════════════════════
   11. TOAST NOTIFICATION SYSTEM
   ═══════════════════════════════════════════════════════ */
function showToast(type, title, message, duration = 5500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: 'fa-circle-check',
    error:   'fa-circle-xmark',
    info:    'fa-circle-info',
    warning: 'fa-triangle-exclamation',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} toast-icon" aria-hidden="true"></i>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Dismiss">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
  });

  toast._timer = setTimeout(() => dismissToast(toast), duration);
}

function dismissToast(toast) {
  clearTimeout(toast._timer);
  toast.classList.remove('toast-visible');
  toast.classList.add('toast-hiding');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}


/* ═══════════════════════════════════════════════════════
   12. BACK TO TOP BUTTON
   ═══════════════════════════════════════════════════════ */
function updateBackToTop() {
  if (backToTopBtn) backToTopBtn.classList.toggle('visible', window.scrollY > 400);
}

backToTopBtn?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* ═══════════════════════════════════════════════════════
   13. WHATSAPP FAB — hide when contact section is on screen
   ═══════════════════════════════════════════════════════ */
function updateWhatsappFab() {
  if (!whatsappFab) return;
  const contact = document.getElementById('contact');
  if (!contact) return;
  const rect = contact.getBoundingClientRect();
  const onScreen = rect.top < window.innerHeight && rect.bottom > 0;
  whatsappFab.classList.toggle('fab-hidden', onScreen);
}


/* ═══════════════════════════════════════════════════════
   14. LIVE OPEN / CLOSED STATUS  (EAT = UTC+3)
       Mon–Sat 07:30–18:00
   ═══════════════════════════════════════════════════════ */
(function showOpenStatus() {
  const el = document.getElementById('open-status');
  if (!el) return;

  const now = new Date();
  const eatDate = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60000);

  const day     = eatDate.getDay();   // 0=Sun
  const timeVal = eatDate.getHours() * 60 + eatDate.getMinutes();
  const openMin  = 7 * 60 + 30;      // 07:30
  const closeMin = 18 * 60;          // 18:00

  const isWeekday = day >= 1 && day <= 6;
  const isOpen    = isWeekday && timeVal >= openMin && timeVal < closeMin;

  let extra = '';
  if (isOpen) {
    const minsLeft = closeMin - timeVal;
    if (minsLeft <= 60) extra = ` · Closes in ${minsLeft} min`;
  }

  el.innerHTML = isOpen
    ? `<span class="status-badge status-open"><i class="fa-solid fa-circle" aria-hidden="true"></i> Open now${extra}</span>`
    : `<span class="status-badge status-closed"><i class="fa-solid fa-circle" aria-hidden="true"></i> Currently closed</span>`;
})();


/* ═══════════════════════════════════════════════════════
   15. ICON & BUTTON ANIMATION OBSERVER
   ═══════════════════════════════════════════════════════ */
(function initIconAnimations() {
  const btn = document.getElementById('enquiry-submit');
  if (!btn) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  obs.observe(btn);
})();


/* ═══════════════════════════════════════════════════════
   MASTER SCROLL HANDLER (batched via rAF)
   ═══════════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateProgress();
      updateNavActive();
      updateNavBackground();
      updateParallax();
      updateBackToTop();
      updateWhatsappFab();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });


/* ═══════════════════════════════════════════════════════
   16. LAZY GOOGLE MAPS (IntersectionObserver)
   ═══════════════════════════════════════════════════════ */
(function initLazyMaps() {
  const frames = document.querySelectorAll('iframe[data-src]');
  if (!frames.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const iframe = entry.target;
      iframe.src = iframe.dataset.src;
      obs.unobserve(iframe);
    });
  }, { rootMargin: '200px' });
  frames.forEach(f => obs.observe(f));
})();


/* ═══════════════════════════════════════════════════════
   17. SERVICE WORKER REGISTRATION
   ═══════════════════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        // If a new SW takes control (new version activated), reload once
        // so the page picks up fresh assets without a manual hard refresh.
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (sessionStorage.getItem('sw-reloaded')) return;
          sessionStorage.setItem('sw-reloaded', '1');
          window.location.reload();
        });

        // Check for an updated SW in the background
        reg.update().catch(() => {});
      })
      .catch(err => console.warn('SW registration failed:', err));
  });
}


/* ═══════════════════════════════════════════════════════
   INIT ON PAGE LOAD
   ═══════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
  docHeight = getDocHeight();
  updateNavBackground();
  updateNavActive();
  updateProgress();
  updateBackToTop();
  updateWhatsappFab();
});


/* ── 18. GALLERY FILTER ── */
(function initGalleryFilter() {
  const filterBtns = document.querySelectorAll('.gallery-filter');
  if (!filterBtns.length) return;
  const items = document.querySelectorAll('.gallery-item');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      items.forEach(item => {
        const match = cat === 'all' || item.dataset.category === cat;
        item.style.display = match ? '' : 'none';
      });
    });
  });
})();

/* ── 19. GALLERY LIGHTBOX ──
   Generalized to open either the filterable grid or an arbitrary
   set of {src, alt, cat, title} items (used by the before/after
   restoration cards below). Exposed as window.TAQGallery.open().
   Also handles touch swipe navigation and double-tap/double-click
   zoom on the open image. */
(function initGalleryLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  if (!lightbox) return;
  const lbWrap  = lightbox.querySelector('.lb-img-wrap');
  const lbImg   = document.getElementById('lb-img');
  const lbCat   = document.getElementById('lb-cat');
  const lbTitle = document.getElementById('lb-title');
  const lbClose = document.getElementById('lb-close');
  const lbPrev  = document.getElementById('lb-prev');
  const lbNext  = document.getElementById('lb-next');
  const lbShare = document.getElementById('lb-share');

  let items = [];
  let current = 0;

  // Zoom/pan state for the open image
  let zoomed = false;
  let panX = 0, panY = 0;

  function itemsFromGrid() {
    return Array.from(document.querySelectorAll('.gallery-item'))
      .filter(el => el.style.display !== 'none')
      .map(el => {
        const img = el.querySelector('img');
        return { src: img.src, alt: img.alt, cat: el.dataset.cat || '', title: el.dataset.title || '' };
      });
  }

  function resetZoom() {
    zoomed = false;
    panX = 0;
    panY = 0;
    lbImg.style.transform = '';
    lbImg.classList.remove('zoomed');
  }

  function toggleZoom() {
    zoomed = !zoomed;
    if (zoomed) {
      lbImg.classList.add('zoomed');
    } else {
      resetZoom();
    }
  }

  function open(list, idx) {
    items = list;
    current = idx;
    show(current);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lbImg.src = '';
    resetZoom();
  }

  function show(idx) {
    const item = items[idx];
    if (!item) return;
    resetZoom();
    lbImg.src = item.src;
    lbImg.alt = item.alt || '';
    lbCat.textContent   = item.cat   || '';
    lbTitle.textContent = item.title || '';
    if (lbShare) lbShare.dataset.shareItem = JSON.stringify(item);
  }

  function goPrev() { current = (current - 1 + items.length) % items.length; show(current); }
  function goNext() { current = (current + 1) % items.length; show(current); }

  // Open from expand button or click on a grid item
  document.querySelectorAll('.gallery-item').forEach((item) => {
    const openLightbox = (e) => {
      e.stopPropagation();
      const visArr = Array.from(document.querySelectorAll('.gallery-item')).filter(x => x.style.display !== 'none');
      const idx = visArr.indexOf(item);
      if (idx !== -1) open(itemsFromGrid(), idx);
    };
    const expandBtn = item.querySelector('.gallery-expand');
    if (expandBtn) expandBtn.addEventListener('click', openLightbox);
    item.addEventListener('click', openLightbox);
  });

  lbClose.addEventListener('click', close);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });

  lbPrev.addEventListener('click', goPrev);
  lbNext.addEventListener('click', goNext);

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft')  goPrev();
    if (e.key === 'ArrowRight') goNext();
  });

  // Touch/mouse swipe-to-navigate + drag-to-pan when zoomed + double-tap zoom
  if (lbWrap) {
    let dragging = false;
    let startX = 0, startY = 0, panStartX = 0, panStartY = 0;
    let lastTapTime = 0;

    lbWrap.addEventListener('pointerdown', e => {
      dragging = true;
      lbWrap.setPointerCapture(e.pointerId);
      if (zoomed) {
        panStartX = e.clientX - panX;
        panStartY = e.clientY - panY;
      } else {
        startX = e.clientX;
        startY = e.clientY;
      }
    });

    lbWrap.addEventListener('pointermove', e => {
      if (!dragging) return;
      if (zoomed) {
        panX = e.clientX - panStartX;
        panY = e.clientY - panStartY;
        lbImg.style.transform = `scale(2) translate(${panX / 2}px, ${panY / 2}px)`;
      } else {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > Math.abs(dy)) {
          lbWrap.style.transform = `translateX(${dx}px)`;
          lbWrap.style.opacity = String(1 - Math.min(Math.abs(dx) / 400, 0.5));
        }
      }
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;

      if (zoomed) return;

      const dx = e.clientX - startX;
      lbWrap.style.transform = '';
      lbWrap.style.opacity = '';
      if (Math.abs(dx) > 60) {
        if (dx > 0) goPrev(); else goNext();
        return;
      }

      // Treat a near-stationary tap/click as a possible double-tap zoom toggle
      if (Math.abs(dx) < 10) {
        const now = Date.now();
        if (now - lastTapTime < 300) toggleZoom();
        lastTapTime = now;
      }
    }

    lbWrap.addEventListener('pointerup', endDrag);
    lbWrap.addEventListener('pointercancel', () => {
      dragging = false;
      lbWrap.style.transform = '';
      lbWrap.style.opacity = '';
    });
  }

  // Share the open photo — native share sheet (with the image file, where
  // supported) first, falling back to a WhatsApp text+link share.
  async function shareCurrentItem() {
    let item = {};
    try { item = JSON.parse(lbShare.dataset.shareItem || '{}'); } catch (e) { /* ignore */ }
    if (!item.src) return;

    const pageUrl = window.location.href.split('#')[0];
    const shareText = item.title ? `${item.title} — Turquoise Auto Centre` : 'Turquoise Auto Centre';

    if (navigator.share) {
      let shareData = { title: shareText, text: shareText, url: pageUrl };
      try {
        if (navigator.canShare) {
          const res = await fetch(item.src);
          const blob = await res.blob();
          const file = new File([blob], 'repair-photo.jpg', { type: blob.type || 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            shareData = { title: shareText, text: shareText, files: [file] };
          }
        }
      } catch (fetchErr) { /* keep the link-only shareData */ }

      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // user dismissed the share sheet
        // otherwise fall through to the WhatsApp fallback below
      }
    }

    const waText = encodeURIComponent(`${shareText}\n${pageUrl}`);
    window.open(`https://wa.me/?text=${waText}`, '_blank', 'noopener');
  }

  if (lbShare) lbShare.addEventListener('click', shareCurrentItem);

  window.TAQGallery = { open };
})();

/* ── 20. BEFORE / AFTER RESTORATION SLIDERS ── */
(function initBeforeAfterSliders() {
  const sliders = document.querySelectorAll('[data-ba-slider]');
  if (!sliders.length) return;

  sliders.forEach(slider => {
    const before = slider.querySelector('.ba-slider-before');
    const handle = slider.querySelector('.ba-slider-handle');
    let dragging = false;

    function setPosition(clientX) {
      const rect = slider.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left = `${pct}%`;
      slider.setAttribute('aria-valuenow', Math.round(pct));
    }

    slider.addEventListener('pointerdown', e => {
      dragging = true;
      slider.setPointerCapture(e.pointerId);
      setPosition(e.clientX);
    });
    slider.addEventListener('pointermove', e => {
      if (!dragging) return;
      setPosition(e.clientX);
    });
    ['pointerup', 'pointercancel'].forEach(evt => {
      slider.addEventListener(evt, () => { dragging = false; });
    });

    slider.addEventListener('keydown', e => {
      const rect = slider.getBoundingClientRect();
      const current = parseFloat(handle.style.left) || 50;
      if (e.key === 'ArrowLeft')  { setPosition(rect.left + (rect.width * Math.max(0, current - 5) / 100)); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setPosition(rect.left + (rect.width * Math.min(100, current + 5) / 100)); e.preventDefault(); }
    });
  });
})();

/* ── 21. RESTORATION CARD THUMBNAILS & EXPAND → SHARED LIGHTBOX ── */
(function initRestoreThumbs() {
  const cards = document.querySelectorAll('.restore-card');
  if (!cards.length) return;

  cards.forEach(card => {
    const thumbs = Array.from(card.querySelectorAll('.restore-thumb'));
    if (!thumbs.length) return;

    const items = thumbs.map(t => ({
      src: t.dataset.src,
      alt: t.dataset.alt || '',
      cat: t.dataset.cat || '',
      title: t.dataset.title || ''
    }));

    thumbs.forEach((thumb, idx) => {
      thumb.addEventListener('click', () => {
        if (window.TAQGallery) window.TAQGallery.open(items, idx);
      });
    });

    const expandBtn = card.querySelector('[data-expand-set]');
    if (expandBtn) {
      expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
      expandBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (window.TAQGallery) window.TAQGallery.open(items, 0);
      });
    }
  });
})();

/* ── 22. CROSSFADE SLIDESHOW (completed-repair showcase) ── */
(function initBaFade() {
  const fades = document.querySelectorAll('[data-ba-fade]');
  if (!fades.length) return;

  fades.forEach(fade => {
    const imgs = fade.querySelectorAll('.ba-fade-img');
    if (imgs.length < 2) return;
    let idx = 0;
    setInterval(() => {
      imgs[idx].classList.remove('active');
      idx = (idx + 1) % imgs.length;
      imgs[idx].classList.add('active');
    }, 3500);
  });
})();

/* ── 23. IMAGE LOADING SKELETON ──
   Shows a shimmer (see .img-shimmer keyframes in styles.css) behind each
   before/after slider, fade showcase and thumbnail until its image(s)
   finish loading, then stops the animation. */
(function initImageSkeletons() {
  const containers = document.querySelectorAll('.ba-slider, .ba-fade, .restore-thumb');
  if (!containers.length) return;

  containers.forEach(container => {
    const imgs = Array.from(container.querySelectorAll('img'));
    if (!imgs.length) return;
    let pending = imgs.length;

    function markLoaded() {
      pending -= 1;
      if (pending <= 0) container.classList.add('img-loaded');
    }

    imgs.forEach(img => {
      if (img.complete && img.naturalWidth > 0) {
        markLoaded();
      } else {
        img.addEventListener('load', markLoaded, { once: true });
        img.addEventListener('error', markLoaded, { once: true });
      }
    });
  });
})();