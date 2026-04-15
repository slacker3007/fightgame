/**
 * Example HTTPS proxy for AI portraits (deploy as Cloudflare Worker, Vercel function, etc.).
 * Copy this file, add your provider SDK or fetch(), and set window.__PORTRAIT_API_URL__ in dev
 * or serve the game from the same origin that hosts the deployed function.
 *
 * --- Client contract (see js/portrait.js) ---
 *
 * Request:  POST, Content-Type: application/json
 * Body:     { "nickname": string, "classKey": "STR"|"DEX"|"STA"|"LUCK",
 *             "accountLevel": number, "style": string }
 *
 * Response (either):
 *   A) Content-Type: image/png (or image/jpeg) — raw image bytes (recommended for caching as data URL).
 *   B) Content-Type: application/json — { "imageUrl": "https://..." } or { "url": "..." }
 *
 * CORS: Allow-Origin for your game site (or * for local tests only).
 *
 * --- Pseudocode (Node / Worker style) ---
 *
 * export default {
 *   async fetch(request) {
 *     if (request.method === 'OPTIONS') {
 *       return new Response(null, { headers: corsHeaders });
 *     }
 *     if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
 *     const body = await request.json();
 *     const prompt = `Fantasy RPG bust portrait, ${body.classKey} warrior archetype, hero named ${body.nickname}, arena champion level ${body.accountLevel}, ${body.style || ''}, no text, no watermark`;
 *     // const imageBytes = await callOpenAIOrReplicate(prompt);
 *     // return new Response(imageBytes, { headers: { ...corsHeaders, 'Content-Type': 'image/png' } });
 *     // or return Response.json({ imageUrl: signedUrl }, { headers: corsHeaders });
 *     return new Response('Not implemented', { status: 501, headers: corsHeaders });
 *   }
 * };
 *
 * const corsHeaders = {
 *   'Access-Control-Allow-Origin': '*',
 *   'Access-Control-Allow-Methods': 'POST, OPTIONS',
 *   'Access-Control-Allow-Headers': 'Content-Type'
 * };
 */
