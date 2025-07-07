const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

// Serve a simple homepage (optional)
app.get('/', (req, res) => {
  res.send('URL Shortener Microservice is running');
});

let urlDatabase = {};
let id = 1;

// POST URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;
  const parsedUrl = urlParser.parse(originalUrl);

  // Validate with DNS lookup
  dns.lookup(parsedUrl.hostname, (err, address) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = id++;
    urlDatabase[shortUrl] = originalUrl;

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// Redirect short URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'No short URL found for given input' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
