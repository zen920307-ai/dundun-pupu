// IPv4 loopback proxy: forwards 127.0.0.1:3000 -> [::1]:3000
// vinext dev binds IPv6 loopback only; this makes IPv4 localhost work too.
import http from 'node:http';

const TARGET = { host: '::1', port: 3000 };

http
  .createServer((req, res) => {
    const proxyReq = http.request(
      { ...TARGET, path: req.url, method: req.method, headers: { ...req.headers, host: 'localhost:3000' } },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );
    proxyReq.on('error', () => {
      res.writeHead(502);
      res.end('upstream unavailable');
    });
    req.pipe(proxyReq);
  })
  .listen(3000, '127.0.0.1', () => console.log('IPv4 proxy on http://127.0.0.1:3000'));
