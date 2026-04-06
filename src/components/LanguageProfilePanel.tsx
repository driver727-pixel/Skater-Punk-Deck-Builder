/**
 * LanguageProfilePanel.tsx
 * ─────────────────────────
 * Compact panel rendered inside CardForge that lets users load or clear a
 * Craftlingua language_profile.json export.
 *
 * Supported input methods:
 *  - Click/drag to upload a .json file
 *  - Paste raw JSON into the textarea
 *
 * Once a profile is loaded it is held in LanguageContext (localStorage-backed)
 * and used automatically for all subsequent card generations.
 */

import { useCallback, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { parseCraftlinguaProfile } from "../lib/languageIngestion";
import type { CraftlinguaEnvelope } from "../lib/types";

export function LanguageProfilePanel() {
  const { profile, vocabulary, loadProfile, clearProfile } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Parsing helpers ──────────────────────────────────────────────────────────

  const applyProfile = useCallback((raw: unknown, source: string) => {
    const parsed = parseCraftlinguaProfile(raw);
    if (!parsed) {
      setError(`${source} does not appear to be a valid Craftlingua language profile.`);
      return;
    }
    loadProfile(parsed as CraftlinguaEnvelope);
    setError("");
    setPasteText("");
    setExpanded(false);
  }, [loadProfile]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      setError("Please select a .json file.");
      return;
    }
    try {
      const text = await file.text();
      applyProfile(JSON.parse(text) as unknown, "File");
    } catch {
      setError("Failed to read or parse the file.");
    }
  }, [applyProfile]);

  const handlePaste = useCallback(() => {
    try {
      applyProfile(JSON.parse(pasteText.trim()) as unknown, "JSON");
    } catch {
      setError("Invalid JSON — please check the format.");
    }
  }, [pasteText, applyProfile]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (profile && !expanded) {
    return (
      <div className="lang-panel lang-panel--loaded">
        <div className="lang-panel-info">
          <span className="lang-panel-badge">🌐</span>
          <span className="lang-panel-name">{profile.language.name}</span>
          <span className="lang-panel-code">({profile.language.code})</span>
          <span className="lang-panel-count">{vocabulary.length} words</span>
        </div>
        <div className="lang-panel-actions">
          <button className="btn-outline btn-sm" onClick={() => setExpanded(true)}>
            ↺ Change
          </button>
          <button className="btn-danger btn-sm" onClick={clearProfile}>
            ✕ Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lang-panel">
      <div className="lang-panel-header" onClick={() => setExpanded((v) => !v)}>
        <span className="lang-panel-title">
          🌐 Language Profile {profile ? `— ${profile.language.name}` : "(none)"}
        </span>
        <span className="lang-panel-chevron">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="lang-panel-body">
          <p className="lang-panel-desc">
            Load a <code>language_profile.json</code> exported from Craftlingua to generate
            phonetically consistent names, catchphrases, and conlang lore for your cards.{" "}
            <a href="/language_profile_example.json" target="_blank" rel="noopener noreferrer">
              Download example ↗
            </a>
          </p>

          {/* Drop zone */}
          <div
            className={`lang-dropzone${dragging ? " lang-dropzone--active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) void handleFile(f); }}
            onClick={() => fileRef.current?.click()}
          >
            <span>{dragging ? "Drop to load" : "📂 Drop file or click to browse"}</span>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }}
            />
          </div>

          <div className="lang-divider"><span>or paste JSON</span></div>

          <textarea
            className="lang-textarea"
            rows={5}
            placeholder={'{ "source": "craftlingua", "language": { "name": "...", "code": "..." }, "vocabulary": [...] }'}
            value={pasteText}
            onChange={(e) => { setPasteText(e.target.value); setError(""); }}
          />

          {error && <p className="lang-error">{error}</p>}

          <div className="lang-panel-row">
            <button
              className="btn-primary btn-sm"
              onClick={handlePaste}
              disabled={!pasteText.trim()}
            >
              Load Profile
            </button>
            {profile && (
              <button className="btn-outline btn-sm" onClick={() => setExpanded(false)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
