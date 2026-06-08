// ============================================================
// Recomp Tracker — Netlify Serverless Function (proxy ke Google Gemini)
// Lokasi di repo GitHub: netlify/functions/ai.js
// API key DISIMPAN AMAN di server (Netlify Environment Variables),
// tidak pernah terlihat di browser.
// ============================================================

exports.handler = async (event) => {
  // Preflight CORS (kalau diakses dari domain lain)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors(), body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { prompt } = JSON.parse(event.body || '{}');
    if (!prompt) {
      return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Prompt kosong' }) };
    }

    const KEY = process.env.GEMINI_API_KEY;            // <-- diset di dashboard Netlify
    const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';  // opsional, bisa diganti
    if (!KEY) {
      return {
        statusCode: 500,
        headers: cors(),
        body: JSON.stringify({ error: 'GEMINI_API_KEY belum diset di Netlify → Site configuration → Environment variables' })
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await r.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.error?.message ||
      'Tidak ada respons dari AI.';

    return { statusCode: 200, headers: cors(), body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: String(e) }) };
  }
};

function cors() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
