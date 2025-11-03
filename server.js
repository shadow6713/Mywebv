const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8080;
const RATE_LIMIT = 10;
const WINDOW_SIZE = 60 * 1000;

let requestsLog = {};

const server = http.createServer((req, res) => {
    const clientIp = req.socket.remoteAddress;
    const now = Date.now();

    if (!requestsLog[clientIp]) requestsLog[clientIp] = [];

    requestsLog[clientIp] = requestsLog[clientIp].filter(
        t => now - t < WINDOW_SIZE
    );

    if (requestsLog[clientIp].length >= RATE_LIMIT) {
        res.writeHead(429, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("429 Too Many Requests — Please try again later.\n");
        return;
    }

    requestsLog[clientIp].push(now);

    let filePath = "index.html";
    if (req.url !== "/") filePath = req.url.slice(1);

    fs.readFile(path.join(__dirname, filePath), (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end("404 Not Found");
        }
        res.writeHead(200);
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`✅ Server Running at http://localhost:${PORT}`);
    console.log(`🔒 Limiting ${RATE_LIMIT} req / ${WINDOW_SIZE/1000}s per IP`);
});
