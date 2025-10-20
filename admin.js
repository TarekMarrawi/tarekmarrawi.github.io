const templates = {
  action: document.getElementById('action-item-template'),
  skill: document.getElementById('skill-item-template'),
  experience: document.getElementById('experience-item-template'),
  earlier: document.getElementById('earlier-item-template'),
  project: document.getElementById('project-editor-template')
};

const heroActionsList = document.getElementById('hero-actions-list');
const aboutActionsList = document.getElementById('about-actions-list');
const contactActionsList = document.getElementById('contact-actions-list');
const skillsList = document.getElementById('skills-list');
const experienceList = document.getElementById('experience-list');
const earlierList = document.getElementById('earlier-list');
const projectsList = document.getElementById('projects-list');
const contentForm = document.getElementById('content-form');

const downloadContentBtn = document.getElementById('download-content');
const copyContentBtn = document.getElementById('copy-content');
const addProjectBtn = document.getElementById('add-project');
const downloadProjectsBtn = document.getElementById('download-projects');
const copyProjectsBtn = document.getElementById('copy-projects');
const toastEl = document.getElementById('toast');
const pageButtons = Array.from(document.querySelectorAll('[data-page-target]'));
const pageSections = Array.from(document.querySelectorAll('[data-page]'));
let activePage = null;

function isValidPage(page) {
  if (!page) return false;
  return pageSections.some((section) => section.dataset.page === page);
}

function activatePage(page, { updateHash = true, scroll = true } = {}) {
  if (!isValidPage(page)) return;
  if (activePage === page) return;

  const targetSection = pageSections.find((section) => section.dataset.page === page);
  if (!targetSection) return;

  activePage = page;

  pageSections.forEach((section) => {
    const isCurrent = section === targetSection;
    section.classList.toggle('is-active', isCurrent);
    section.toggleAttribute('hidden', !isCurrent);
  });

  pageButtons.forEach((button) => {
    const isCurrent = button.dataset.pageTarget === page;
    button.classList.toggle('is-active', isCurrent);
    if (isCurrent) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });

  if (updateHash) {
    const url = new URL(window.location.href);
    url.hash = page;
    history.replaceState(null, '', url);
  }

  if (scroll) {
    window.requestAnimationFrame(() => {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

function initNavigation() {
  if (!pageSections.length) return;

  pageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.pageTarget;
      if (target) {
        activatePage(target);
      }
    });
  });

  window.addEventListener('hashchange', () => {
    const target = window.location.hash.slice(1);
    if (isValidPage(target)) {
      activatePage(target, { updateHash: false });
    }
  });

  const initialHash = window.location.hash.slice(1);
  const initialPage = isValidPage(initialHash)
    ? initialHash
    : pageSections[0]?.dataset.page;

  if (initialPage) {
    activatePage(initialPage, { updateHash: false, scroll: false });
  }
}

function cloneTemplate(template) {
  if (!template) return null;
  return template.content.firstElementChild.cloneNode(true);
}

function parseList(value) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectActionList(container) {
  if (!container) return [];
  const items = Array.from(container.querySelectorAll('.action-item'));
  return items
    .map((item) => {
      const label = item.querySelector('[data-field="label"]').value.trim();
      const href = item.querySelector('[data-field="href"]').value.trim();
      const variant = item.querySelector('[data-field="variant"]').value.trim() || 'secondary';
      const newTab = item.querySelector('[data-field="newTab"]').checked;
      const download = item.querySelector('[data-field="download"]').checked;
      if (!label && !href) return null;
      const action = { label, href, variant };
      if (newTab) action.newTab = true;
      if (download) action.download = true;
      return action;
    })
    .filter(Boolean);
}

function addAction(container, data = {}) {
  if (!container) return;
  const node = cloneTemplate(templates.action);
  if (!node) return;
  node.querySelector('[data-field="label"]').value = data.label || '';
  node.querySelector('[data-field="href"]').value = data.href || '';
  node.querySelector('[data-field="variant"]').value = data.variant || 'secondary';
  node.querySelector('[data-field="newTab"]').checked = Boolean(data.newTab);
  node.querySelector('[data-field="download"]').checked = Boolean(data.download);
  container.appendChild(node);
}

function addSkill(data = {}) {
  if (!skillsList) return;
  const node = cloneTemplate(templates.skill);
  if (!node) return;
  node.querySelector('[data-field="title"]').value = data.title || '';
  const textarea = node.querySelector('[data-field="items"]');
  textarea.value = Array.isArray(data.items) ? data.items.join('\n') : data.items || '';
  skillsList.appendChild(node);
}

function addExperience(data = {}) {
  if (!experienceList) return;
  const node = cloneTemplate(templates.experience);
  if (!node) return;
  node.querySelector('[data-field="period"]').value = data.period || '';
  node.querySelector('[data-field="role"]').value = data.role || '';
  node.querySelector('[data-field="description"]').value = data.description || '';
  experienceList.appendChild(node);
}

function addEarlier(data = {}) {
  if (!earlierList) return;
  const node = cloneTemplate(templates.earlier);
  if (!node) return;
  node.querySelector('[data-field="title"]').value = data.title || '';
  node.querySelector('[data-field="description"]').value = data.description || '';
  earlierList.appendChild(node);
}

function moveItem(item, direction) {
  if (!item || !item.parentElement) return;
  if (direction < 0) {
    const prev = item.previousElementSibling;
    if (prev) {
      item.parentElement.insertBefore(item, prev);
    }
  } else if (direction > 0) {
    const next = item.nextElementSibling;
    if (next) {
      item.parentElement.insertBefore(next, item);
    }
  }
}

function populateContentForm(content = {}) {
  const hero = content.hero || {};
  contentForm.elements['hero-kicker'].value = hero.kicker || '';
  contentForm.elements['hero-name'].value = hero.name || '';
  contentForm.elements['hero-subline'].value = hero.subline || '';
  heroActionsList.replaceChildren();
  (hero.actions || []).forEach((action) => addAction(heroActionsList, action));

  const about = content.about || {};
  const paragraphs = Array.isArray(about.paragraphs) ? about.paragraphs.join('\n\n') : '';
  contentForm.elements['about-paragraphs'].value = paragraphs;
  aboutActionsList.replaceChildren();
  (about.actions || []).forEach((action) => addAction(aboutActionsList, action));

  const skills = Array.isArray(content.skills) ? content.skills : [];
  skillsList.replaceChildren();
  if (skills.length) {
    skills.forEach((skill) => addSkill(skill));
  }

  const experience = content.experience || {};
  contentForm.elements['experience-summary'].value = experience.summary || '';
  experienceList.replaceChildren();
  (experience.entries || []).forEach((entry) => addExperience(entry));
  contentForm.elements['experience-earlier-label'].value = experience.earlierLabel || '';
  earlierList.replaceChildren();
  (experience.earlier || []).forEach((entry) => addEarlier(entry));

  const contact = content.contact || {};
  contentForm.elements['contact-title'].value = contact.title || '';
  contentForm.elements['contact-owner'].value = contact.owner || '';
  contentForm.elements['contact-email'].value = contact.email || '';
  contentForm.elements['contact-location'].value = contact.location || '';
  contentForm.elements['contact-languages'].value = contact.languages || '';
  contentForm.elements['contact-note'].value = contact.note || '';
  contactActionsList.replaceChildren();
  (contact.links || []).forEach((link) => addAction(contactActionsList, link));
}

function updateProjectSummary(editor) {
  const titleField = editor.querySelector('[data-field="title"]');
  const idField = editor.querySelector('[data-field="id"]');
  const summaryLabel = editor.querySelector('.project-editor__title');
  const title = titleField?.value.trim();
  const id = idField?.value.trim();
  summaryLabel.textContent = title || id || 'New project';
}

function addProject(data = {}) {
  if (!projectsList) return;
  const node = cloneTemplate(templates.project);
  if (!node) return;
  node.querySelector('[data-field="id"]').value = data.id || '';
  node.querySelector('[data-field="title"]').value = data.title || '';
  node.querySelector('[data-field="summary"]').value = data.summary || '';
  node.querySelector('[data-field="description"]').value = data.description || '';
  node.querySelector('[data-field="impact"]').value = data.impact || '';
  node.querySelector('[data-field="tech"]').value = Array.isArray(data.tech) ? data.tech.join('\n') : '';
  node.querySelector('[data-field="tags"]').value = Array.isArray(data.tags) ? data.tags.join('\n') : '';
  node.querySelector('[data-field="image"]').value = data.image || '';
  node.querySelector('[data-field="imageWidth"]').value = data.imageWidth ?? '';
  node.querySelector('[data-field="imageHeight"]').value = data.imageHeight ?? '';
  node.querySelector('[data-field="status"]').value = data.status || '';
  node.querySelector('[data-field="link-demo"]').value = data.links?.demo || '';
  node.querySelector('[data-field="link-code"]').value = data.links?.code || '';
  node.querySelector('[data-field="link-writeup"]').value = data.links?.writeup || '';
  node.querySelector('[data-field="primary-href"]').value = data.primaryLink?.href || '';
  node.querySelector('[data-field="primary-label"]').value = data.primaryLink?.label || '';
  updateProjectSummary(node);
  node.addEventListener('input', (event) => {
    if (event.target.matches('[data-field="title"], [data-field="id"]')) {
      updateProjectSummary(node);
    }
  });
  projectsList.appendChild(node);
}

function populateProjects(projects = []) {
  projectsList.replaceChildren();
  if (Array.isArray(projects) && projects.length) {
    projects.forEach((project) => addProject(project));
  }
}

function collectContentData() {
  const paragraphsValue = contentForm.elements['about-paragraphs'].value;
  const paragraphs = paragraphsValue
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const hero = {
    kicker: contentForm.elements['hero-kicker'].value.trim(),
    name: contentForm.elements['hero-name'].value.trim(),
    subline: contentForm.elements['hero-subline'].value.trim(),
    actions: collectActionList(heroActionsList)
  };
  const about = {
    paragraphs,
    actions: collectActionList(aboutActionsList)
  };
  const skills = Array.from(skillsList.children).map((item) => {
    const title = item.querySelector('[data-field="title"]').value.trim();
    const items = parseList(item.querySelector('[data-field="items"]').value);
    return { title, items };
  }).filter((entry) => entry.title || entry.items.length);
  const experience = {
    summary: contentForm.elements['experience-summary'].value.trim(),
    entries: Array.from(experienceList.children)
      .map((item) => {
        const period = item.querySelector('[data-field="period"]').value.trim();
        const role = item.querySelector('[data-field="role"]').value.trim();
        const description = item.querySelector('[data-field="description"]').value.trim();
        if (!period && !role && !description) return null;
        return { period, role, description };
      })
      .filter(Boolean),
    earlierLabel: contentForm.elements['experience-earlier-label'].value.trim(),
    earlier: Array.from(earlierList.children)
      .map((item) => {
        const title = item.querySelector('[data-field="title"]').value.trim();
        const description = item.querySelector('[data-field="description"]').value.trim();
        if (!title && !description) return null;
        return { title, description };
      })
      .filter(Boolean)
  };
  const contact = {
    title: contentForm.elements['contact-title'].value.trim(),
    owner: contentForm.elements['contact-owner'].value.trim(),
    email: contentForm.elements['contact-email'].value.trim(),
    location: contentForm.elements['contact-location'].value.trim(),
    languages: contentForm.elements['contact-languages'].value.trim(),
    note: contentForm.elements['contact-note'].value.trim(),
    links: collectActionList(contactActionsList)
  };
  return { hero, about, skills, experience, contact };
}

function collectProjectsData() {
  return Array.from(projectsList.children).map((editor) => {
    const id = editor.querySelector('[data-field="id"]').value.trim();
    const title = editor.querySelector('[data-field="title"]').value.trim();
    const summary = editor.querySelector('[data-field="summary"]').value.trim();
    const description = editor.querySelector('[data-field="description"]').value.trim();
    const impact = editor.querySelector('[data-field="impact"]').value.trim();
    const tech = parseList(editor.querySelector('[data-field="tech"]').value);
    const tags = parseList(editor.querySelector('[data-field="tags"]').value);
    const image = editor.querySelector('[data-field="image"]').value.trim();
    const imageWidthRaw = editor.querySelector('[data-field="imageWidth"]').value;
    const imageHeightRaw = editor.querySelector('[data-field="imageHeight"]').value;
    const status = editor.querySelector('[data-field="status"]').value.trim();
    const demo = editor.querySelector('[data-field="link-demo"]').value.trim();
    const code = editor.querySelector('[data-field="link-code"]').value.trim();
    const writeup = editor.querySelector('[data-field="link-writeup"]').value.trim();
    const primaryHref = editor.querySelector('[data-field="primary-href"]').value.trim();
    const primaryLabel = editor.querySelector('[data-field="primary-label"]').value.trim();

    const project = {
      id,
      title,
      summary,
      description
    };

    if (impact) project.impact = impact;
    if (tech.length) project.tech = tech;
    if (tags.length) project.tags = tags;
    if (image) project.image = image;

    const width = Number.parseInt(imageWidthRaw, 10);
    const height = Number.parseInt(imageHeightRaw, 10);
    if (!Number.isNaN(width)) project.imageWidth = width;
    if (!Number.isNaN(height)) project.imageHeight = height;
    if (status) project.status = status;

    const links = {};
    if (demo) links.demo = demo;
    if (code) links.code = code;
    if (writeup) links.writeup = writeup;
    if (Object.keys(links).length) project.links = links;

    if (primaryHref) {
      project.primaryLink = {
        href: primaryHref,
        label: primaryLabel || 'View project'
      };
    }

    return project;
  });
}

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function copyJSON(data) {
  const json = JSON.stringify(data, null, 2);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(json);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = json;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

let toastTimeout = null;
function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastEl.classList.add('is-visible');
  if (toastTimeout) window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toastEl.classList.remove('is-visible');
    toastEl.hidden = true;
  }, 2200);
}

function handleContentClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  switch (action) {
    case 'add-hero-action':
      addAction(heroActionsList);
      break;
    case 'add-about-action':
      addAction(aboutActionsList);
      break;
    case 'add-contact-action':
      addAction(contactActionsList);
      break;
    case 'remove-action':
      button.closest('.action-item')?.remove();
      break;
    case 'add-skill':
      addSkill();
      break;
    case 'remove-skill':
      button.closest('.skill-item')?.remove();
      break;
    case 'add-experience':
      addExperience();
      break;
    case 'remove-experience':
      button.closest('.experience-item')?.remove();
      break;
    case 'add-earlier':
      addEarlier();
      break;
    case 'remove-earlier':
      button.closest('.earlier-item')?.remove();
      break;
    case 'move-up':
      moveItem(button.closest('.skill-item, .experience-item, .earlier-item'), -1);
      break;
    case 'move-down':
      moveItem(button.closest('.skill-item, .experience-item, .earlier-item'), 1);
      break;
    default:
      break;
  }
}

function handleProjectsClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const editor = button.closest('.project-editor');
  const action = button.dataset.action;
  switch (action) {
    case 'move-up':
      moveItem(editor, -1);
      break;
    case 'move-down':
      moveItem(editor, 1);
      break;
    case 'remove-project':
      editor?.remove();
      break;
    default:
      break;
  }
}

async function init() {
  if (contentForm) {
    contentForm.addEventListener('click', handleContentClick);
  }
  if (projectsList) {
    projectsList.addEventListener('click', handleProjectsClick);
  }
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', () => addProject());
  }
  if (downloadContentBtn) {
    downloadContentBtn.addEventListener('click', () => {
      const data = collectContentData();
      downloadJSON('content.json', data);
      showToast('content.json downloaded');
    });
  }
  if (copyContentBtn) {
    copyContentBtn.addEventListener('click', async () => {
      const data = collectContentData();
      try {
        await copyJSON(data);
        showToast('content.json copied to clipboard');
      } catch (error) {
        console.error('Unable to copy content.json', error);
      }
    });
  }
  if (downloadProjectsBtn) {
    downloadProjectsBtn.addEventListener('click', () => {
      const data = collectProjectsData();
      downloadJSON('projects.json', data);
      showToast('projects.json downloaded');
    });
  }
  if (copyProjectsBtn) {
    copyProjectsBtn.addEventListener('click', async () => {
      const data = collectProjectsData();
      try {
        await copyJSON(data);
        showToast('projects.json copied to clipboard');
      } catch (error) {
        console.error('Unable to copy projects.json', error);
      }
    });
  }

  try {
    const [contentResult, projectsResult] = await Promise.allSettled([
      fetch('content.json', { cache: 'no-cache' }).then((response) => {
        if (!response.ok) throw new Error('Failed to fetch content');
        return response.json();
      }),
      fetch('projects.json', { cache: 'no-cache' }).then((response) => {
        if (!response.ok) throw new Error('Failed to fetch projects');
        return response.json();
      })
    ]);

    if (contentResult.status === 'fulfilled') {
      populateContentForm(contentResult.value);
    } else {
      console.error(contentResult.reason);
      showToast('Using empty content (failed to load content.json)');
    }

    if (projectsResult.status === 'fulfilled') {
      populateProjects(Array.isArray(projectsResult.value) ? projectsResult.value : []);
    } else {
      console.error(projectsResult.reason);
      showToast('Using empty projects (failed to load projects.json)');
    }
  } catch (error) {
    console.error('Initialisation failed', error);
  }
}

initNavigation();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
