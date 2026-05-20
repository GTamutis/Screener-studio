// DOS icons — lucide-style outline, 18px, stroke 1.5
// Usage: <span data-icon="home"></span>
(function () {
  const ICONS = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 9v11h5v-6h4v6h5V9"/>',
    folder: '<path d="M3 6.5A1.5 1.5 0 014.5 5H9l2 2.5h8.5A1.5 1.5 0 0121 9v9.5A1.5 1.5 0 0119.5 20h-15A1.5 1.5 0 013 18.5v-12z"/>',
    'folder-open': '<path d="M3 7.5A1.5 1.5 0 014.5 6H9l2 2.5h8.5A1.5 1.5 0 0121 10"/><path d="M3 7.5V18a1.5 1.5 0 001.5 1.5h13.8a1.5 1.5 0 001.45-1.11L21.5 11H6.6a1.5 1.5 0 00-1.45 1.11L3 18"/>',
    'file-text': '<path d="M14 3H6.5A1.5 1.5 0 005 4.5v15A1.5 1.5 0 006.5 21h11a1.5 1.5 0 001.5-1.5V8z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/>',
    'bar-chart': '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-8"/><path d="M22 20H2"/>',
    send: '<path d="M21 3L11 13"/><path d="M21 3l-7 18-4-8-8-4z"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
    users: '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6 1.65 1.65 0 0010 3.09V3a2 2 0 114 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    'chevron-right': '<path d="M9 6l6 6-6 6"/>',
    'chevron-left': '<path d="M15 6l-6 6 6 6"/>',
    'more-vertical': '<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    x: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
    'plus-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/>',
    'panel-left': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
    filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z"/>',
    sliders: '<path d="M4 21V14"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/>',
    star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    sparkle: '<path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="M6 6l2 2"/><path d="M16 16l2 2"/><path d="M6 18l2-2"/><path d="M16 8l2-2"/>',
    'log-in': '<path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
    'help-circle': '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4"/><path d="M12 17h0"/>',
    'message-circle': '<path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 010 18"/><path d="M12 3a14 14 0 000 18"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    activity: '<path d="M22 12h-4l-3 9-6-18-3 9H2"/>',
    'shield-check': '<path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/>',
    'arrow-up-right': '<path d="M7 17L17 7"/><path d="M9 7h8v8"/>',
    edit: '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>',
    'external-link': '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'check-circle': '<path d="M22 11.1V12a10 10 0 11-5.9-9.1"/><path d="M22 4L12 14.01l-3-3"/>',
  };

  function render(name) {
    const path = ICONS[name];
    if (!path) return '';
    return `<svg viewBox="0 0 24 24" class="i" aria-hidden="true">${path}</svg>`;
  }

  function hydrate(root = document) {
    root.querySelectorAll('[data-icon]').forEach((el) => {
      const name = el.getAttribute('data-icon');
      if (!ICONS[name]) return;
      el.innerHTML = render(name);
      el.classList.add('ic');
    });
  }

  window.DOSIcons = { render, hydrate };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => hydrate());
  } else {
    hydrate();
  }
})();
