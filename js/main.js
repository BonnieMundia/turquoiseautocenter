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
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = mobileMenu.querySelectorAll('a');
const desktopLinks = document.querySelectorAll('.nav-links a');
const contactSubmitBtn = document.getElementById('enquiry-submit');
const THEME_KEY = 'tac-theme';
const NAV_SECTIONS = ['home', 'services', 'pricing', 'faq', 'about', 'contact'];
const sections = NAV_SECTIONS.map(id => document.getElementById(id)).filter(Boolean);
let currentSectionId = null;
let docHeight = getDocHeight();

function getDocHeight() {
  return document.documentElement.scrollHeight - window.innerHeight;
}

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

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const next = document.body.classList.contains('light') ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

initTheme();


/* ─────────────────────────────────────────────
   2. HAMBURGER MENU
   Toggles mobile drawer open/closed.
   Closes on outside click or nav link click.
───────────────────────────────────────────── */

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
  if (!progressBar) return;
  const scrollTop = window.scrollY;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}

function updateDocDimensions() {
  docHeight = getDocHeight();
  updateProgress();
  updateParallax();
}

window.addEventListener('resize', updateDocDimensions, { passive: true });


/* ─────────────────────────────────────────────
   4. NAV: ACTIVE LINK & BACKGROUND
   Highlights the correct nav link as you scroll.
   Solidifies nav background after 60px scroll.
───────────────────────────────────────────── */
const navEl = document.querySelector('nav');

function updateNavActive() {
  const pos = window.scrollY + 110;
  let activeId = null;

  sections.forEach(section => {
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;
    if (pos >= top && pos < bottom) {
      activeId = section.id;
    }
  });

  if (activeId === currentSectionId) return;
  currentSectionId = activeId;

  desktopLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`));
  mobileLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`));
}

function updateNavBackground() {
  if (!navEl) return;
  navEl.classList.toggle('scrolled', window.scrollY > 60);
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
  tabPanels.forEach(panel => panel.classList.remove('active'));
  tabBtns.forEach(button => button.classList.remove('active'));

  const panel = document.getElementById('tab-' + id);
  if (!panel) return;

  panel.classList.add('active');
  clickedBtn.classList.add('active');

  panel.querySelectorAll('.reveal').forEach(el => {
    el.classList.remove('visible');
    void el.offsetWidth;
    el.classList.add('visible');
  });
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');
    showTab(tabId, btn);
  });
});

if (contactSubmitBtn) {
  contactSubmitBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    // Get form data
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const service = document.getElementById('service').value;
    const vehicle = document.getElementById('vehicle').value.trim();
    const details = document.getElementById('details').value.trim();

    // Basic validation
    if (!name || !phone || !service) {
      alert('Please fill in all required fields (Name, Phone, Service).');
      return;
    }

    // Disable button and show loading
    contactSubmitBtn.disabled = true;
    contactSubmitBtn.textContent = 'Sending...';

    try {
      const response = await fetch('https://usencbuaumsgmitvlznt.supabase.co/functions/v1/submit-enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          service,
          vehicle,
          details,
        }),
      });

      if (response.ok) {
        alert('Thank you! Your enquiry has been sent. We will contact you soon.');
        // Clear form
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('service').value = '';
        document.getElementById('vehicle').value = '';
        document.getElementById('details').value = '';
      } else {
        throw new Error('Failed to send enquiry');
      }
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      alert('Sorry, there was an error sending your enquiry. Please try again or contact us directly.');
    } finally {
      // Re-enable button
      contactSubmitBtn.disabled = false;
      contactSubmitBtn.textContent = '📧 Send Enquiry';
    }
  });
}


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
