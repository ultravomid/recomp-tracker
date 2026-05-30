// netlify/functions/ai.js
// AI router aman: API key disimpan di Netlify Environment Variables (server-side),
// tidak pernah terekspos ke browser. Mendukung Gemini, Claude, dan OpenAI.
//
// ENV VARS yang perlu di-set di Netlify (Site configuration -> Environment variables):
//   GEMINI_API_KEY     (wajib untuk provider "gemini")  -> dari https://aistudio.google.com/apikey
//   ANTHROPIC_API_KEY  (opsional, untuk "claude")        -> dari https://console.anthropic.com
//   OPENAI_API_KEY     (opsional, untuk "openai")        -> dari https://platform.openai.com
// Opsional override model:
//   GEMINI_MODEL   (default: gemini-2.5-flash)
//   CLAUDE_MODEL   (default: claude-sonnet-4-6)
//   OPENAI_MODEL   (default: gpt-4o-mini)

const MODELS = {
  gemini: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  claude: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
  openai: process.env.OPENAI_MODEL || "gpt-4o-mini",
};

const SYSTEM_PROMPT = `Kamu adalah asisten pelatih diet & kebugaran berbasis bukti ilmiah untuk Ahmad.
Konteks Ahmad: tinggi 160cm, sedang menurunkan berat dari 86kg menuju 62-65kg (body recomposition: turun lemak, naik otot).
Target harian: ~1.800 kkal (defisit ~20%), protein 160-189g, gula tambahan <=50g, air 2.5L.
Latihan: gym 3x/minggu (upper/lower/full) + kardio (jalan, sepeda, renang). Pemula, belum kuat aerobik intens.
Suplemen: pertimbangan whey, kreatin, PN1.

Prinsip jawaban:
- Bahasa Indonesia, hangat, ringkas, dan praktis. Hindari jargon berlebihan.
- Berbasis data yang diberikan. Kalau data kurang, katakan apa yang perlu dicatat.
- Beri saran konkret dan bisa langsung dilakukan, bukan teori panjang.
- Jangan memberi klaim medis pasti; sarankan konsultasi profesional bila relevan.
- Jangan mendorong defisit ekstrem atau perilaku tidak sehat. Rate aman 0.5-1kg/minggu.
- Jika ditanya hal di luar diet/fitness, jawab singkat lalu arahkan kembali ke tujuan Ahmad.`;

function buildUserPrompt(mode, data, question) {
  const summary = JSON.stringify(data || {}, null, 0);
  const modePrompts = {
    progress: "Analisa progres 7-14 hari terakhir Ahmad dari data berikut. Soroti yang sudah baik, yang perlu diperbaiki, dan 3 langkah konkret minggu depan.",
    meal: "Berdasarkan data konsumsi Ahmad, beri saran meal plan / penyesuaian makanan agar protein cukup, kalori sesuai target defisit, dan gula terkendali. Beri contoh menu konkret dari makanan Indonesia yang mudah.",
    training: "Berdasarkan aktivitas Ahmad, beri saran penyesuaian latihan (volume, jenis, kardio) untuk minggu depan. Sesuaikan dengan kondisi pemula.",
    free: "Jawab pertanyaan Ahmad berikut dengan mempertimbangkan data yang ada.",
  };
  const instruction = modePrompts[mode] || modePrompts.progress;
  let p = `${instruction}\n\nDATA (JSON): ${summary}`;
  if (question && question.trim()) p += `\n\nPERTANYAAN AHMAD: ${question.trim()}`;
  return p;
}

async function callGemini(userPrompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY belum di-set di Netlify.");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 1200 },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gemini error");
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "(kosong)";
}

async function callClaude(userPrompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY belum di-set di Netlify.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODELS.claude,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Claude error");
  return data?.content?.map((b) => b.text || "").join("") || "(kosong)";
}

async function callOpenAI(userPrompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY belum di-set di Netlify.");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODELS.openai,
      max_tokens: 1200,
      temperature: 0.6,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "OpenAI error");
  return data?.choices?.[0]?.message?.content || "(kosong)";
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  try {
    const { provider = "gemini", mode = "progress", data = {}, question = "" } = JSON.parse(event.body || "{}");
    const userPrompt = buildUserPrompt(mode, data, question);
    let text;
    if (provider === "gemini") text = await callGemini(userPrompt);
    else if (provider === "claude") text = await callClaude(userPrompt);
    else if (provider === "openai") text = await callOpenAI(userPrompt);
    else throw new Error("Provider tidak dikenal: " + provider);

    return { statusCode: 200, headers, body: JSON.stringify({ text, provider, model: MODELS[provider] }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
