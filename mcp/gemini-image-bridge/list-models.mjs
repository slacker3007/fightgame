#!/usr/bin/env node
/**
 * Lists Gemini API models for this API key (REST v1beta).
 * Usage: set GEMINI_API_KEY, then: npm run list-models
 */
import dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("Set GEMINI_API_KEY in the environment or in .env next to this script.");
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
const res = await fetch(url);
const body = await res.json();
if (!res.ok) {
  console.error(res.status, body);
  process.exit(1);
}

const models = body.models || [];
const imageish = models.filter((m) => {
  const name = (m.name || "").toLowerCase();
  const methods = (m.supportedGenerationMethods || []).join(" ").toLowerCase();
  return (
    name.includes("image") ||
    methods.includes("generatecontent")
  );
});

console.log(`Total models: ${models.length}\n`);
console.log("Models with 'image' in id or name (inspect supportedGenerationMethods in full list):");
for (const m of imageish.slice(0, 80)) {
  console.log(
    `- ${m.name} methods=${(m.supportedGenerationMethods || []).join(",")}`
  );
}
