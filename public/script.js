document.addEventListener('DOMContentLoaded', () => {
  const tabsEl = document.getElementById('tabs');
  const addTabBtn = document.getElementById('add-tab');
  const themeToggle = document.getElementById('theme-toggle');
  const backBtn = document.getElementById('back');
  const forwardBtn = document.getElementById('forward');
  const reloadBtn = document.getElementById('reload');
  const addressBar = document.getElementById('address-bar');
  const tabContents = document.getElementById('tab-contents');

  let tabs = {};
  let tabCounter = 0;
  let activeTabId = null;

  // Theme management
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark');
  }
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });

  // Create a new tab
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
      contentEl,
      history: [],
      historyIndex: -1
    };

    tabsEl.appendChild(tabBtn);
    tabContents.appendChild(contentEl);

    // Event bindings
    tabBtn.addEventListener('click', () => switchTab(id));
    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      closeTab(id);
    });

    switchTab(id);

    if (initialQuery) navigate(initialQuery);
  }

  // Switch active tab
  function switchTab(id) {
    if (!tabs[id]) return;

    // Deactivate all
    Object.values(tabs).forEach(t => {
      t.titleEl.classList.remove('active');
      t.contentEl.classList.remove('active');
    });

    // Activate chosen
    tabs[id].titleEl.classList.add('active');
    tabs[id].contentEl.classList.add('active');
    activeTabId = id;

    // Update toolbar state
    const { history, historyIndex } = tabs[id];
    addressBar.value = historyIndex >= 0 ? history[historyIndex] : '';
    backBtn.disabled = historyIndex <= 0;
    forwardBtn.disabled = historyIndex >= history.length - 1;
  }

  // Close a tab
  function closeTab(id) {
    const { titleEl, contentEl } = tabs[id];
    titleEl.remove();
    contentEl.remove();
    delete tabs[id];

    // If closing active, pick another
    if (activeTabId === id) {
      const remaining = Object.keys(tabs);
      if (remaining.length) switchTab(remaining[0]);
      else addTab();
    }
  }

  // Navigate (search) in the active tab
  async function navigate(query, pushHistory = true) {
    const tab = tabs[activeTabId];
    if (!tab || !query.trim()) return;
    query = query.trim();

    // Update history
    if (pushHistory) {
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
      tab.history.push(query);
      tab.historyIndex++;
    }

    // Toolbar buttons
    backBtn.disabled = tab.historyIndex <= 0;
    forwardBtn.disabled = tab.historyIndex >= tab.history.length - 1;

    addressBar.value = query;
    tab.titleEl.childNodes[0].nodeValue = query;

    // Fetch results from our proxy
    const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
    const { results } = await res.json();

    // Render
    tab.contentEl.innerHTML = '';
    results.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'result-item';
      div.style.setProperty('--delay', `${i * 80}ms`);
      div.innerHTML = `
        <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
        <p>${item.snippet}</p>
      `;
      tab.contentEl.appendChild(div);
    });
  }

  // Navigation buttons
  backBtn.addEventListener('click', () => {
    const tab = tabs[activeTabId];
    if (tab.historyIndex > 0) {
      tab.historyIndex--;
      navigate(tab.history[tab.historyIndex], false);
    }
  });

  forwardBtn.addEventListener('click', () => {
    const tab = tabs[activeTabId];
    if (tab.historyIndex < tab.history.length - 1) {
      tab.historyIndex++;
      navigate(tab.history[tab.historyIndex], false);
    }
  });

  reloadBtn.addEventListener('click', () => {
    const tab = tabs[activeTabId];
    if (tab.historyIndex >= 0) {
      navigate(tab.history[tab.historyIndex], false);
    }
  });

  // Press Enter to search
  addressBar.addEventListener('keydown', e => {
    if (e.key === 'Enter') navigate(addressBar.value);
  });

  // Add new tab
  addTabBtn.addEventListener('click', () => addTab());

  // Initialize with one tab
  addTab();
});
