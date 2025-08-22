const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint: scrapes DuckDuckGo HTML and returns JSON without ads
app.get('/search', async (req, res) => {
  const q = req.query.q || '';
  if (!q) return res.json({ results: [] });

  try {
    const url = `https://html.duckduckgo.com/html?q=${encodeURIComponent(q)}`;
    const response = await fetch(url);
    const body = await response.text();
    const $ = cheerio.load(body);

    const results = [];
    $('.result').each((i, el) => {
      const linkEl = $(el).find('a.result__a');
      const title = linkEl.text();
      const href = linkEl.attr('href');
      const snippet = $(el).find('.result__snippet').text();

      if (title && href) {
        results.push({ title, link: href, snippet });
      }
    });

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ results: [] });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
