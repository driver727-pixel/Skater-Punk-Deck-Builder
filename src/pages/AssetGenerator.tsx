import { useState } from "react";
import { generateImage, removeBackground } from "../services/imageGen";
import { BOARD_COMPONENT_CATALOG } from "../lib/boardBuilder";

// ── Download helper ────────────────────────────────────────────────────────────

/** Delay in ms before revoking a blob object URL after triggering a download. */
const OBJECT_URL_REVOKE_DELAY_MS = 15_000;

async function downloadAssetImage(imageUrl: string, seedKey: string): Promise<void> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${seedKey}.png`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), OBJECT_URL_REVOKE_DELAY_MS);
}

// ── Prompt template ────────────────────────────────────────────────────────────

function buildAssetPrompt(componentName: string, visualDescription: string): string {
  return (
    `Macro product photography of an electric skateboard ${componentName} -- ${visualDescription} ` +
    `Trading card art in the style of 1995 Fleer Ultra X-Men, isolated perfectly ` +
    `in the center on a pure, solid #00FF00 green-screen background.`
  );
}

// ── Data model rows ────────────────────────────────────────────────────────────

interface AssetItem {
  category: string;
  label: string;
  seedKey: string;
  prompt: string;
}

function buildAssetItems(): AssetItem[] {
  return BOARD_COMPONENT_CATALOG.map((model) => ({
    category: model.category,
    label: `${model.icon} ${model.name}`,
    seedKey: model.seedKey,
    prompt: buildAssetPrompt(model.name, model.description),
  }));
}

const ALL_ITEMS = buildAssetItems();

// ── Component state ────────────────────────────────────────────────────────────

type ItemStatus = "idle" | "generating" | "removing-bg" | "done" | "error";

interface ItemState {
  status: ItemStatus;
  imageUrl?: string;
  error?: string;
}

export function AssetGenerator() {
  const [states, setStates] = useState<Record<string, ItemState>>(
    Object.fromEntries(ALL_ITEMS.map((i) => [i.seedKey, { status: "idle" }]))
  );
  const [runningAll, setRunningAll] = useState(false);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  function setItemState(seedKey: string, patch: Partial<ItemState>) {
    setStates((prev) => ({
      ...prev,
      [seedKey]: { ...prev[seedKey], ...patch },
    }));
  }

  async function generateOne(item: AssetItem) {
    setItemState(item.seedKey, { status: "generating", imageUrl: undefined, error: undefined });
    try {
      const raw = await generateImage(item.prompt, item.seedKey, {
        imageSize: "square_hd",
      });
      setItemState(item.seedKey, { status: "removing-bg" });
      const transparent = await removeBackground(raw.imageUrl);
      setItemState(item.seedKey, { status: "done", imageUrl: transparent.imageUrl });
    } catch (err) {
      setItemState(item.seedKey, {
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function generateAll() {
    setRunningAll(true);
    for (const item of ALL_ITEMS) {
      await generateOne(item);
    }
    setRunningAll(false);
  }

  async function downloadOne(item: AssetItem) {
    const url = states[item.seedKey]?.imageUrl;
    if (!url) return;
    setDownloading((prev) => ({ ...prev, [item.seedKey]: true }));
    try {
      await downloadAssetImage(url, item.seedKey);
    } finally {
      setDownloading((prev) => ({ ...prev, [item.seedKey]: false }));
    }
  }

  async function downloadAll() {
    const doneItems = ALL_ITEMS.filter((i) => states[i.seedKey]?.status === "done");
    for (const item of doneItems) {
      await downloadOne(item);
    }
  }

  const doneCount = ALL_ITEMS.filter((i) => states[i.seedKey]?.status === "done").length;
  const loadingCount = ALL_ITEMS.filter(
    (i) => states[i.seedKey]?.status === "generating" || states[i.seedKey]?.status === "removing-bg",
  ).length;

  const categories = Array.from(new Set(ALL_ITEMS.map((i) => i.category)));

  return (
    <div className="page asset-gen-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎨 Asset Generator</h1>
          <p className="page-sub">
            Dev tool — generates green-screen board component images via fal.ai.
            Click <strong>⬇ Download</strong> on any image to save it to{" "}
            <code>public/assets/boards/</code> with the correct filename.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="asset-gen-counter">
            {doneCount} / {ALL_ITEMS.length} done
          </span>
          {doneCount > 0 && (
            <button
              className="btn-outline"
              onClick={downloadAll}
              disabled={runningAll || loadingCount > 0}
            >
              ⬇ Download All
            </button>
          )}
          <button
            className="btn-primary"
            onClick={generateAll}
            disabled={runningAll || loadingCount > 0}
          >
            {runningAll ? "⏳ Generating…" : "⚡ Generate All"}
          </button>
        </div>
      </div>

      {categories.map((cat) => {
        const catItems = ALL_ITEMS.filter((i) => i.category === cat);
        return (
          <section key={cat} className="asset-gen-section">
            <h2 className="asset-gen-section-title">{cat.endsWith("s") ? cat : `${cat}s`}</h2>
            <div className="asset-gen-grid">
              {catItems.map((item) => {
                const state = states[item.seedKey];
                return (
                  <div key={item.seedKey} className="asset-gen-card">
                    <div className="asset-gen-card-label">{item.label}</div>

                    <div className="asset-gen-preview">
                      {state.status === "idle" && (
                        <span className="asset-gen-placeholder">No image yet</span>
                      )}
                      {state.status === "generating" && (
                        <span className="asset-gen-spinner">⏳ Generating…</span>
                      )}
                      {state.status === "removing-bg" && (
                        <span className="asset-gen-spinner">✂️ Removing background…</span>
                      )}
                      {state.status === "done" && state.imageUrl && (
                        <img
                          src={state.imageUrl}
                          alt={item.label}
                          className="asset-gen-img"
                          title={`${item.seedKey}.png`}
                        />
                      )}
                      {state.status === "error" && (
                        <span className="asset-gen-error" title={state.error}>
                          ✗ Error
                        </span>
                      )}
                    </div>

                    <div className="asset-gen-card-actions">
                      <button
                        className="btn-outline"
                        onClick={() => generateOne(item)}
                        disabled={state.status === "generating" || state.status === "removing-bg" || runningAll}
                        title={item.prompt}
                      >
                        {state.status === "generating"
                          ? "⏳ Generating…"
                          : state.status === "removing-bg"
                          ? "✂️ Removing BG…"
                          : state.status === "done"
                          ? "↺ Regenerate"
                          : "▶ Generate"}
                      </button>
                      {state.status === "done" && state.imageUrl && (
                        <button
                          className="btn-primary"
                          onClick={() => downloadOne(item)}
                          disabled={!!downloading[item.seedKey]}
                          title={`Save as ${item.seedKey}.png`}
                        >
                          {downloading[item.seedKey] ? "⏳ Saving…" : "⬇ Download"}
                        </button>
                      )}
                      {state.status === "error" && (
                        <span className="asset-gen-error-msg">{state.error}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
