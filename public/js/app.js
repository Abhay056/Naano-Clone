// Naano.com Interactive Engine
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initQuoteScrollReveal();
  initFaqAccordion();
  initVideoModal();
  initAuthModal();
  initBookingModal();
  initLanguageSwitcher();
  initResourcesDropdown();
  initMobileMenu();
  initJourneyInteractions();
});

// Toast Helper
window.showToast = function(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'naano-toast';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00B67A" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
};

// 1. Navbar Scroll Effect
function initNavbar() {
  const nav = document.getElementById('naano-nav');
  if (!nav) return;

  const handleScroll = () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

// 2. David Zmirov Quote Word-by-Word Scroll Reveal
function initQuoteScrollReveal() {
  const quoteWords = document.querySelectorAll('blockquote span[data-qw]');
  if (!quoteWords.length) return;

  const quoteSection = document.querySelector('[data-screen-label="Quote"]');
  if (!quoteSection) return;

  const onScroll = () => {
    const rect = quoteSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Calculate progress through quote section
    const startOffset = windowHeight * 0.75;
    const totalDist = rect.height;
    const currentDist = startOffset - rect.top;
    const progress = Math.min(Math.max(currentDist / totalDist, 0), 1);

    const activeIndex = Math.floor(progress * quoteWords.length);

    quoteWords.forEach((span, index) => {
      if (index <= activeIndex) {
        span.style.opacity = '1';
      } else {
        span.style.opacity = '0.14';
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// 3. FAQ Accordion
function initFaqAccordion() {
  // Select all FAQ question elements
  const faqQuestions = document.querySelectorAll('[data-screen-label="FAQ"] button, [data-screen-label="FAQ"] summary, .lp-faq-item, [data-faq-item]');
  
  // Also look for buttons inside FAQ section
  const faqSection = document.querySelector('[data-screen-label="FAQ"]');
  if (!faqSection) return;

  const buttons = faqSection.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const parent = btn.closest('[data-faq-item]') || btn.parentElement;
      const answer = parent ? parent.querySelector('[data-faq-answer], p, div[style*="max-height"]') : null;
      
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !isExpanded);

      if (answer) {
        if (!isExpanded) {
          answer.style.display = 'block';
          answer.style.maxHeight = '500px';
          answer.style.opacity = '1';
        } else {
          answer.style.display = 'none';
        }
      }
    });
  });
}

// 4. Video Modal (BlogSEO Case Study)
function initVideoModal() {
  const modal = document.getElementById('videoModal');
  const closeBtn = document.getElementById('closeVideoModal');
  const video = document.getElementById('caseStudyVideo');
  if (!modal || !video) return;

  // Triggers for video modal: Case study chips, video poster, or CTA
  const triggers = document.querySelectorAll('.cs-chip, a[href*="case-studies"], .lp-video-trigger, [src*="blogseo-vincent-video-poster"]');
  triggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
      video.play().catch(() => {});
    });
  });

  const closeModal = () => {
    modal.classList.remove('active');
    video.pause();
  };

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

// 5. Auth Modal (Sign In / Sign Up)
function initAuthModal() {
  const modal = document.getElementById('authModal');
  const closeBtn = document.getElementById('closeAuthModal');
  if (!modal) return;

  // Triggers
  const signinTriggers = document.querySelectorAll('a[href*="login"], a[href*="signin"]');
  const signupTriggers = document.querySelectorAll('a[href*="register"], a[href*="signup"], .lp-hero-primary');

  const openAuth = (tabName) => {
    modal.classList.add('active');
    switchAuthTab(tabName);
  };

  signinTriggers.forEach(t => {
    t.addEventListener('click', (e) => {
      e.preventDefault();
      openAuth('signin');
    });
  });

  signupTriggers.forEach(t => {
    t.addEventListener('click', (e) => {
      e.preventDefault();
      openAuth('signup');
    });
  });

  const closeModal = () => modal.classList.remove('active');
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Tab buttons
  const tabBtns = modal.querySelectorAll('.auth-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchAuthTab(btn.dataset.tab);
    });
  });

  function switchAuthTab(tabName) {
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    document.getElementById('signinTab')?.classList.toggle('active', tabName === 'signin');
    document.getElementById('signupTab')?.classList.toggle('active', tabName === 'signup');
  }

  window.handleAuthSubmit = function(type) {
    modal.classList.remove('active');
    if (type === 'signin') {
      window.showToast('Signed in successfully! Redirecting to creator marketplace...');
    } else {
      window.showToast('Account created! Welcome to Naano B2B Marketplace.');
    }
  };
}

// 6. Booking Modal
function initBookingModal() {
  const modal = document.getElementById('bookingModal');
  const closeBtn = document.getElementById('closeBookingModal');
  if (!modal) return;

  // Set default date to tomorrow
  const dateInput = document.getElementById('callDate');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
  }

  // Time slot toggle
  const timeBtns = modal.querySelectorAll('.time-slot-btn');
  timeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      timeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Triggers
  const triggers = document.querySelectorAll('a[href*="book-a-call"], [data-screen-label="Book a call"] button, [data-screen-label="Book a call"] a');
  triggers.forEach(t => {
    t.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });
  });

  const closeModal = () => modal.classList.remove('active');
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  window.handleBookingSubmit = function() {
    modal.classList.remove('active');
    window.showToast('Strategy call confirmed! Calendar invite sent to your email.');
  };
}

// 7. Language Switcher
function initLanguageSwitcher() {
  const langBtn = document.querySelector('button[aria-label="Switch language"]');
  if (!langBtn) return;

  const languages = ['EN', 'FR', 'DE', 'ES'];
  let currentIdx = 0;

  langBtn.addEventListener('click', (e) => {
    e.preventDefault();
    currentIdx = (currentIdx + 1) % languages.length;
    const label = langBtn.querySelector('span span');
    if (label) {
      label.textContent = languages[currentIdx];
      window.showToast(`Locale switched to ${languages[currentIdx]}`);
    }
  });
}

// 8. Resources Dropdown
function initResourcesDropdown() {
  const group = document.querySelector('.lp-nav-group');
  if (!group) return;

  // Create dropdown if not present
  if (!group.querySelector('.lp-nav-dropdown')) {
    const dropdown = document.createElement('div');
    dropdown.className = 'lp-nav-dropdown';
    dropdown.innerHTML = `
      <a href="#how-it-works" class="lp-dropdown-item">How it works</a>
      <a href="#what-people-think" class="lp-dropdown-item">Case Studies</a>
      <a href="#pricing" class="lp-dropdown-item">Pricing & Plans</a>
      <a href="#faq" class="lp-dropdown-item">Knowledge Base & FAQ</a>
      <a href="#book-a-call" class="lp-dropdown-item">Schedule Demo Call</a>
    `;
    group.appendChild(dropdown);
  }

  const trigger = group.querySelector('.lp-nav-group-trigger');
  trigger?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dd = group.querySelector('.lp-nav-dropdown');
    dd?.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    group.querySelector('.lp-nav-dropdown')?.classList.remove('active');
  });
}

// 9. Mobile Burger Menu
function initMobileMenu() {
  const burger = document.querySelector('.lp-nav-burger');
  const menu = document.querySelector('.lp-nav-menu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    const isOpen = menu.getAttribute('data-open') === 'true';
    menu.setAttribute('data-open', !isOpen);
    menu.style.display = !isOpen ? 'block' : 'none';
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.setAttribute('data-open', 'false');
      menu.style.display = 'none';
    });
  });
}

// 10. Interactive Journey Cards (Brand Platform)
function initJourneyInteractions() {
  const cards = document.querySelectorAll('[data-brand-animate]');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-3px)';
      card.style.borderColor = '#2563EB';
      card.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.12)';
      card.style.transition = 'all 0.2s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.borderColor = '#EDEBE7';
      card.style.boxShadow = 'none';
    });
  });
}
