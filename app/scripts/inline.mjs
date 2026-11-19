// Inline Parcel's local CSS and JS into dist/index.html so the page is one file.
// External links (Google Fonts) are left as they are.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [, , inFile, outFile] = process.argv;
const dir = join(inFile, "..");
let html = readFileSync(inFile, "utf8");
const local = (href) => !/^(https?:)?\/\//.test(href) && !href.startsWith("data:");
const read = (href) => readFileSync(join(dir, href.replace(/^\//, "")), "utf8");

let css = "";
html = html.replace(/<link\s+rel=["']?stylesheet["']?\s+href=["']?([^"'\s>]+)["']?\s*>/g, (m, href) => {
  if (!local(href)) return m;
  css += read(href);
  return "";
});
html = html.replace(/<script([^>]*?)\s+src=["']?([^"'\s>]+)["']?([^>]*)><\/script>/g, (m, a, src, b) => {
  if (!local(src)) return m;
  const js = read(src).replace(/<\/script/gi, "<\\/script");
  return `<script${a}${b}>${js}</script>`;
});
// Put <meta charset> first so the encoding is detected before the big inline style.
const charset = html.match(/<meta\s+charset=["']?utf-8["']?\s*\/?>/i);
if (!charset) throw new Error("charset meta not found");
html = html.replace(charset[0], "").replace(/(<html[^>]*>)/i, (m) => `${m}${charset[0]}<style>${css}</style>`);
writeFileSync(outFile, html);
