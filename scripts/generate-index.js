import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distClient = path.resolve(__dirname, "../dist/client");
const assetsDir = path.join(distClient, "assets");

if (!fs.existsSync(distClient)) {
  console.error("dist/client directory does not exist!");
  process.exit(1);
}

const files = fs.readdirSync(assetsDir);
const cssFile = files.find((f) => f.startsWith("styles") && f.endsWith(".css")) || files.find((f) => f.endsWith(".css"));
const indexJsFile = files.find((f) => f.startsWith("index") && f.endsWith(".js")) || files.find((f) => f.endsWith(".js"));

const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GK Digital Studios</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" />
    ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : ""}
  </head>
  <body>
    <div id="root"></div>
    ${indexJsFile ? `<script type="module" src="/assets/${indexJsFile}"></script>` : ""}
  </body>
</html>
`;

fs.writeFileSync(path.join(distClient, "index.html"), htmlContent, "utf-8");
console.log(`[postbuild] Created dist/client/index.html referencing CSS (${cssFile}) and JS (${indexJsFile})`);
