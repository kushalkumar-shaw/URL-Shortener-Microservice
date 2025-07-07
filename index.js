const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Simple homepage
app.get('/', (req, res) => {
  res.send('URL Shortener Microservice');
});

let urlDatabase = {};
let id = 1;

// POST route
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Check format with regex
  const urlRegex = /^(https?:\/\/)([\w.-]+\.[a-z]{2,})(:[0-9]{1,5})?(\/.*)?$/i;
  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const parsedUrl = urlParser.parse(originalUrl);

  // DNS lookup to verify hostname
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = id;
    urlDatabase[shortUrl] = originalUrl;
    id++;

    return res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// GET route to redirect
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  const originalUrl = urlDatabase[shortUrl];
  if (originalUrl) {
    return res.redirect(originalUrl);
  } else {
    return res.json({ error: 'No short URL found for given input' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
