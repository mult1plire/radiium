document.addEventListener('DOMContentLoaded', () => {
  const tabsEl = document.getElementById('tabs');
  const addTabBtn = document.getElementById('add-tab');
  const themeToggle = document.getElementById('theme-toggle');
  const addressBar = document.getElementById('address-bar');
  const searchBtn = document.getElementById('search-btn');
  const tabContents = document.getElementById('tab-contents');

  let tabs = {};
  let tabCounter = 0;
  let activeTabId = null;

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });

  function addTab(initialQuery = '') {
    const id = `tab-${++tabCounter}`;
    const tabBtn = document.createElement('div');
    tabBtn.className = 'tab';
    tabBtn.textContent = 'New Tab';
    tabBtn.dataset.id = id;

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close';
    closeBtn.textContent = '×';
    tabBtn.appendChild(closeBtn);

    const contentEl = document.createElement('div');
    contentEl.className = 'tab-content';
    contentEl.dataset.id = id;

    tabs[id] = {
      id,
      titleEl: tabBtn,
      contentEl
    };

    tabsEl.appendChild(tabBtn);
    tabContents.appendChild(contentEl);

    tabBtn.addEventListener('click', () => switchTab(id));
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      closeTab(id);
    });

    switchTab(id);
    if (initialQuery) searchDuckDuckGo(initialQuery);
  }

  function switchTab(id) {
    Object.values(tabs).forEach(t => {
      t.titleEl.classList.remove('active');
      t.contentEl.classList.remove('active');
    });

    tabs[id].titleEl.classList.add('active');
    tabs[id].contentEl.classList.add('active');
    activeTabId = id;
  }

  function closeTab(id) {
    tabs[id].titleEl.remove();
    tabs[id].contentEl.remove();
    delete tabs[id];

    if (activeTabId === id) {
      const remaining = Object.keys(tabs);
      if (remaining.length) switchTab(remaining[0]);
      else addTab();
    }
  }

  async function searchDuckDuckGo(query) {
    if (!query.trim()) return;
    const tab = tabs[activeTabId];
    tab.titleEl.childNodes[0].nodeValue = query;
    addressBar.value = query;

    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const results = doc.querySelectorAll('.result');

    tab.contentEl.innerHTML = '';
    results.forEach((el, i) => {
      const titleEl = el.querySelector('.result__a');
      const snippetEl = el.querySelector('.result__snippet');
      if (!titleEl) return;

      const div = document.createElement('div');
      div.className = 'result-item';
      div.style.setProperty('--delay', `${i * 80}ms`);
      div.innerHTML = `
        <h3><a href="${titleEl.href}" target="_blank">${titleEl.textContent}</a></h3>
        <p>${snippetEl?.textContent || ''}</p>
      `;
      tab.contentEl.appendChild(div);
    });
  }

  searchBtn.addEventListener('click', () => {
    searchDuckDuckGo(addressBar.value);
  });

  addressBar.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchDuckDuckGo(addressBar.value);
  });

  addTab();
});
