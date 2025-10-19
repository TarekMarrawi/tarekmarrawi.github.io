(function () {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const sectionNav = document.querySelector('.section-nav');
  const primaryNav = document.querySelector('.primary-nav');
  const projectsGrid = document.getElementById('projects-grid');
  const projectsFallback = document.getElementById('projects-fallback');
  const template = document.getElementById('project-card-template');
  const currentYearEl = document.getElementById('current-year');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const sections = Array.from(document.querySelectorAll('main section, footer#contact'));

  const THEME_KEY = 'tarekmarrawi-theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const state = {
    projects: [],
    activeFilter: 'all'
  };

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeToggle?.setAttribute('aria-pressed', theme === 'dark');
    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    themeToggle?.setAttribute('aria-label', label);
    const textNode = themeToggle?.querySelector('.theme-toggle__text');
    if (textNode) textNode.textContent = label;
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || (prefersDark.matches ? 'dark' : 'light');
    setTheme(theme);
  }

  function toggleTheme() {
    const current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(current);
  }

  function createTechBadge(text) {
    const li = document.createElement('li');
    li.textContent = text;
    return li;
  }

  function createLink(label, href) {
    const link = document.createElement('a');
    link.className = 'project-card__link';
    link.textContent = label;
    if (!href || href === '#' || href === 'coming-soon') {
      link.setAttribute('aria-disabled', 'true');
      link.tabIndex = -1;
    } else {
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener';
    }
    return link;
  }

  function renderProjects() {
    if (!projectsGrid) return;
    projectsGrid.innerHTML = '';
    const filtered = state.projects.filter((project) => {
      if (state.activeFilter === 'all') return true;
      return project.tags.some((tag) => tag.toLowerCase() === state.activeFilter.toLowerCase());
    });

    if (filtered.length === 0) {
      projectsFallback.hidden = false;
      projectsFallback.textContent = 'No projects match this focus yet. Try another filter.';
      return;
    }

    projectsFallback.hidden = true;

    filtered.forEach((project) => {
      const card = template.content.firstElementChild.cloneNode(true);
      const image = card.querySelector('img');
      const tags = card.querySelector('.project-card__tags');
      const title = card.querySelector('.project-card__title');
      const summary = card.querySelector('.project-card__summary');
      const description = card.querySelector('.project-card__description');
      const techList = card.querySelector('.project-card__tech');
      const impact = card.querySelector('.project-card__impact');
      const links = card.querySelector('.project-card__links');
      const status = card.querySelector('.project-card__status');

      image.src = project.image || 'assets/placeholder-project.svg';
      image.alt = `Illustration for ${project.title}`;
      tags.textContent = project.tags.join(' · ');
      title.textContent = project.title;
      summary.textContent = project.summary;
      description.textContent = project.description;
      impact.textContent = project.impact;

      techList.innerHTML = '';
      project.tech.forEach((item) => techList.appendChild(createTechBadge(item)));

      links.innerHTML = '';
      const linkLabels = {
        demo: 'Demo',
        code: 'Code',
        writeup: 'Write-up'
      };
      let hasLiveLink = false;
      Object.entries(linkLabels).forEach(([key, label]) => {
        const href = project.links?.[key];
        const linkEl = createLink(label, href);
        if (href && href !== 'coming-soon' && href !== '#') {
          hasLiveLink = true;
        }
        links.appendChild(linkEl);
      });

      if (project.status === 'coming-soon' || !hasLiveLink) {
        status.hidden = false;
      }

      card.dataset.tags = project.tags.join(',');
      projectsGrid.appendChild(card);
    });
  }

  function setActiveFilter(filter) {
    state.activeFilter = filter;
    filterButtons.forEach((btn) => {
      const isActive = btn.dataset.filter === filter;
      btn.classList.toggle('is-active', isActive);
      if (isActive) {
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.removeAttribute('aria-pressed');
      }
    });
    renderProjects();
  }

  function initFilters() {
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter || 'all';
        setActiveFilter(filter);
      });
    });
  }

  function fetchProjects() {
    if (!projectsGrid || !template) return;
    fetch('projects.json')
      .then((response) => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then((data) => {
        state.projects = Array.isArray(data) ? data.slice(0, 12) : [];
        if (!state.projects.length) {
          throw new Error('No projects available');
        }
        renderProjects();
      })
      .catch(() => {
        projectsFallback.hidden = false;
        projectsFallback.textContent = 'Unable to load projects right now. Please try again later.';
      });
  }

  function updateActiveNav(entries) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      const navLinks = document.querySelectorAll(`[href="#${id}"]`);
      [...navLinks].forEach((link) => {
        const nav = link.closest('nav');
        if (!nav) return;
        nav.querySelectorAll('a').forEach((a) => a.classList.remove('is-active'));
        link.classList.add('is-active');
      });
    });
  }

  function initObserver() {
    const observer = new IntersectionObserver(updateActiveNav, {
      threshold: 0.5
    });
    sections.forEach((section) => observer.observe(section));
  }

  function initSmoothNav(nav) {
    if (!nav) return;
    nav.addEventListener('click', (event) => {
      const target = event.target;
      if (target instanceof HTMLAnchorElement && target.hash.startsWith('#')) {
        const section = document.querySelector(target.hash);
        if (section) {
          event.preventDefault();
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          section.focus({ preventScroll: true });
        }
      }
    });
  }

  function init() {
    initTheme();
    themeToggle?.addEventListener('click', toggleTheme);
    prefersDark.addEventListener('change', (event) => {
      if (!localStorage.getItem(THEME_KEY)) {
        setTheme(event.matches ? 'dark' : 'light');
      }
    });
    sections.forEach((section) => {
      if (!section.hasAttribute('tabindex')) {
        section.setAttribute('tabindex', '-1');
      }
    });
    if (currentYearEl) currentYearEl.textContent = new Date().getFullYear().toString();
    initSmoothNav(primaryNav);
    initSmoothNav(sectionNav);
    initObserver();
    initFilters();
    fetchProjects();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
