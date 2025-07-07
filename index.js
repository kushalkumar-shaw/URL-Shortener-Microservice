const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');

const app = express();

// ✅ Middleware for FCC
app.use(cors());
app.use(express.urlencoded({ extended: false })); // FCC sends x-www-form-urlencoded

// Simple homepage
app.get('/', (req, res) => {
  res.send('URL Shortener Microservice is running');
});

// In-memory "database"
const urlDatabase = {};
let currentId = 1;

// ✅ POST /api/shorturl
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // ✅ Check basic format
  const urlRegex = /^https?:\/\/([\w.-]+\.[a-z]{2,})(:\d+)?(\/.*)?$/i;
  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // ✅ Extract hostname and check DNS
  const hostname = urlParser.parse(originalUrl).hostname;

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // ✅ Store and respond
    const shortUrl = currentId;
    urlDatabase[shortUrl] = originalUrl;
    currentId++;

    return res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// ✅ GET /api/shorturl/:short_url → redirect
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  const originalUrl = urlDatabase[shortUrl];
  if (originalUrl) {
    return res.redirect(originalUrl);
  } else {
    return res.json({ error: 'No short URL found for given input' });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
