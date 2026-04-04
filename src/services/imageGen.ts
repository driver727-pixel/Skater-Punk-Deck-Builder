import { hashSeedToInt } from "../utils/hash";

// ── Configuration ──────────────────────────────────────────────────────────────
//
// Image generation uses the backend proxy (Option B).
//
// Set VITE_IMAGE_API_URL in your .env:
//   Local dev:    VITE_IMAGE_API_URL=/api/generate-image
//                 (Vite proxies /api/* to the local server on port 3001)
//   Production:   VITE_IMAGE_API_URL=https://your-server.onrender.com/api/generate-image
//
// Start the proxy with:  FAL_KEY=your_fal_ai_key_here npm start
//
// The Authorization header is intentionally omitted from the browser request;
// the proxy adds the FAL_KEY server-side so the key never reaches the client.

const PROXY_API_URL = (import.meta.env.VITE_IMAGE_API_URL as string | undefined)?.trim();
const API_URL = PROXY_API_URL || "https://fal.run/fal-ai/flux/dev";

/**
 * True when VITE_IMAGE_API_URL is configured,
 * so callers can gate image generation UI without attempting a doomed request.
 */
export const isImageGenConfigured = Boolean(PROXY_API_URL);

// ── Generation parameters ──────────────────────────────────────────────────────
// Adjust these to trade off quality vs. generation speed.

const IMAGE_SIZE         = "portrait_4_3";
const INFERENCE_STEPS    = 28;
const GUIDANCE_SCALE     = 3.5;
const NUM_IMAGES         = 1;
const SAFETY_CHECKER     = true;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ImageGenResult {
  imageUrl: string;
}

// ── Service ────────────────────────────────────────────────────────────────────

/**
 * Generate a card illustration via the Fal.ai FLUX.1 model.
 *
 * @param prompt     - Text description built by `buildImagePrompt()`.
 * @param masterSeed - The card's string master seed; hashed to a 32-bit int so
 *                     the same card always produces the same image.
 * @returns          Resolves with the URL of the generated image.
 * @throws           If the network request fails or the response is unexpected.
 */
export async function generateImage(
  prompt: string,
  masterSeed: string,
): Promise<ImageGenResult> {
  const seed = hashSeedToInt(masterSeed);

  // Build headers — Authorization is omitted because the proxy adds it server-side.
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (!PROXY_API_URL) {
    throw new Error(
      "Image generation is not configured. Set VITE_IMAGE_API_URL in your .env to route requests through the proxy.",
    );
  }

  const body = JSON.stringify({
    prompt,
    seed,
    image_size: IMAGE_SIZE,
    num_inference_steps: INFERENCE_STEPS,
    guidance_scale: GUIDANCE_SCALE,
    num_images: NUM_IMAGES,
    enable_safety_checker: SAFETY_CHECKER,
  });

  const response = await fetch(API_URL, { method: "POST", headers, body });

  if (!response.ok) {
    let detail = "";
    try {
      const errJson = await response.json();
      detail = errJson?.detail ?? errJson?.error ?? "";
    } catch {
      // ignore parse errors for the error body
    }
    const authHint =
      response.status === 401
        ? " Check that the proxy server has a valid FAL_KEY configured."
        : "";
    throw new Error(
      `Image generation failed: ${response.status} ${response.statusText}${detail ? ` — ${detail}` : ""}${authHint}`,
    );
  }

  const data = await response.json();
  const imageUrl: string | undefined = data?.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error("Image generation succeeded but no image URL was returned.");
  }

  return { imageUrl };
}
