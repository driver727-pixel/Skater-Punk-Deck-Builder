import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // HSTS only when the connection is already secure (behind TLS proxy like Render)
  if (req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Allow the production site, GitHub Pages, and localhost to call this server
app.use(cors({
  origin: ['https://punchskater.com', 'https://driver727-pixel.github.io', 'http://localhost:5173'],
}));

app.use(express.json());

const FAL_KEY = process.env.FAL_KEY || '';
const FAL_URL = 'https://fal.run/fal-ai/flux/dev';
const BIREFNET_URL = 'https://fal.run/fal-ai/birefnet';

if (!FAL_KEY) {
  console.warn('⚠️  FAL_KEY environment variable is not set — requests will be rejected by Fal.ai.');
}

// Transparent proxy: the React front-end POSTs to /api/generate-image and
// this server forwards the request to Fal.ai, attaching the secret key.
app.post('/api/generate-image', async (req, res) => {
  try {
    const upstream = await fetch(FAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${FAL_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      let body;
      try { body = JSON.parse(text); } catch { body = { error: text }; }
      res.status(upstream.status).json(body);
      return;
    }

    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Image generation proxy failed.' });
  }
});

// Background removal proxy: strips the white/solid background from a generated
// character image and returns a transparent PNG via the Fal.ai birefnet model.
app.post('/api/remove-background', async (req, res) => {
  try {
    const upstream = await fetch(BIREFNET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${FAL_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      let body;
      try { body = JSON.parse(text); } catch { body = { error: text }; }
      res.status(upstream.status).json(body);
      return;
    }

    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    console.error('Background removal proxy error:', err);
    res.status(500).json({ error: 'Background removal proxy failed.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Card Forge Proxy running on port ${PORT}`);
});
