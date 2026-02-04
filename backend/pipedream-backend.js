function tryParse(x) {
  if (typeof x === "string") {
    try { return JSON.parse(x); } catch {}
  }
  return null;
}

function getText(json) {
  const p = json?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(p)) return "";
  return p.map((x) => x?.text || "").join("\n");
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchRetry(url, opt, n = 3) {
  for (let i = 0; i < n; i++) {
    const r = await fetch(url, opt);
    if (r.ok) return r;
    if (r.status === 429 && i < n - 1) {
      await sleep(2000 * Math.pow(2, i));
      continue;
    }
    return r;
  }
}

export default defineComponent({
  async run({ steps, $ }) {
    const e = steps.trigger?.event || {};
    const method = String(e.method || "").toUpperCase();

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Content-Type": "application/json",
    };

    if (method === "OPTIONS") {
      await $.respond({ status: 200, headers, body: "" });
      return;
    }

    let body =
      (typeof e.body === "object" && e.body) ||
      tryParse(e.body) ||
      e.parsed_body ||
      tryParse(e.raw_body) ||
      e ||
      {};

    let base = body.imageBase64;
    let mime = body.mimeType;

    if (!base) {
      await $.respond({
        status: 400,
        headers,
        body: JSON.stringify({ error: "Missing imageBase64" }),
      });
      return;
    }

    base = base.replace(/^data:.*;base64,/, "");

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      await $.respond({
        status: 500,
        headers,
        body: JSON.stringify({ error: "Missing GEMINI_API_KEY" }),
      });
      return;
    }

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    const payload = {
      contents: [
        {
          parts: [
            {
              text:
                "Return JSON {caption, objects, text, language}. No markdown.",
            },
            {
              inline_data: {
                mime_type: mime || "image/jpeg",
                data: base,
              },
            },
          ],
        },
      ],
    };

    const resp = await fetchRetry(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify(payload),
      },
      3
    );

    if (!resp.ok) {
      const t = await resp.text();
      await $.respond({
        status: 500,
        headers,
        body: JSON.stringify({
          error: "Gemini request failed",
          status: resp.status,
          details: t,
        }),
      });
      return;
    }

    const j = await resp.json();
    const txt = getText(j);

    let out;
    try {
      out = JSON.parse(txt);
    } catch {
      out = { raw: txt };
    }

    await $.respond({
      status: 200,
      headers,
      body: JSON.stringify(out),
    });
  },
});