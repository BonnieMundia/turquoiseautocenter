/* ============================================================
   TURQUOISE AUTO CENTRE LTD — main.js
   Modules:
     1. Theme Toggle (Dark / Light)
     2. Hamburger Menu
     3. Scroll Progress Bar
     4. Nav Active Link & Background
     5. Scroll Reveal (Intersection Observer)
     6. Hero Parallax Grid
     7. Service Tabs
     8. FAQ Accordion
   ============================================================ */

/* ─────────────────────────────────────────────
   1. THEME TOGGLE
   Persists preference in localStorage.
   Toggles .light class on <body>.
───────────────────────────────────────────── */
const themeToggleBtn = document.getElementById('theme-toggle');
const THEME_KEY = 'tac-theme';

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light');
    themeToggleBtn.textContent = '☀️';
    themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
  } else {
    document.body.classList.remove('light');
    themeToggleBtn.textContent = '🌙';
    themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
}

themeToggleBtn.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('light');
  const next = isDark ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

initTheme();


/* ─────────────────────────────────────────────
   2. HAMBURGER MENU
   Toggles mobile drawer open/closed.
   Closes on outside click or nav link click.
───────────────────────────────────────────── */
const hamburger    = document.getElementById('hamburger');
const mobileMenu   = document.getElementById('mobile-menu');
const mobileLinks  = mobileMenu.querySelectorAll('a');

function openMenu() {
  hamburger.classList.add('open');
  mobileMenu.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden'; // prevent background scroll
}

function closeMenu() {
  hamburger.classList.remove('open');
  mobileMenu.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.contains('open');
  isOpen ? closeMenu() : openMenu();
});

// Close when a nav link is tapped
mobileLinks.forEach(link => {
  link.addEventListener('click', closeMenu);
});

// Close when clicking outside the menu
document.addEventListener('click', (e) => {
  if (
    mobileMenu.classList.contains('open') &&
    !mobileMenu.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    closeMenu();
  }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});


/* ─────────────────────────────────────────────
   3. SCROLL PROGRESS BAR
   Thin gradient bar at the very top of viewport.
───────────────────────────────────────────── */
const progressBar = document.getElementById('scroll-progress');

function updateProgress() {
  const scrollTop  = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
  const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}


/* ─────────────────────────────────────────────
   4. NAV: ACTIVE LINK & BACKGROUND
   Highlights the correct nav link as you scroll.
   Solidifies nav background after 60px scroll.
───────────────────────────────────────────── */
const navEl       = document.querySelector('nav');
const NAV_SECTIONS = ['home', 'services', 'pricing', 'faq', 'about', 'contact'];

function updateNavActive() {
  const pos = window.scrollY + 110;

  NAV_SECTIONS.forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;

    const top    = section.offsetTop;
    const bottom = top + section.offsetHeight;

    if (pos >= top && pos < bottom) {
      // Desktop links
      document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
      const desktopLink = document.querySelector(`.nav-links a[href="#${id}"]`);
      if (desktopLink) desktopLink.classList.add('active');

      // Mobile links
      document.querySelectorAll('#mobile-menu a').forEach(a => a.classList.remove('active'));
      const mobileLink = document.querySelector(`#mobile-menu a[href="#${id}"]`);
      if (mobileLink) mobileLink.classList.add('active');
    }
  });
}

function updateNavBackground() {
  if (window.scrollY > 60) {
    navEl.classList.add('scrolled');
  } else {
    navEl.classList.remove('scrolled');
  }
}


/* ─────────────────────────────────────────────
   5. SCROLL REVEAL (INTERSECTION OBSERVER)
   Watches .reveal elements and adds .visible
   when they enter the viewport.
   Price cards also trigger their row animations.
───────────────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    entry.target.classList.add('visible');

    // Heading-wipe underline should stay active — don't unobserve
    if (!entry.target.classList.contains('heading-wipe')) {
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -48px 0px'
});

function observeRevealElements() {
  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });
}

observeRevealElements();


/* ─────────────────────────────────────────────
   6. HERO PARALLAX GRID
   Subtle vertical shift of the background grid
   as user scrolls, creating a depth effect.
───────────────────────────────────────────── */
const heroGrid = document.querySelector('.hero-grid');

function updateParallax() {
  if (heroGrid && window.scrollY < window.innerHeight) {
    heroGrid.style.transform = `translateY(${window.scrollY * 0.3}px)`;
  }
}


/* ─────────────────────────────────────────────
   MASTER SCROLL HANDLER (batched via rAF)
   All scroll-dependent functions run here in
   one requestAnimationFrame to avoid jank.
───────────────────────────────────────────── */
let ticking = false;

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateProgress();
      updateNavActive();
      updateNavBackground();
      updateParallax();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });


/* ─────────────────────────────────────────────
   7. SERVICE TABS
   Shows the selected tab panel and re-triggers
   scroll reveal animations for its cards.
───────────────────────────────────────────── */
const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

function showTab(id, clickedBtn) {
  // Hide all panels & deactivate all buttons
  tabPanels.forEach(p => p.classList.remove('active'));
  tabBtns.forEach(b => b.classList.remove('active'));

  // Show selected panel & activate button
  const panel = document.getElementById('tab-' + id);
  if (!panel) return;

  panel.classList.add('active');
  clickedBtn.classList.add('active');

  // Re-animate cards inside the newly shown tab
  panel.querySelectorAll('.reveal').forEach(el => {
    el.classList.remove('visible');
    // Small delay so the browser registers the class removal
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.classList.add('visible');
      }, 60);
    });
  });
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');
    showTab(tabId, btn);
  });
});


/* ─────────────────────────────────────────────
   8. FAQ ACCORDION
   One item open at a time.
   Smooth height animation via max-height.
───────────────────────────────────────────── */
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');

  question.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    // Close all items first
    faqItems.forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });

    // If clicked item was closed, open it
    if (!isOpen) {
      item.classList.add('open');
      question.setAttribute('aria-expanded', 'true');
    }
  });
});


/* ─────────────────────────────────────────────
   INIT ON PAGE LOAD
───────────────────────────────────────────── */
window.addEventListener('load', () => {
  updateNavBackground();
  updateNavActive();
  updateProgress();
});
