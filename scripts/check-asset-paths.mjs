import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = fs.readFileSync(path.join(root, "js/data.js"), "utf8");
const mm = data.match(/const ALL_ITEMS = (\[[\s\S]*?\]);/);
if (!mm) throw new Error("ALL_ITEMS not found");
const ALL_ITEMS = eval(mm[1]);

const paths = new Set();
function add(p) {
  paths.add(p);
}

const state = fs.readFileSync(path.join(root, "js/state.js"), "utf8");
const re = /loadAsset\([^,]+,\s*['"]([^'"]+)['"]/g;
let x;
while ((x = re.exec(state))) add(x[1]);

for (let i = 1; i <= 10; i++) {
  add(`assets/enemy_lvl_${i}_icon.png`);
  add(`assets/enemy_lvl_${i}.png`);
}
[
  "assets/hit_zone_head.png",
  "assets/hit_zone_neck.png",
  "assets/hit_zone_chest.png",
  "assets/hit_zone_legs.png",
  "assets/hit_zone_feet.png",
].forEach(add);

ALL_ITEMS.forEach((it) =>
  add(`assets/${it.name.toLowerCase().replace(/ /g, "_")}.png`)
);

const missing = [...paths]
  .filter((p) => !fs.existsSync(path.join(root, p)))
  .sort();

console.log(JSON.stringify({ totalPaths: paths.size, missingCount: missing.length, missing }, null, 2));
process.exit(missing.length ? 1 : 0);
