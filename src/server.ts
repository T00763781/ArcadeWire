import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { handleCreate } from "./api/create.ts";
import { handleResolve } from "./api/resolve.ts";
import { WORDS } from "./code/wordlist.ts";
import { htmlPage } from "./ui/layout.ts";
import { homeView } from "./ui/home.ts";
import { createView } from "./ui/CreateView.ts";
import { enterView } from "./ui/EnterView.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8787);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const method = req.method || "GET";

    // Assets
    if (method === "GET" && url.pathname === "/assets/styles.css") {
      return serveFile(res, path.join(__dirname, "ui", "styles.css"), "text/css; charset=utf-8");
    }
    if (method === "GET" && url.pathname === "/assets/client.js") {
      return serveFile(res, path.join(__dirname, "ui", "client.js"), "text/javascript; charset=utf-8");
    }
    if (method === "GET" && url.pathname === "/assets/client_code.js") {
      return serveFile(res, path.join(__dirname, "ui", "client_code.js"), "text/javascript; charset=utf-8");
    }
    if (method === "GET" && url.pathname === "/assets/wordlist.json") {
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(WORDS));
      return;
    }

    // API
    if (method === "POST" && url.pathname === "/api/create") return handleCreate(req, res);
    if (method === "POST" && url.pathname === "/api/resolve") return handleResolve(req, res);

    // Pages
    if (method === "GET" && url.pathname === "/") {
      return respondHtml(res, htmlPage({ title: "ArcadeWire", body: homeView() }));
    }
    if (method === "GET" && url.pathname === "/create") {
      return respondHtml(res, htmlPage({ title: "Create ArcadeWire", body: createView() }));
    }
    if (method === "GET" && url.pathname === "/enter") {
      return respondHtml(res, htmlPage({ title: "Enter ArcadeWire", body: enterView() }));
    }

    res.writeHead(404, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    res.end("Not found");
  } catch {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    res.end("Server error");
  }
});

server.listen(PORT, () => {
  console.log(`ArcadeWire listening on http://localhost:${PORT}`);
});

function respondHtml(res: http.ServerResponse, html: string): void {
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(html);
}

async function serveFile(res: http.ServerResponse, filepath: string, contentType: string): Promise<void> {
  const data = await readFile(filepath);
  res.writeHead(200, { "content-type": contentType, "cache-control": "no-store" });
  res.end(data);
}
