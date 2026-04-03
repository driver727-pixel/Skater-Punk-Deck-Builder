/**
 * Backend proxy for the Fal.ai image generation API.
 *
 * WHY: The Fal.ai API key must stay server-side so it is never shipped to the
 * browser.  This tiny Express server acts as a transparent proxy: the React
 * front-end POSTs to /api/generate-image and this server forwards the request
 * to Fal.ai, attaching the secret key.
 *
 * HOW TO RUN:
 *   1. Install dependencies:
 *        npm install express node-fetch cors
 *        npm install --save-dev @types/express @types/node-fetch @types/cors ts-node
 *   2. Set environment variable:
 *        FAL_KEY=your_fal_ai_key_here
 *   3. Start the proxy:
 *        npx ts-node server/proxy.ts
 *      The proxy listens on http://localhost:3001 by default.
 *   4. Point the front-end at the proxy:
 *        VITE_IMAGE_API_URL=http://localhost:3001/api/generate-image
 *
 * For production, deploy this file to any Node.js host (Railway, Render, etc.)
 * and set the VITE_IMAGE_API_URL env var to the deployed URL.
 */

import express, { Request, Response } from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT ?? 3001;
const FAL_KEY = process.env.FAL_KEY ?? "";
const FAL_URL = "https://fal.run/fal-ai/flux/dev";

if (!FAL_KEY) {
  console.warn("⚠️  FAL_KEY environment variable is not set — requests will be rejected by Fal.ai.");
}

app.use(cors());
app.use(express.json());

app.post("/api/generate-image", async (req: Request, res: Response) => {
  try {
    const upstream = await fetch(FAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${FAL_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    if (!upstream.ok) {
      // Surface the upstream HTTP error before attempting JSON parse
      const text = await upstream.text();
      let body: unknown;
      try { body = JSON.parse(text); } catch { body = { error: text }; }
      res.status(upstream.status).json(body);
      return;
    }

    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Image generation proxy failed." });
  }
});

app.listen(PORT, () => {
  console.log(`🛹  Image proxy running at http://localhost:${PORT}`);
});
