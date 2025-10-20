
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
  const currentYearEl = document.getElementById('current-year');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const sections = Array.from(document.querySelectorAll('main section, footer#contact'));
  const brandNameEl = document.getElementById('brand-name');
  const heroNameEl = document.getElementById('hero-name');
  const heroKickerEl = document.getElementById('hero-kicker');
  const heroSublineEl = document.getElementById('hero-subline');
  const heroActionsEl = document.getElementById('hero-actions');
  const aboutContentEl = document.getElementById('about-content');
  const aboutActionsEl = document.getElementById('about-actions');
  const skillsGrid = document.getElementById('skills-grid');
  const bannerEl = document.getElementById('site-banner');
  const bannerMessageEl = document.getElementById('site-banner-message');
  const experienceSummaryEl = document.getElementById('experience-summary');
  const experienceListEl = document.getElementById('experience-list');
  const experienceMoreEl = document.getElementById('experience-more');
  const experienceEarlierLabelEl = document.getElementById('experience-earlier-label');
  const experienceEarlierEl = document.getElementById('experience-earlier');
  const contactTitleEl = document.getElementById('contact-title');
  const contactEmailEl = document.getElementById('contact-email');
  const contactEmailLinkEl = document.getElementById('contact-email-link');
  const contactLocationEl = document.getElementById('contact-location');
  const contactLanguagesEl = document.getElementById('contact-languages');
  const contactLinksEl = document.getElementById('contact-links');
  const footerNoteEl = document.getElementById('footer-note');

  const THEME_KEY = 'tarekmarrawi-theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const CACHE_KEY = 'projects:v1';
  const CACHE_VERSION = 'v1';
  const PLACEHOLDER_IMAGE = 'data:image/webp;base64,UklGRrAjAABXRUJQVlA4IKQjAAAQZQKdASqwBKMCPm02l0ikIyIiIVO6CIANiWlu/HRW0+Af2r9+/ZTob8Mgm/+hI/369h/uP8oC//+n/uQO4j//5Gg7v8G/';
  const BANNER_VARIANTS = ['info', 'success', 'warning', 'danger'];
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

  function escapeHTML(value) {
    if (typeof value !== 'string') return '';
    return value.replace(/[&<>"']/g, (char) => {
      switch (char) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        case "'":
          return '&#39;';
        default:
          return char;
      }
    });
  }

  function createActionButton(action) {
    const button = document.createElement('a');
    const variant = typeof action?.variant === 'string' && action.variant.trim() ? action.variant.trim() : 'secondary';
    button.className = `btn btn--${variant}`;
    button.textContent = action?.label || 'Learn more';
    const href = typeof action?.href === 'string' && action.href.trim() ? action.href.trim() : '#';
    button.href = href;
    const openInNewTab = Boolean(action?.newTab);
    if (openInNewTab) {
      button.target = '_blank';
      button.rel = 'noopener';
    } else {
      button.removeAttribute('target');
      button.removeAttribute('rel');
    }
    if (action?.download) {
      if (typeof action.download === 'string') {
        button.setAttribute('download', action.download);
      } else {
        button.setAttribute('download', '');
      }
    }
    return button;
  }

  function applyActions(container, actions) {
    if (!container) return;
    container.replaceChildren();
    if (!Array.isArray(actions) || !actions.length) return;
    const fragment = document.createDocumentFragment();
    actions.forEach((action) => fragment.appendChild(createActionButton(action)));
    container.appendChild(fragment);
  }

  function updateSiteBanner(banner = {}) {
    if (!bannerEl || !bannerMessageEl) return;
    const message = typeof banner.message === 'string' ? banner.message.trim() : '';
    const enabled = Boolean(banner.enabled);
    const variant = typeof banner.variant === 'string' ? banner.variant.trim().toLowerCase() : '';
    const appliedVariant = BANNER_VARIANTS.includes(variant) ? variant : 'warning';
    BANNER_VARIANTS.forEach((value) => {
      bannerEl.classList.remove(`site-banner--${value}`);
    });
    bannerEl.classList.add(`site-banner--${appliedVariant}`);
    if (enabled && message) {
      bannerMessageEl.textContent = message;
      bannerEl.hidden = false;
    } else {
      bannerMessageEl.textContent = message || '';
      bannerEl.hidden = true;
    }
  }

  function updateHeroContent(hero = {}) {
    if (heroKickerEl && hero.kicker) heroKickerEl.textContent = hero.kicker;
    if (heroNameEl && hero.name) heroNameEl.textContent = hero.name;
    if (brandNameEl && hero.name) brandNameEl.textContent = hero.name;
    if (heroSublineEl && hero.subline) heroSublineEl.textContent = hero.subline;
    applyActions(heroActionsEl, hero.actions);
  }

  function updateAboutContent(about = {}) {
    if (aboutContentEl) {
      aboutContentEl.replaceChildren();
      if (Array.isArray(about.paragraphs)) {
        const fragment = document.createDocumentFragment();
        about.paragraphs.forEach((paragraph) => {
          if (!paragraph) return;
          const p = document.createElement('p');
          p.textContent = paragraph;
          fragment.appendChild(p);
        });
        aboutContentEl.appendChild(fragment);
      }
    }
    applyActions(aboutActionsEl, about.actions);
  }

  function createSkillGroup(group) {
    const article = document.createElement('article');
    article.className = 'skill-group';
    if (group?.title) {
      const heading = document.createElement('h3');
      heading.textContent = group.title;
      article.appendChild(heading);
    }
    const list = document.createElement('ul');
    if (Array.isArray(group?.items)) {
      group.items.forEach((item) => {
        if (!item) return;
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
    }
    article.appendChild(list);
    return article;
  }

  function updateSkillsContent(skills) {
    if (!skillsGrid) return;
    if (Array.isArray(skills)) {
      if (!skills.length) {
        skillsGrid.replaceChildren();
        return;
      }
      const fragment = document.createDocumentFragment();
      skills.forEach((group) => fragment.appendChild(createSkillGroup(group)));
      skillsGrid.replaceChildren(fragment);
    }
  }

  function createExperienceItem(entry) {
    const item = document.createElement('li');
    item.className = 'timeline__item';
    if (entry?.period) {
      const period = document.createElement('div');
      period.className = 'timeline__period';
      period.textContent = entry.period;
      item.appendChild(period);
    }
    if (entry?.role) {
      const role = document.createElement('h3');
      role.textContent = entry.role;
      item.appendChild(role);
    }
    if (entry?.description) {
      const description = document.createElement('p');
      description.textContent = entry.description;
      item.appendChild(description);
    }
    return item;
  }

  function updateExperienceContent(experience = {}) {
    if (experienceSummaryEl && experience.summary) {
      experienceSummaryEl.textContent = experience.summary;
    }
    if (experienceListEl && Array.isArray(experience.entries)) {
      if (!experience.entries.length) {
        experienceListEl.replaceChildren();
      } else {
        const fragment = document.createDocumentFragment();
        experience.entries.forEach((entry) => fragment.appendChild(createExperienceItem(entry)));
        experienceListEl.replaceChildren(fragment);
      }
    }
    if (experienceMoreEl && experienceEarlierEl) {
      const hasEarlier = Array.isArray(experience.earlier) && experience.earlier.length;
      experienceMoreEl.hidden = !hasEarlier;
      if (hasEarlier) {
        if (experienceEarlierLabelEl) {
          const label = typeof experience.earlierLabel === 'string' ? experience.earlierLabel : 'Earlier experience';
          experienceEarlierLabelEl.textContent = label;
        }
        experienceEarlierEl.replaceChildren();
        const fragment = document.createDocumentFragment();
        experience.earlier.forEach((entry) => {
          if (!entry) return;
          const p = document.createElement('p');
          const title = escapeHTML(entry.title || '');
          const description = typeof entry.description === 'string' ? entry.description : '';
          p.innerHTML = `<strong>${title}</strong> ${description}`.trim();
          fragment.appendChild(p);
        });
        experienceEarlierEl.appendChild(fragment);
      }
    }
  }

  function updateContactContent(contact = {}, hero = {}) {
    if (contactTitleEl && contact.title) contactTitleEl.textContent = contact.title;
    if (contactEmailLinkEl && contact.email) {
      contactEmailLinkEl.textContent = contact.email;
      contactEmailLinkEl.href = `mailto:${contact.email}`;
    }
    if (contactEmailEl && contact.email) {
      contactEmailEl.firstChild?.nodeType === Node.TEXT_NODE && (contactEmailEl.firstChild.textContent = 'Email: ');
    }
    if (contactLocationEl && contact.location) {
      contactLocationEl.textContent = `Location: ${contact.location}`;
    }
    if (contactLanguagesEl && contact.languages) {
      contactLanguagesEl.textContent = `Languages: ${contact.languages}`;
    }
    applyActions(contactLinksEl, contact.links);
    if (footerNoteEl) {
      const owner = contact.owner || hero.name || 'Tarek Marrawi';
      const note = contact.note || 'Portfolio site crafted with accessibility, performance, and AI precision.';
      const trailing = ` ${owner}. ${note}`;
      const trailingNode = footerNoteEl.childNodes[2];
      if (trailingNode && trailingNode.nodeType === Node.TEXT_NODE) {
        trailingNode.textContent = trailing;
      } else {
        footerNoteEl.append(trailing);
      }
    }
  }

  function applyContent(content) {
    if (!content || typeof content !== 'object') return;
    updateSiteBanner(content.banner || {});
    updateHeroContent(content.hero || {});
    updateAboutContent(content.about || {});
    updateSkillsContent(content.skills || []);
    updateExperienceContent(content.experience || {});
    updateContactContent(content.contact || {}, content.hero || {});
  }

  function fetchContent() {
    fetch('content.json', { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load content');
        return response.json();
      })
      .then(applyContent)
      .catch((error) => {
        console.warn('Unable to fetch site content', error);
      });
  }

  function createTechBadge(text) {
    const li = document.createElement('li');
    li.textContent = text;
    return li;
  }

  function formatStatusLabel(value) {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.toLowerCase() === 'coming-soon') return 'Coming soon';
    return trimmed
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function normaliseLink(value, fallbackLabel = 'View project') {
    if (typeof value === 'string') {
      const href = value.trim();
      if (!href) return null;
      const lowered = href.toLowerCase();
      if (href === '#' || lowered === 'coming-soon') return null;
      return { href, label: fallbackLabel };
    }
    if (value && typeof value === 'object') {
      const href = typeof value.href === 'string' ? value.href.trim() : '';
      if (!href) return null;
      const lowered = href.toLowerCase();
      if (href === '#' || lowered === 'coming-soon') return null;
      const label =
        typeof value.label === 'string' && value.label.trim()
          ? value.label.trim()
          : fallbackLabel;
      return { href, label };
    }
    return null;
  }

  function resolvePrimaryLink(rawPrimaryLink, links = {}) {
    const direct = normaliseLink(rawPrimaryLink, 'View project');
    if (direct) return direct;

    const safeLinks = typeof links === 'object' && links !== null ? links : {};
    const priority = [
      { key: 'primary', label: 'View project' },
      { key: 'demo', label: 'View demo' },
      { key: 'code', label: 'View code' },
      { key: 'writeup', label: 'Read more' }
    ];

    for (const { key, label } of priority) {
      const candidate = normaliseLink(safeLinks[key], label);
      if (candidate) return candidate;
    }

    return null;
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

    const cardLink = card;
    const projectId = typeof project.id === 'string' ? project.id.trim() : '';
    const detailLabel = project.title ? `View details — ${project.title}` : 'View project details';

    if (projectId) {
      const detailUrl = `project.html?id=${encodeURIComponent(projectId)}`;
      cardLink.href = detailUrl;
      cardLink.removeAttribute('target');
      cardLink.removeAttribute('rel');
      cardLink.classList.remove('project-card--disabled');
      cardLink.removeAttribute('aria-disabled');
      cardLink.setAttribute('aria-label', detailLabel);
      cardLink.tabIndex = 0;
      cardLink.title = detailLabel;
      card.dataset.projectId = projectId;
    } else {
      cardLink.removeAttribute('href');
      cardLink.removeAttribute('target');
      cardLink.removeAttribute('rel');
      cardLink.classList.add('project-card--disabled');
      cardLink.setAttribute('aria-disabled', 'true');
      cardLink.removeAttribute('aria-label');
      cardLink.removeAttribute('title');
      cardLink.tabIndex = -1;
      delete card.dataset.projectId;
    }

    const statusLabel = formatStatusLabel(project.status);
    if (statusLabel) {
      status.textContent = statusLabel;
      status.hidden = false;
    } else if (!projectId) {
      status.textContent = 'Details coming soon';
      status.hidden = false;
    } else {
      status.textContent = '';
      status.hidden = true;
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
        id: typeof item.id === 'string' ? item.id.trim() : '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        tech: Array.isArray(item.tech) ? item.tech : [],
        links: typeof item.links === 'object' && item.links !== null ? item.links : {},
        image: item.image || PLACEHOLDER_IMAGE,
        imageWidth: item.imageWidth || 1200,
        imageHeight: item.imageHeight || 675
      }))
      .map((item) => {
        const primaryLink = resolvePrimaryLink(item.primaryLink, item.links);
        if (primaryLink) {
          return {
            ...item,
            primaryLink
          };
        }
        const clone = { ...item };
        delete clone.primaryLink;
        return clone;
      })
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
    fetchContent();

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
