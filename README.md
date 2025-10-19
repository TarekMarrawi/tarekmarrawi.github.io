# Tarek Marrawi — Senior AI Engineer Portfolio

A lightweight, accessible, and responsive single-page portfolio for showcasing the work of **Tarek Marrawi**, covering LLMs, speech/ASR-TTS, and edge inference deployments. Built with semantic HTML5, modern CSS, and vanilla JavaScript. Designed to run directly on GitHub Pages without build tooling.

## Preview
Open `index.html` in any modern browser or serve the repository with a simple static server. All assets are local, so no internet connection is required once loaded.

## Features
- **Mobile-first, responsive layout** covering 360px through ultra-wide viewports.
- **Accessible navigation** with skip link, sticky section nav highlighting, keyboard focus styles, and high-contrast themes.
- **Automatic light/dark theme** toggle with `localStorage` persistence and system-preference detection.
- **Projects powered by JSON** (`projects.json`) fetched at runtime with tag-based filters (LLM, ASR, TTS, NLP, Edge, Healthcare, Simulation).
- **Semantically rich content**: hero, skills, projects, experience timeline, and contact footer CTAs.
- **Performance conscious**: system-font stack, reusable CSS variables, and minimal JavaScript.
- **SEO ready**: metadata, Open Graph tags, JSON-LD schema, and favicon placeholder.

## Getting Started
1. Clone or download this repository.
2. (Optional) Install a simple HTTP server (e.g., `python -m http.server`) and serve the project root so `fetch()` can load `projects.json` locally.
3. Visit `http://localhost:8000` (or your chosen port) to explore the site.

> **Note:** Browsers may block `fetch()` from reading local JSON files when opened via the `file://` protocol. Serving the folder via a local server mirrors GitHub Pages behavior.

## Customization
- **Update profile details:** Edit `index.html` to change hero text, about copy, skills, experience, and contact information.
- **Modify styling:** Adjust theme colors, typography, or layout tokens in `styles.css`. The design system uses CSS variables at the top of the file.
- **Projects data:** Add, remove, or edit project entries in `projects.json`. Each entry follows this schema:

  ```json
  {
    "id": "unique-id",
    "title": "Project name",
    "summary": "Short one-line summary (≤ 30 words)",
    "description": "Two to three sentences describing the project.",
    "tech": ["Tech", "Stack", "Items"],
    "tags": ["LLM", "TTS"],
    "impact": "Quantitative impact statement.",
    "links": {
      "demo": "https://example.com/demo-or-coming-soon",
      "code": "https://github.com/example",
      "writeup": "https://example.com/article"
    },
    "image": "assets/placeholder-project.svg",
    "status": "coming-soon"
  }
  ```

  - Set a link value to `"coming-soon"`, `null`, or `"#"` to render a disabled button.
  - Use the optional `"status": "coming-soon"` field to display the “Coming soon” badge.

- **Placeholder imagery:** Update `/assets/placeholder-project.svg` with your own artwork or replace it with multiple files named `placeholder-*.svg`. Ensure the new paths are referenced in `projects.json` or within the HTML template.
- **Theme accent color:** Change `--color-accent` and `--color-accent-strong` in `styles.css` to adapt the branding.

## Adding Your CV
Place your PDF résumé in the project root (e.g., `Tarek_Marrawi_Senior_AI_Engineer_CV.pdf`). Update the `href` attribute on the “Download CV” buttons in `index.html` if the filename changes.

## Deployment on GitHub Pages
1. Commit your changes and push to the `main` branch of the GitHub repository `tarekmarrawi/tarekmarrawi.github.io` (or your chosen username/repo name following GitHub Pages conventions).
2. In the repository settings, ensure **GitHub Pages** is enabled for the `main` branch.
3. GitHub Pages will build automatically, serving `index.html` at `https://<username>.github.io/`.

## Accessibility & Performance Notes
- Follows semantic landmarks (`header`, `nav`, `main`, `section`, `footer`) with descriptive labels.
- Focus outlines are preserved and contrasted for keyboard users.
- Reduced-motion preference respected via media queries.
- Minimal DOM depth and compressed assets keep the bundle lightweight, aiding Lighthouse performance.

## License
Feel free to adapt and reuse this template for personal or commercial portfolios. Attribution to Tarek Marrawi is appreciated but not required.
