// InstaPump Landing Page Scripts

(function() {
  'use strict';

  // ============================================
  // ROTATING HEROES
  // ============================================

  const heroes = [
    {
      headline: "We don't negotiate with algorithms.",
      subline: "See only creators you choose. Skip the rest automatically."
    },
    {
      headline: "Instagram's algorithm uses 1,000+ signals to keep you hooked.",
      subline: "We use 1: your choice."
    },
    {
      headline: "My attention isn't for sale.",
      subline: "Join the Algorithm Atheists who took their feed back."
    },
    {
      headline: "You're not watching what you want.",
      subline: "You're watching what the algorithm wants you to want."
    },
    {
      headline: "The algorithm's job is to keep you scrolling.",
      subline: "Our job is to set you free."
    }
  ];

  // Get or set visit counter for rotation
  function getVisitCount() {
    let count = parseInt(localStorage.getItem('instapump_visit_count') || '0', 10);
    count++;
    localStorage.setItem('instapump_visit_count', count.toString());
    return count;
  }

  // Set hero based on visit count
  function setRotatingHero() {
    const visitCount = getVisitCount();
    const heroIndex = (visitCount - 1) % heroes.length;
    const hero = heroes[heroIndex];

    const headlineEl = document.getElementById('hero-headline');
    const sublineEl = document.getElementById('hero-subline');

    if (headlineEl && sublineEl) {
      headlineEl.textContent = hero.headline;
      sublineEl.textContent = hero.subline;
    }
  }

  // ============================================
  // LIVE COUNTER FROM GITHUB
  // ============================================

  async function fetchGitHubStats() {
    try {
      const response = await fetch('https://api.github.com/repos/hyperkishore/Instapump');
      if (!response.ok) throw new Error('GitHub API error');

      const data = await response.json();

      // Calculate "people who opted out" as:
      // stars + forks + watchers (unique engagement signals)
      // This is a real number from GitHub
      const optedOut = (data.stargazers_count || 0) +
                       (data.forks_count || 0) +
                       (data.subscribers_count || 0);

      return optedOut;
    } catch (err) {
      console.log('Could not fetch GitHub stats:', err.message);
      return null;
    }
  }

  function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (target - start) * easeOutQuart);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  async function updateCounter() {
    const counterEl = document.getElementById('counter');
    if (!counterEl) return;

    const count = await fetchGitHubStats();

    if (count !== null && count > 0) {
      // Animate the counter
      animateCounter(counterEl, count);
    } else {
      // Fallback if API fails - show a message instead
      counterEl.textContent = '—';
    }
  }

  // ============================================
  // SCROLL ANIMATIONS
  // ============================================

  function setupScrollAnimations() {
    // Add fade-in class to sections
    const sections = document.querySelectorAll('section:not(.hero)');
    sections.forEach(section => {
      const content = section.querySelector('.section-content');
      if (content) {
        content.classList.add('fade-in');
      }
    });

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el);
    });
  }

  // ============================================
  // ROTATING IDENTITY STATEMENTS
  // ============================================

  const statements = [
    '"I opt out."',
    '"I choose my feed."',
    '"My attention isn\'t for sale."',
    '"I don\'t negotiate with algorithms."',
    '"I\'m not a product."',
    '"I scroll with intention."',
    '"I broke up with the algorithm."',
    '"My feed, my rules."'
  ];

  function shuffleStatements() {
    const visitCount = parseInt(localStorage.getItem('instapump_visit_count') || '1', 10);

    // Create a seeded shuffle based on visit count
    const shuffled = [...statements];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (visitCount * (i + 1) * 7) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Update the 4 statement boxes
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`statement-${i}`);
      if (el && shuffled[i - 1]) {
        el.textContent = shuffled[i - 1];
      }
    }
  }

  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================

  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // ============================================
  // PROBLEM CARDS - SHUFFLE ORDER
  // ============================================

  function shuffleProblemCards() {
    const grid = document.querySelector('.problem-grid');
    if (!grid) return;

    const cards = Array.from(grid.children);
    const visitCount = parseInt(localStorage.getItem('instapump_visit_count') || '1', 10);

    // Keep "It's invisible" (with "Until now") always last for impact
    const lastCard = cards.find(card => card.textContent.includes('Until now'));
    const otherCards = cards.filter(card => !card.textContent.includes('Until now'));

    // Shuffle other cards based on visit count
    for (let i = otherCards.length - 1; i > 0; i--) {
      const j = (visitCount * (i + 1) * 13) % (i + 1);
      [otherCards[i], otherCards[j]] = [otherCards[j], otherCards[i]];
    }

    // Clear and re-add
    grid.innerHTML = '';
    otherCards.forEach(card => grid.appendChild(card));
    if (lastCard) grid.appendChild(lastCard);
  }

  // ============================================
  // INITIALIZE
  // ============================================

  function init() {
    setRotatingHero();
    shuffleStatements();
    shuffleProblemCards();
    updateCounter();
    setupScrollAnimations();
    setupSmoothScroll();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
