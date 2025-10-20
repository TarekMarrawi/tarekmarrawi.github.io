
(function () {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const sectionNav = document.querySelector('.section-nav');
  const primaryNav = document.querySelector('.primary-nav');
  const projectsGrid = document.getElementById('projects-grid');
  const projectsFallback = document.getElementById('projects-fallback');
  const projectsLoading = document.getElementById('projects-loading');
  const template = document.getElementById('project-card-template');
  const skeletonTemplate = document.getElementById('project-skeleton-template');
  const bootScript = document.getElementById('projects-boot');
  const adminToggle = document.getElementById('admin-toggle');
  const adminPanel = document.getElementById('admin-panel');
  const adminForm = adminPanel?.querySelector('[data-admin-form]');
  const adminFields = adminPanel?.querySelector('[data-admin-fields]');
  const adminClose = adminPanel?.querySelector('[data-admin-close]');
  const adminReset = adminPanel?.querySelector('[data-admin-reset]');
  const adminBackdrop = adminPanel?.querySelector('[data-admin-backdrop]');
  const currentYearEl = document.getElementById('current-year');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const sections = Array.from(document.querySelectorAll('main section, footer#contact'));

  const THEME_KEY = 'tarekmarrawi-theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const CACHE_KEY = 'projects:v1';
  const CACHE_VERSION = 'v1';
  const PLACEHOLDER_IMAGE = 'data:image/webp;base64,UklGRrAjAABXRUJQVlA4IKQjAAAQZQKdASqwBKMCPm02l0ikIyIiIVO6CIANiWlu/HRW0+Af2r9+/ZTob8Mgm/+hI/369h/uP8oC//+n/uQO4j//5Gg7v8G/';
  const ADMIN_STORAGE_KEY = 'tarekmarrawi-content:v1';
  const ADMIN_STORAGE_VERSION = '1';
  const editableEntries = new Map();
  let lastFocusedAdminTrigger = null;
  const requestIdle = window.requestIdleCallback || function (cb) {
    return window.setTimeout(() => {
      cb({ didTimeout: true, timeRemaining: () => 0 });
    }, 32);
  };
  const cancelIdle = window.cancelIdleCallback || window.clearTimeout;

  let pendingIdleHandle = null;
  let pendingQueue = [];
  let pendingStatusMessage = '';

  let bootProjects = [];
  if (bootScript?.textContent) {
    try {
      const parsed = JSON.parse(bootScript.textContent);
      if (Array.isArray(parsed)) {
        bootProjects = parsed;
      }
    } catch (error) {
      console.warn('Unable to parse boot projects', error);
    }
  }

  const state = {
    allProjects: bootProjects.slice(),
    activeFilter: 'all',
    hasHydrated: false
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

  function createProjectCard(project) {
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

    const imageSrc = project.image || PLACEHOLDER_IMAGE;
    image.src = imageSrc;
    image.alt = project.title ? `Illustration for ${project.title}` : 'Project illustration';
    image.loading = 'lazy';
    image.width = project.imageWidth || 1200;
    image.height = project.imageHeight || 675;

    tags.textContent = Array.isArray(project.tags) ? project.tags.join(' · ') : '';
    title.textContent = project.title || 'Untitled project';
    summary.textContent = project.summary || '';
    description.textContent = project.description || '';
    impact.textContent = project.impact || '';

    techList.innerHTML = '';
    (project.tech || []).forEach((item) => techList.appendChild(createTechBadge(item)));

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

    card.dataset.tags = (project.tags || []).join(',');
    return card;
  }

  function clearGrid() {
    if (!projectsGrid) return;
    projectsGrid.replaceChildren();
  }

  function updateLoadingState(state, message) {
    if (!projectsLoading) return;
    if (message) {
      projectsLoading.textContent = message;
    }
    projectsLoading.dataset.state = state;
  }

  function clearSkeleton() {
    if (!projectsGrid) return;
    projectsGrid.querySelectorAll('.project-card--skeleton').forEach((node) => node.remove());
  }

  function showSkeleton(count) {
    if (!projectsGrid || !skeletonTemplate) return;
    const skeletons = document.createDocumentFragment();
    for (let index = 0; index < count; index += 1) {
      const clone = skeletonTemplate.content.firstElementChild.cloneNode(true);
      skeletons.appendChild(clone);
    }
    projectsGrid.appendChild(skeletons);
  }

  function cancelPendingIdle() {
    if (pendingIdleHandle !== null) {
      cancelIdle(pendingIdleHandle);
      pendingIdleHandle = null;
    }
    pendingQueue = [];
  }

  function scheduleRemainingProjects(queue) {
    if (!queue.length) {
      clearSkeleton();
      return;
    }
    pendingQueue = queue.slice();
    const runner = (deadline) => {
      if (!projectsGrid) return;
      let timeRemaining = typeof deadline.timeRemaining === 'function' ? deadline.timeRemaining() : 0;
      if (!deadline.didTimeout && timeRemaining <= 0) {
        timeRemaining = 12;
      }
      while (pendingQueue.length && (deadline.didTimeout || timeRemaining > 5)) {
        const project = pendingQueue.shift();
        const card = createProjectCard(project);
        projectsGrid.appendChild(card);
        timeRemaining = typeof deadline.timeRemaining === 'function' ? deadline.timeRemaining() : 0;
      }
      if (pendingQueue.length) {
        pendingIdleHandle = requestIdle(runner);
      } else {
        pendingIdleHandle = null;
        clearSkeleton();
        updateLoadingState('ready', pendingStatusMessage || 'Projects loaded.');
        pendingStatusMessage = '';
      }
    };
    pendingIdleHandle = requestIdle(runner);
  }

  function filterProjects(list) {
    return list.filter((project) => {
      if (state.activeFilter === 'all') return true;
      return (project.tags || []).some((tag) => tag.toLowerCase() === state.activeFilter.toLowerCase());
    });
  }

  function renderProjects(list) {
    if (!projectsGrid || !template) return;
    cancelPendingIdle();
    clearSkeleton();
    const filtered = filterProjects(list);

    if (!filtered.length) {
      clearGrid();
      projectsFallback.hidden = false;
      projectsFallback.textContent = 'No projects match this focus yet. Try another filter.';
      updateLoadingState('ready', 'No matching projects available right now.');
      pendingStatusMessage = '';
      return;
    }

    projectsFallback.hidden = true;
    clearGrid();
    const initial = filtered.slice(0, 4);
    const remainder = filtered.slice(4);
    const fragment = document.createDocumentFragment();
    initial.forEach((project) => {
      fragment.appendChild(createProjectCard(project));
    });
    projectsGrid.appendChild(fragment);

    if (remainder.length) {
      updateLoadingState('loading', 'Rendering more projects…');
      showSkeleton(Math.min(remainder.length, 4));
      scheduleRemainingProjects(remainder);
    } else {
      updateLoadingState('ready', pendingStatusMessage || 'Projects loaded.');
      pendingStatusMessage = '';
    }
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
    renderProjects(state.allProjects);
  }

  function initFilters() {
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter || 'all';
        setActiveFilter(filter);
      });
    });
  }

  function normaliseProjects(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => ({
        ...item,
        tags: Array.isArray(item.tags) ? item.tags : [],
        tech: Array.isArray(item.tech) ? item.tech : [],
        links: typeof item.links === 'object' && item.links !== null ? item.links : {},
        image: item.image || PLACEHOLDER_IMAGE,
        imageWidth: item.imageWidth || 1200,
        imageHeight: item.imageHeight || 675
      }))
      .slice(0, 20);
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const payload = JSON.parse(raw);
      if (payload.version !== CACHE_VERSION) return null;
      return normaliseProjects(payload.data);
    } catch (error) {
      console.warn('Unable to read cached projects', error);
      return null;
    }
  }

  function writeCache(data) {
    try {
      const payload = {
        version: CACHE_VERSION,
        data
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('Unable to cache projects', error);
    }
  }

  function hydrateProjects(projects, { announceUpdated } = { announceUpdated: false }) {
    if (!projects.length) return;
    state.allProjects = projects;
    pendingStatusMessage = announceUpdated ? 'Projects updated with the latest work.' : 'Projects ready.';
    renderProjects(state.allProjects);
  }

  function fetchProjects() {
    if (!projectsGrid || !template) return;
    fetch('projects.json', { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then((data) => {
        const normalised = normaliseProjects(data);
        if (!normalised.length) {
          throw new Error('No projects available');
        }
        writeCache(normalised);
        hydrateProjects(normalised, { announceUpdated: state.hasHydrated });
        state.hasHydrated = true;
      })
      .catch((error) => {
        console.warn('Unable to fetch latest projects', error);
        if (!state.allProjects.length) {
          projectsFallback.hidden = false;
          projectsFallback.textContent = 'Unable to load projects right now. Please try again later.';
          updateLoadingState('error', 'Projects failed to load.');
          pendingStatusMessage = '';
        } else {
          updateLoadingState('ready', 'Showing cached projects (offline).');
          pendingStatusMessage = '';
        }
      });
  }

  function readAdminContent() {
    try {
      const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (!raw) return {};
      const payload = JSON.parse(raw);
      if (payload.version !== ADMIN_STORAGE_VERSION || typeof payload.values !== 'object' || payload.values === null) {
        return {};
      }
      return payload.values;
    } catch (error) {
      console.warn('Unable to read saved content', error);
      return {};
    }
  }

  function writeAdminContent(values) {
    try {
      const payload = {
        version: ADMIN_STORAGE_VERSION,
        values
      };
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('Unable to persist updated content', error);
    }
  }

  function gatherEditableEntries(values) {
    const nodes = document.querySelectorAll('[data-editable]');
    nodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const key = node.dataset.editable;
      if (!key || editableEntries.has(key)) return;
      const label = node.dataset.label || key;
      const multiline = node.dataset.multiline === 'true';
      const original = node.textContent || '';
      editableEntries.set(key, {
        element: node,
        label,
        multiline,
        original
      });
      const savedValue = values?.[key];
      if (typeof savedValue === 'string') {
        node.textContent = savedValue;
      }
    });
  }

  function renderAdminFields(values) {
    if (!adminFields) return;
    adminFields.replaceChildren();
    editableEntries.forEach((entry, key) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'admin-panel__field';

      const caption = document.createElement('span');
      caption.className = 'admin-panel__label';
      caption.textContent = entry.label;
      wrapper.appendChild(caption);

      let control;
      if (entry.multiline) {
        control = document.createElement('textarea');
        control.rows = 3;
      } else {
        control = document.createElement('input');
        control.type = 'text';
      }
      control.name = key;
      const savedValue = values?.[key];
      control.value = typeof savedValue === 'string' ? savedValue : entry.element.textContent || '';
      control.dataset.adminInput = 'true';
      wrapper.appendChild(control);

      adminFields.appendChild(wrapper);
    });
  }

  function closeAdminPanel() {
    if (!adminPanel) return;
    adminPanel.hidden = true;
    adminToggle?.setAttribute('aria-expanded', 'false');
    document.body.style.removeProperty('overflow');
    document.removeEventListener('keydown', handleAdminKeydown);
    if (lastFocusedAdminTrigger instanceof HTMLElement) {
      lastFocusedAdminTrigger.focus();
    } else {
      adminToggle?.focus();
    }
  }

  function handleAdminKeydown(event) {
    if (event.key === 'Escape') {
      closeAdminPanel();
    }
  }

  function openAdminPanel() {
    if (!adminPanel) return;
    lastFocusedAdminTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : adminToggle;
    renderAdminFields(readAdminContent());
    adminPanel.hidden = false;
    adminToggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    const firstInput = adminPanel.querySelector('[data-admin-input]');
    if (firstInput instanceof HTMLElement) {
      firstInput.focus();
    }
    document.addEventListener('keydown', handleAdminKeydown);
  }

  function toggleAdminPanel() {
    if (!adminPanel) return;
    if (adminPanel.hidden) {
      openAdminPanel();
    } else {
      closeAdminPanel();
    }
  }

  function saveAdminContent(event) {
    event.preventDefault();
    if (!adminForm) return;
    const formData = new FormData(adminForm);
    const values = {};
    editableEntries.forEach((entry, key) => {
      const value = formData.get(key);
      if (typeof value === 'string') {
        entry.element.textContent = value;
        values[key] = value;
      }
    });
    writeAdminContent(values);
    renderAdminFields(values);
    closeAdminPanel();
  }

  function resetAdminContent() {
    try {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch (error) {
      console.warn('Unable to clear saved content', error);
    }
    editableEntries.forEach((entry) => {
      entry.element.textContent = entry.original;
    });
    renderAdminFields({});
  }

  function initAdminPanel() {
    const savedValues = readAdminContent();
    gatherEditableEntries(savedValues);

    if (!adminPanel || !adminToggle || !adminForm || !adminFields) {
      return;
    }

    if (!editableEntries.size) {
      adminToggle.hidden = true;
      return;
    }

    renderAdminFields(savedValues);

    adminToggle.addEventListener('click', toggleAdminPanel);
    adminForm.addEventListener('submit', saveAdminContent);

    adminClose?.addEventListener('click', closeAdminPanel);
    adminBackdrop?.addEventListener('click', closeAdminPanel);
    adminReset?.addEventListener('click', resetAdminContent);
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
    initAdminPanel();
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

    if (bootProjects.length) {
      hydrateProjects(normaliseProjects(bootProjects));
    } else if (projectsGrid) {
      showSkeleton(4);
      updateLoadingState('loading', 'Loading highlighted work…');
    }

    const cached = readCache();
    if (cached && cached.length) {
      hydrateProjects(cached);
      state.hasHydrated = true;
    }

    fetchProjects();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
