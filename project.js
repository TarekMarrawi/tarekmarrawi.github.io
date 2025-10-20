(function () {
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const brandNameEl = document.getElementById('brand-name');
  const detail = document.getElementById('project-detail');
  const statusEl = document.getElementById('project-status');
  const contentEl = document.getElementById('project-content');
  const titleEl = document.getElementById('project-title');
  const summaryEl = document.getElementById('project-summary');
  const descriptionSection = document.getElementById('project-description-section');
  const descriptionEl = document.getElementById('project-description');
  const impactSection = document.getElementById('project-impact-section');
  const impactEl = document.getElementById('project-impact');
  const techSection = document.getElementById('project-tech-section');
  const techList = document.getElementById('project-tech');
  const linksSection = document.getElementById('project-links-section');
  const linksList = document.getElementById('project-links');
  const tagsEl = document.getElementById('project-tags');
  const mediaFigure = document.getElementById('project-media');
  const imageEl = document.getElementById('project-image');
  const statusBadge = document.getElementById('project-status-badge');
  const actionsEl = document.getElementById('project-actions');

  const THEME_KEY = 'tarekmarrawi-theme';
  const PLACEHOLDER_IMAGE =
    'data:image/webp;base64,UklGRrAjAABXRUJQVlA4IKQjAAAQZQKdASqwBKMCPm02l0ikIyIiIVO6CIANiWlu/HRW0+Af2r9+/ZTob8Mgm/+hI/369h/uP8oC//+n/uQO4j//5Gg7v8G/';

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      const isDark = theme === 'dark';
      themeToggle.setAttribute('aria-pressed', isDark);
      const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      themeToggle.setAttribute('aria-label', label);
      const textNode = themeToggle.querySelector('.theme-toggle__text');
      if (textNode) textNode.textContent = label;
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      // Ignore write failures (e.g., private mode)
    }
  }

  function initTheme() {
    let theme = 'light';
    try {
      const saved = localStorage.getItem(THEME_KEY);
      theme = saved || (prefersDark.matches ? 'dark' : 'light');
    } catch (error) {
      theme = prefersDark.matches ? 'dark' : 'light';
    }
    setTheme(theme);
  }

  function toggleTheme() {
    const current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(current);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  initTheme();

  function updateStatus(message, state = 'loading') {
    if (detail) {
      detail.dataset.state = state;
    }
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.hidden = !message;
    }
  }

  function showError(message) {
    if (contentEl) {
      contentEl.hidden = true;
    }
    updateStatus(message, 'error');
    document.title = 'Project not found — Tarek Marrawi Portfolio';
  }

  function showContent() {
    if (contentEl) {
      contentEl.hidden = false;
    }
    if (statusEl) {
      statusEl.hidden = true;
    }
    if (detail) {
      detail.dataset.state = 'ready';
    }
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

  function formatLinkLabel(key) {
    const labels = {
      demo: 'Demo',
      code: 'Source code',
      writeup: 'Case study'
    };
    if (labels[key]) return labels[key];
    if (!key) return 'Link';
    return key
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function extractLinks(rawLinks = {}, primaryHref) {
    if (typeof rawLinks !== 'object' || rawLinks === null) return [];
    return Object.entries(rawLinks)
      .map(([key, value]) => {
        if (typeof value === 'string' && value.trim().toLowerCase() === 'coming-soon') {
          return {
            key,
            label: `${formatLinkLabel(key)} — Coming soon`,
            pending: true
          };
        }
        const normalised = normaliseLink(value, formatLinkLabel(key));
        if (!normalised) return null;
        if (primaryHref && normalised.href === primaryHref) {
          return null;
        }
        return {
          key,
          label: normalised.label,
          href: normalised.href
        };
      })
      .filter(Boolean);
  }

  function renderLinksList(items) {
    if (!linksList || !linksSection) return;
    if (!Array.isArray(items) || !items.length) {
      linksList.replaceChildren();
      linksSection.hidden = true;
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const li = document.createElement('li');
      if (item.href) {
        const anchor = document.createElement('a');
        anchor.href = item.href;
        anchor.target = '_blank';
        anchor.rel = 'noopener';
        anchor.textContent = item.label;
        anchor.className = 'project-detail__link';
        li.appendChild(anchor);
      } else if (item.pending) {
        const span = document.createElement('span');
        span.textContent = item.label;
        span.className = 'project-detail__link project-detail__link--pending';
        li.appendChild(span);
      }
      fragment.appendChild(li);
    });
    linksList.replaceChildren(fragment);
    linksSection.hidden = false;
  }

  function renderTech(tech = []) {
    if (!techSection || !techList) return;
    if (!Array.isArray(tech) || !tech.length) {
      techList.replaceChildren();
      techSection.hidden = true;
      return;
    }
    const fragment = document.createDocumentFragment();
    tech.forEach((item) => {
      if (!item) return;
      const li = document.createElement('li');
      li.textContent = item;
      fragment.appendChild(li);
    });
    techList.replaceChildren(fragment);
    techSection.hidden = false;
  }

  function renderPrimaryAction(project, additionalLinks) {
    if (!actionsEl) return additionalLinks;
    actionsEl.replaceChildren();
    let primary = project.primaryLink && project.primaryLink.href ? project.primaryLink : null;

    if (!primary && additionalLinks.length) {
      const fallbackIndex = additionalLinks.findIndex((link) => Boolean(link.href));
      if (fallbackIndex >= 0) {
        primary = {
          href: additionalLinks[fallbackIndex].href,
          label: additionalLinks[fallbackIndex].label
        };
        additionalLinks.splice(fallbackIndex, 1);
      }
    }

    if (primary) {
      const anchor = document.createElement('a');
      anchor.className = 'btn btn--primary';
      anchor.href = primary.href;
      anchor.target = '_blank';
      anchor.rel = 'noopener';
      anchor.textContent = primary.label || 'View project';
      actionsEl.appendChild(anchor);
      actionsEl.hidden = false;
    } else {
      actionsEl.hidden = true;
    }

    return additionalLinks;
  }

  function applyProject(project) {
    if (!project) {
      showError('Project not found.');
      return;
    }

    showContent();

    const title = project.title || 'Untitled project';
    titleEl.textContent = title;
    document.title = `${title} — Tarek Marrawi Portfolio`;

    const tags = Array.isArray(project.tags) ? project.tags.filter(Boolean) : [];
    if (tags.length && tagsEl) {
      tagsEl.textContent = tags.join(' · ');
      tagsEl.hidden = false;
    } else if (tagsEl) {
      tagsEl.textContent = '';
      tagsEl.hidden = true;
    }

    if (summaryEl) {
      if (project.summary) {
        summaryEl.textContent = project.summary;
        summaryEl.hidden = false;
      } else {
        summaryEl.textContent = '';
        summaryEl.hidden = true;
      }
    }

    if (statusBadge) {
      const statusLabel = formatStatusLabel(project.status);
      if (statusLabel) {
        statusBadge.textContent = statusLabel;
        statusBadge.hidden = false;
      } else {
        statusBadge.textContent = '';
        statusBadge.hidden = true;
      }
    }

    if (descriptionSection && descriptionEl) {
      if (project.description) {
        descriptionEl.textContent = project.description;
        descriptionSection.hidden = false;
      } else {
        descriptionEl.textContent = '';
        descriptionSection.hidden = true;
      }
    }

    if (impactSection && impactEl) {
      if (project.impact) {
        impactEl.textContent = project.impact;
        impactSection.hidden = false;
      } else {
        impactEl.textContent = '';
        impactSection.hidden = true;
      }
    }

    if (mediaFigure && imageEl) {
      const imageSrc = project.image || PLACEHOLDER_IMAGE;
      imageEl.src = imageSrc;
      imageEl.alt = project.title ? `Illustration for ${project.title}` : 'Project illustration';
      imageEl.loading = 'lazy';
      if (project.imageWidth) imageEl.width = project.imageWidth;
      if (project.imageHeight) imageEl.height = project.imageHeight;
      mediaFigure.hidden = false;
    }

    const additionalLinks = extractLinks(project.links, project.primaryLink?.href || null);
    const remainingLinks = renderPrimaryAction(project, additionalLinks);
    renderLinksList(remainingLinks || []);
    renderTech(project.tech);
  }

  function normaliseProject(item) {
    const tags = Array.isArray(item?.tags) ? item.tags : [];
    const tech = Array.isArray(item?.tech) ? item.tech : [];
    const links = typeof item?.links === 'object' && item.links !== null ? item.links : {};
    const image = item?.image || PLACEHOLDER_IMAGE;
    const imageWidth = item?.imageWidth || 1200;
    const imageHeight = item?.imageHeight || 675;
    const primaryLink = resolvePrimaryLink(item?.primaryLink, links);
    return {
      ...item,
      id: typeof item?.id === 'string' ? item.id.trim() : '',
      tags,
      tech,
      links,
      image,
      imageWidth,
      imageHeight,
      ...(primaryLink ? { primaryLink } : {})
    };
  }

  function fetchProjectData(projectId) {
    updateStatus('Loading project…', 'loading');
    fetch('projects.json', { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load project');
        return response.json();
      })
      .then((projects) => {
        if (!Array.isArray(projects)) {
          throw new Error('Invalid projects payload');
        }
        const normalised = projects.map(normaliseProject);
        const match = normalised.find((item) => item.id === projectId);
        if (!match) {
          showError('Project not found.');
          return;
        }
        applyProject(match);
      })
      .catch((error) => {
        console.error('Unable to load project', error);
        showError('Unable to load project details. Please try again later.');
      });
  }

  function applyContent(content) {
    const heroName = content?.hero?.name;
    if (brandNameEl && heroName) {
      brandNameEl.textContent = heroName;
    }
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

  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');
  if (!projectId) {
    showError('Project reference missing.');
  } else {
    fetchProjectData(projectId.trim());
  }

  fetchContent();
})();
