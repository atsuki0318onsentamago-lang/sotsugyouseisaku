const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname);
const port = process.env.PORT || 8081;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let safePath = path.normalize(path.join(root, urlPath));

  if (!safePath.startsWith(root)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(safePath, (err, stat) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }

    if (stat.isDirectory()) {
      safePath = path.join(safePath, 'index.html');
    }

    fs.readFile(safePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not found');
      }
      const ext = path.extname(safePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain; charset=utf-8' });
      res.end(data);
    });
  });
});

server.on('error', (err) => {
  console.error('サーバーエラー:', err);
  console.error('エラー詳細:', err.message);
  console.error('コード:', err.code);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`Frontend server running on http://localhost:${port}`);
  console.log(`LAN access: http://192.168.0.9:${port}`);
  console.log('サーバーは正常に起動しました');
});
