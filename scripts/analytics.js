/* ============================================================
   TURQUOISE AUTO CENTRE LTD — analytics.js
   ──────────────────────────────────────────────────────────
   Modules:
     1. Cookie Consent (GDPR-gated)
     2. Google Analytics 4 loader
     3. Custom event tracking
        - Page sections viewed
        - Service tabs clicked
        - WhatsApp links clicked
        - Enquiry form submitted
        - Blog posts clicked
     4. WhatsApp Chat Bubble (8-second greeting)

   HOW TO SET UP GA4:
     1. Go to https://analytics.google.com
     2. Create a new GA4 property for turquoiseautocentre.co.ke
     3. Copy your Measurement ID (looks like G-XXXXXXXXXX)
     4. Replace 'G-XXXXXXXXXX' below with your real ID
   ============================================================ */

/* ─────────────────────────────────────────────
   CONFIGURATION — update these values
───────────────────────────────────────────── */
const GA_MEASUREMENT_ID = 'G-NBTCFBE0Q4'; // ← Replace with your real GA4 ID
const CONSENT_KEY       = 'tac-cookie-consent'; // localStorage key
const WA_SHOWN_KEY      = 'tac-wa-greeting-shown';


/* ═══════════════════════════════════════════════════════
   1. COOKIE CONSENT
   ═══════════════════════════════════════════════════════ */
const cookieBanner  = document.getElementById('cookie-banner');
const acceptBtn     = document.getElementById('cookie-accept');
const declineBtn    = document.getElementById('cookie-decline');

function getConsent() {
  return localStorage.getItem(CONSENT_KEY); // 'accepted' | 'declined' | null
}

function showBanner() {
  if (!cookieBanner) return;
  // Delay slightly so it doesn't flash on first paint
  setTimeout(() => cookieBanner.classList.add('cookie-visible'), 1200);
}

function hideBanner() {
  if (!cookieBanner) return;
  cookieBanner.classList.remove('cookie-visible');
  setTimeout(() => cookieBanner.classList.add('cookie-hidden'), 500);
}

function acceptCookies() {
  localStorage.setItem(CONSENT_KEY, 'accepted');
  hideBanner();
  loadGA();
}

function declineCookies() {
  localStorage.setItem(CONSENT_KEY, 'declined');
  hideBanner();
}

if (acceptBtn)  acceptBtn.addEventListener('click',  acceptCookies);
if (declineBtn) declineBtn.addEventListener('click',  declineCookies);

// On load: if already decided, act immediately; otherwise show banner
(function initConsent() {
  const consent = getConsent();
  if (consent === 'accepted') {
    loadGA();
  } else if (consent === 'declined') {
    // Don't load GA, don't show banner
  } else {
    // First visit — show banner
    showBanner();
  }
})();


/* ═══════════════════════════════════════════════════════
   2. GOOGLE ANALYTICS 4 LOADER
   ═══════════════════════════════════════════════════════ */
let gaLoaded = false;

function loadGA() {
  if (gaLoaded) return;
  gaLoaded = true;
  // GA already loaded by the inline script in index.html
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };

  // Inject gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src   = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Init dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    // Anonymise IPs for GDPR
    anonymize_ip: true,
    // Send page_view automatically
    send_page_view: true,
    // Cookie settings
    cookie_flags: 'SameSite=None;Secure',
  });

  console.log('[Analytics] GA4 loaded:', GA_MEASUREMENT_ID);

  // Now set up event tracking
  initTracking();
}

function trackEvent(eventName, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}


/* ═══════════════════════════════════════════════════════
   3. CUSTOM EVENT TRACKING
   ═══════════════════════════════════════════════════════ */
function initTracking() {

  // ── 3a. Section views (which parts of the page are seen) ──
  const trackedSections = new Set();
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !trackedSections.has(entry.target.id)) {
        trackedSections.add(entry.target.id);
        trackEvent('section_viewed', {
          section_name: entry.target.id,
          event_category: 'engagement',
        });
      }
    });
  }, { threshold: 0.3 });

  ['home','services','pricing','faq','about','blog','contact'].forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });

  // ── 3b. Service tab clicks ──
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      trackEvent('service_tab_click', {
        tab_name:       btn.getAttribute('data-tab'),
        event_category: 'services',
        event_label:    btn.textContent.trim(),
      });
    });
  });

  // ── 3c. WhatsApp link clicks ──
  document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
    link.addEventListener('click', () => {
      trackEvent('whatsapp_click', {
        event_category: 'contact',
        event_label:    link.id || link.className || 'whatsapp_link',
      });
    });
  });

  // ── 3d. Phone number clicks ──
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
      trackEvent('phone_call_click', {
        event_category: 'contact',
        event_label:    link.href,
      });
    });
  });

  // ── 3e. Enquiry form submission ──
  const form = document.getElementById('enquiry-submit');
  if (form) {
    form.addEventListener('click', () => {
      const service = document.getElementById('service')?.value || 'unknown';
      trackEvent('enquiry_submitted', {
        event_category: 'conversion',
        service_selected: service,
      });
    });
  }

  // ── 3f. Blog post clicks ──
  document.querySelectorAll('.blog-read-more').forEach(link => {
    link.addEventListener('click', () => {
      const title = link.closest('.blog-card')?.querySelector('h3')?.textContent || 'unknown';
      trackEvent('blog_post_click', {
        event_category: 'blog',
        post_title:     title,
      });
    });
  });

  // ── 3g. Scroll depth milestones ──
  const depths = new Set();
  window.addEventListener('scroll', () => {
    const pct = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    [25, 50, 75, 90].forEach(milestone => {
      if (pct >= milestone && !depths.has(milestone)) {
        depths.add(milestone);
        trackEvent('scroll_depth', {
          event_category: 'engagement',
          depth_percent:  milestone,
        });
      }
    });
  }, { passive: true });
}


/* ═══════════════════════════════════════════════════════
   4. WHATSAPP CHAT BUBBLE
      - Greeting pops up after 8 seconds (once per session)
      - Toggle button opens/closes the card
      - Badge disappears once opened
   ═══════════════════════════════════════════════════════ */
(function initWAChatBubble() {
  const bubble   = document.getElementById('wa-chat-bubble');
  const greeting = document.getElementById('wa-greeting');
  const toggle   = document.getElementById('wa-toggle');
  const closeBtn = document.getElementById('wa-greeting-close');
  const badge    = document.getElementById('wa-badge');

  if (!bubble || !greeting || !toggle) return;

  let greetingOpen = false;

  function openGreeting() {
    greeting.classList.add('wa-greeting-visible');
    greeting.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('wa-open');
    if (badge) badge.classList.add('wa-badge-hidden');
    greetingOpen = true;
    // Track
    trackEvent('wa_chat_bubble_opened', { event_category: 'engagement' });
  }

  function closeGreeting() {
    greeting.classList.remove('wa-greeting-visible');
    greeting.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('wa-open');
    greetingOpen = false;
  }

  // Toggle on button click
  toggle.addEventListener('click', () => {
    greetingOpen ? closeGreeting() : openGreeting();
  });

  // Close on X
  if (closeBtn) closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeGreeting();
    sessionStorage.setItem(WA_SHOWN_KEY, 'true');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (greetingOpen && !bubble.contains(e.target)) closeGreeting();
  });

  // Auto-show greeting after 8 seconds (once per session)
  const alreadyShown = sessionStorage.getItem(WA_SHOWN_KEY);
  if (!alreadyShown) {
    setTimeout(() => {
      openGreeting();
      sessionStorage.setItem(WA_SHOWN_KEY, 'true');
    }, 8000);
  } else {
    // Already shown this session — just show the button quietly (no badge)
    if (badge) badge.classList.add('wa-badge-hidden');
  }

  // Hide chat bubble when contact section is on screen
  // (already handled by whatsapp-fab logic in main.js but we mirror it for the bubble)
  const contactEl = document.getElementById('contact');
  if (contactEl) {
    const contactObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        bubble.classList.toggle('wa-bubble-hidden', e.isIntersecting);
        if (e.isIntersecting && greetingOpen) closeGreeting();
      });
    }, { threshold: 0.2 });
    contactObs.observe(contactEl);
  }
})();