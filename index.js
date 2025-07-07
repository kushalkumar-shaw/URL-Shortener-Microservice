require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const fs = require('fs');
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

function dataManagement(action, input) {
  const filePath = './public/data.json';

  if (!fs.existsSync(filePath)) {
    fs.closeSync(fs.openSync(filePath, 'w'));
  }

  const file = fs.readFileSync(filePath);

  if (action === 'save data' && input) {
    if (file.length === 0) {
      fs.writeFileSync(filePath, JSON.stringify([input], null, 2));
    } else {
      const data = JSON.parse(file.toString());
      const exists = data.some(d => d.original_url === input.original_url);
      if (!exists) {
        data.push(input);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      }
    }
  } else if (action === 'load data') {
    if (file.length === 0) return;
    return JSON.parse(file);
  }
}

function genShortUrl() {
  const allData = dataManagement('load data');
  let min = 1;
  let max = allData && allData.length > 0 ? allData.length * 1000 : 1000;
  const short = Math.ceil(Math.random() * (max - min + 1) + min);

  if (!allData) return short;
  const exists = allData.some(d => d.short_url === short);
  return exists ? genShortUrl() : short;
}

app.post('/api/shorturl', (req, res) => {
  const input = req.body.url;
  if (!input) return res.json({ error: 'invalid url' });

  const domainMatch = input.match(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/igm);
  if (!domainMatch) return res.json({ error: 'invalid url' });

  const domain = domainMatch[0].replace(/^https?:\/\//i, '');

  dns.lookup(domain, (err) => {
    if (err) return res.json({ error: 'invalid url' });

    const short = genShortUrl();
    const result = { original_url: input, short_url: short };
    dataManagement('save data', result);
    res.json(result);
  });
});

app.get('/api/shorturl/:shorturl', (req, res) => {
  const input = Number(req.params.shorturl);
  const allData = dataManagement('load data');

  if (!allData) return res.json({ error: 'No data found' });

  const match = allData.find(d => d.short_url === input);
  if (match) {
    res.redirect(match.original_url);
  } else {
    res.json({ error: 'No matching short URL' });
  }
});

app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
