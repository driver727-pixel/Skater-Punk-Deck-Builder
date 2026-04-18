import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  getDocs,
  setDoc,
  serverTimestamp,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  deleteField,
  type DocumentSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, auth, storage } from "../lib/firebase";
import { TIERS, type TierLevel } from "../lib/tiers";
import { resolveApiUrl } from "../lib/apiUrls";
import { FACTION_LORE } from "../lib/lore";
import { factionSlug } from "../lib/factionSlug";

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  tier?: TierLevel;
  isAdmin?: boolean;
  updatedAt?: { seconds: number };
}

const PAGE_SIZE = 20;

const ADMIN_API_URL = resolveApiUrl(
  import.meta.env.VITE_ADMIN_API_URL as string | undefined,
  "/api/admin/create-user",
);

function resolveAdminActionUrl(pathname: string): string {
  const configuredUrl = (import.meta.env.VITE_ADMIN_API_URL as string | undefined)?.trim();
  if (!configuredUrl) return pathname;
  try {
    return new URL(pathname, configuredUrl).toString();
  } catch {
    return pathname;
  }
}

const ADMIN_DELETE_API_URL = resolveAdminActionUrl("/api/admin/delete-user");

const TIER_LABELS: Record<string, string> = {
  free: TIERS.free.name,
  tier2: `${TIERS.tier2.name} (${TIERS.tier2.price})`,
  tier3: `${TIERS.tier3.name} (${TIERS.tier3.price})`,
};

export function Admin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [successUid, setSuccessUid] = useState<string | null>(null);
  const successTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current !== null) clearTimeout(successTimerRef.current);
    };
  }, []);

  // ── Create user ────────────────────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const currentUserUid = auth?.currentUser?.uid ?? null;

  const handleCreateUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    if (!auth?.currentUser) {
      setCreateError("You must be signed in to create users.");
      return;
    }
    setCreating(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(ADMIN_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email: newEmail.trim(), password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create user.");
      } else {
        setCreateSuccess(`✓ Account created for ${data.email}`);
        setNewEmail("");
        setNewPassword("");
      }
    } catch (err) {
      console.error("Create user error:", err);
      setCreateError("Network error — could not reach the server.");
    } finally {
      setCreating(false);
    }
  }, [newEmail, newPassword]);

  // ── Fetch user count ───────────────────────────────────────────────────────
  useEffect(() => {
    getCountFromServer(collection(db, "userProfiles"))
      .then((snap) => setTotalUsers(snap.data().count))
      .catch(() => {});
  }, []);

  // ── Load first page ────────────────────────────────────────────────────────
  const loadUsers = useCallback(async (after?: DocumentSnapshot) => {
    setLoading(true);
    setError("");
    try {
      const q = after
        ? query(collection(db, "userProfiles"), orderBy("updatedAt", "desc"), startAfter(after), limit(PAGE_SIZE))
        : query(collection(db, "userProfiles"), orderBy("updatedAt", "desc"), limit(PAGE_SIZE));
      const snap = await getDocs(q);
      const batch = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
      setUsers((prev) => (after ? [...prev, ...batch] : batch));
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      setError("Failed to load users. Make sure you have admin access.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Filter by search ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users);
      return;
    }
    const q = search.toLowerCase();
    setFilteredUsers(
      users.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.displayName?.toLowerCase().includes(q) ||
          u.uid.toLowerCase().includes(q)
      )
    );
  }, [search, users]);

  // ── Set tier for a user ────────────────────────────────────────────────────
  const handleSetTier = async (uid: string, newTier: TierLevel) => {
    setSavingUid(uid);
    setSuccessUid(null);
    try {
      await setDoc(doc(db, "userProfiles", uid), { tier: newTier, updatedAt: serverTimestamp() }, { merge: true });
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, tier: newTier } : u))
      );
      setSuccessUid(uid);
      successTimerRef.current = window.setTimeout(() => setSuccessUid(null), 2000);
    } catch (err) {
      console.error("Failed to set tier:", err);
      setError(`Failed to update tier for ${uid}.`);
    } finally {
      setSavingUid(null);
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (!auth?.currentUser) {
      setError("You must be signed in to delete users.");
      return;
    }
    if (uid === auth.currentUser.uid) {
      setError("You cannot delete the account you are currently using.");
      return;
    }
    if (!window.confirm(`Delete the account for ${email}? This removes their sign-in and stored data.`)) return;
    setDeletingUid(uid);
    setError("");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(ADMIN_DELETE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to delete user.");
        return;
      }
      setUsers((prev) => prev.filter((user) => user.uid !== uid));
      setFilteredUsers((prev) => prev.filter((user) => user.uid !== uid));
      setTotalUsers((prev) => (prev === null ? prev : Math.max(0, prev - 1)));
    } catch (err) {
      console.error("Delete user error:", err);
      setError("Network error — could not reach the server.");
    } finally {
      setDeletingUid(null);
    }
  };

  const tierOptions: TierLevel[] = ["free", "tier2", "tier3"];

  // ── Faction image upload ───────────────────────────────────────────────────
  const [selectedFaction, setSelectedFaction] = useState(FACTION_LORE[0].name);
  const [factionImageFile, setFactionImageFile] = useState<File | null>(null);
  const [factionImagePreview, setFactionImagePreview] = useState<string | null>(null);
  const [factionCurrentImages, setFactionCurrentImages] = useState<Record<string, string>>({});
  const [factionCurrentExts, setFactionCurrentExts] = useState<Record<string, string>>({});
  const [factionUploadStatus, setFactionUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [factionUploadError, setFactionUploadError] = useState("");
  const factionFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!db) return;
    getDocs(collection(db, "factionImages")).then((snap) => {
      const imageMap: Record<string, string> = {};
      const extMap: Record<string, string> = {};
      snap.forEach((d) => {
        const data = d.data();
        if (typeof data.imageUrl === "string") imageMap[d.id] = data.imageUrl;
        if (typeof data.imageExt === "string") extMap[d.id] = data.imageExt;
      });
      setFactionCurrentImages(imageMap);
      setFactionCurrentExts(extMap);
    }).catch(console.error);
  }, []);

  const handleFactionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFactionImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setFactionImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFactionImagePreview(null);
    }
  };

  const handleFactionImageUpload = async () => {
    if (!factionImageFile || !storage || !db || !auth?.currentUser) return;
    setFactionUploadStatus("uploading");
    setFactionUploadError("");
    try {
      const slug = factionSlug(selectedFaction);
      const ext = factionImageFile.name.split(".").pop()?.toLowerCase() ?? "png";
      const storageRef = ref(storage, `factionImages/${slug}.${ext}`);
      await uploadBytes(storageRef, factionImageFile, { contentType: factionImageFile.type });
      const downloadUrl = await getDownloadURL(storageRef);
      await setDoc(doc(db, "factionImages", slug), {
        factionName: selectedFaction,
        imageUrl: downloadUrl,
        imageExt: ext,
        updatedAt: serverTimestamp(),
      });
      setFactionCurrentImages((prev) => ({ ...prev, [slug]: downloadUrl }));
      setFactionCurrentExts((prev) => ({ ...prev, [slug]: ext }));
      setFactionImageFile(null);
      setFactionImagePreview(null);
      if (factionFileInputRef.current) factionFileInputRef.current.value = "";
      setFactionUploadStatus("success");
      setTimeout(() => setFactionUploadStatus("idle"), 2500);
    } catch (err) {
      console.error("Faction image upload error:", err);
      setFactionUploadError("Upload failed — check your connection and try again.");
      setFactionUploadStatus("error");
    }
  };

  const handleFactionImageRemove = async (faction: string) => {
    if (!db || !auth?.currentUser) return;
    if (!window.confirm(`Remove the background image for "${faction}"?`)) return;
    const slug = factionSlug(faction);
    try {
      await setDoc(doc(db, "factionImages", slug), { imageUrl: deleteField(), imageExt: deleteField() }, { merge: true });
      setFactionCurrentImages((prev) => {
        const next = { ...prev };
        delete next[slug];
        return next;
      });
      if (storage) {
        const ext = factionCurrentExts[slug];
        if (ext) {
          try {
            await deleteObject(ref(storage, `factionImages/${slug}.${ext}`));
          } catch (err) {
            console.warn("Could not delete storage object:", err);
          }
        }
      }
    } catch (err) {
      console.error("Faction image remove error:", err);
      setError("Failed to remove faction image.");
    }
  };

  return (
    <div className="page admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙ Admin Panel</h1>
          <p className="page-sub">Manage users and access tiers.</p>
        </div>
      </div>

      <>
          {/* ── Create user ────────────────────────────────────────────────── */}
          <div className="admin-create-user">
            <h2 className="admin-section-title">Create New Account</h2>
            <form className="admin-create-form" onSubmit={handleCreateUser}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <input
                  className="input"
                  type="email"
                  placeholder="Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <input
                  className="input"
                  type="password"
                  placeholder="Password (min. 10 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={10}
                  autoComplete="new-password"
                />
              </div>
              <button className="btn-primary" type="submit" disabled={creating}>
                {creating ? "⏳ Creating…" : "Create Account"}
              </button>
            </form>
            {createError && <p className="admin-error">{createError}</p>}
            {createSuccess && <p className="admin-saved" style={{ marginTop: 8 }}>{createSuccess}</p>}
          </div>

          {/* ── Faction Images ─────────────────────────────────────────────── */}
          <div className="admin-create-user">
            <h2 className="admin-section-title">Faction Background Images</h2>
            <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10 }}>
              Upload an image to display behind a faction's description on the Factions page.
            </p>
            <div className="admin-create-form" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div className="form-group" style={{ flex: "1 1 200px", marginBottom: 0 }}>
                <select
                  className="input"
                  value={selectedFaction}
                  onChange={(e) => setSelectedFaction(e.target.value)}
                >
                  {FACTION_LORE.map((f) => (
                    <option key={f.name} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: "2 1 240px", marginBottom: 0 }}>
                <input
                  ref={factionFileInputRef}
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={handleFactionFileChange}
                  style={{ cursor: "pointer" }}
                />
              </div>
              <button
                className="btn-primary"
                type="button"
                disabled={!factionImageFile || factionUploadStatus === "uploading"}
                onClick={handleFactionImageUpload}
              >
                {factionUploadStatus === "uploading" ? "⏳ Uploading…" : "Upload Image"}
              </button>
            </div>
            {factionImagePreview && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 4 }}>Preview:</p>
                <img
                  src={factionImagePreview}
                  alt="Preview"
                  style={{ maxHeight: 120, borderRadius: 4, border: "1px solid var(--border)" }}
                />
              </div>
            )}
            {factionUploadStatus === "success" && (
              <p className="admin-saved" style={{ marginTop: 8 }}>✓ Image uploaded successfully.</p>
            )}
            {factionUploadStatus === "error" && (
              <p className="admin-error" style={{ marginTop: 8 }}>{factionUploadError}</p>
            )}

            {/* Existing faction images */}
            {Object.keys(factionCurrentImages).length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 8 }}>Current faction images:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {FACTION_LORE.filter((f) => factionCurrentImages[factionSlug(f.name)]).map((f) => (
                    <div
                      key={f.name}
                      style={{
                        position: "relative",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        overflow: "hidden",
                        width: 120,
                      }}
                    >
                      <img
                        src={factionCurrentImages[factionSlug(f.name)]}
                        alt={f.name}
                        style={{ width: "100%", height: 72, objectFit: "cover", display: "block" }}
                      />
                      <div style={{ padding: "4px 6px", fontSize: 10, color: "var(--text-dim)", background: "var(--bg2)" }}>
                        {f.name}
                      </div>
                      <button
                        className="btn-outline admin-delete-user-btn"
                        style={{ width: "100%", borderRadius: 0, fontSize: 11 }}
                        onClick={() => handleFactionImageRemove(f.name)}
                      >
                        🗑 Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Stats row ──────────────────────────────────────────────────── */}
          <div className="admin-stats-row">
            <div className="admin-stat-card">
              <span className="admin-stat-label">Total Users</span>
              <span className="admin-stat-value">
                {totalUsers !== null ? totalUsers : "—"}
              </span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Loaded</span>
              <span className="admin-stat-value">{users.length}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Tier3 (Deck Master)</span>
              <span className="admin-stat-value">
                {users.filter((u) => u.tier === "tier3" || u.isAdmin).length}
              </span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-label">Tier2 (Street Creator)</span>
              <span className="admin-stat-value">
                {users.filter((u) => u.tier === "tier2" && !u.isAdmin).length}
              </span>
            </div>
          </div>

          {/* ── Search ─────────────────────────────────────────────────────── */}
          <div className="admin-search-row">
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <input
                className="input"
                type="text"
                placeholder="Search by email, name, or UID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="btn-outline"
              onClick={() => { setSearch(""); setUsers([]); setLastDoc(null); loadUsers(); }}
            >
              Refresh
            </button>
          </div>

          {error && <p className="admin-error">{error}</p>}

          {/* ── User table ─────────────────────────────────────────────────── */}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>UID</th>
                  <th>Tier</th>
                  <th>Set Tier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="admin-empty">
                      {search ? "No users match your search." : "No users found."}
                    </td>
                  </tr>
                )}
                {filteredUsers.map((u) => {
                  const effectiveTier: TierLevel = u.isAdmin ? "tier3" : (u.tier ?? "free");
                  return (
                    <tr key={u.uid} className={u.isAdmin ? "admin-row--admin" : ""}>
                      <td>
                        <div className="admin-user-email">
                          {u.email}
                          {u.isAdmin && (
                            <span className="admin-badge admin-badge--admin">ADMIN</span>
                          )}
                        </div>
                        <div className="admin-user-name">{u.displayName}</div>
                      </td>
                      <td>
                        <code className="admin-uid">{u.uid.slice(0, 12)}…</code>
                      </td>
                      <td>
                        <span className={`admin-tier-tag admin-tier-tag--${effectiveTier}`}>
                          {TIER_LABELS[effectiveTier] ?? effectiveTier}
                        </span>
                      </td>
                      <td>
                        {u.isAdmin ? (
                          <span className="admin-saved">Deck Master locked</span>
                        ) : successUid === u.uid ? (
                          <span className="admin-saved">✓ Saved</span>
                        ) : (
                          <div className="admin-tier-select-wrap">
                            <select
                              className="admin-tier-select"
                              value={effectiveTier}
                              disabled={savingUid === u.uid}
                              onChange={(e) =>
                                handleSetTier(u.uid, e.target.value as TierLevel)
                              }
                            >
                              {tierOptions.map((t) => (
                                <option key={t} value={t}>
                                  {TIERS[t].name}
                                </option>
                              ))}
                            </select>
                            {savingUid === u.uid && (
                              <span className="admin-saving">⏳</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-outline admin-delete-user-btn"
                          disabled={deletingUid === u.uid || currentUserUid === u.uid}
                          onClick={() => handleDeleteUser(u.uid, u.email)}
                        >
                          {currentUserUid === u.uid
                            ? "Current account"
                            : deletingUid === u.uid
                              ? "⏳ Deleting…"
                              : "🗑 Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loading && (
              <div className="admin-loading">⏳ Loading users…</div>
            )}
          </div>

          {hasMore && !search && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                className="btn-outline"
                disabled={loading}
                onClick={() => lastDoc && loadUsers(lastDoc)}
              >
                Load More
              </button>
            </div>
          )}
      </>
    </div>
  );
}
