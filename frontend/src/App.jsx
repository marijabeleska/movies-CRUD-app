import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function clampRating(v) {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  if (Number.isNaN(n)) return "";
  return Math.max(0, Math.min(10, n));
}

export default function App() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // newest | title | rating
  const [status, setStatus] = useState("");

  const [form, setForm] = useState({ title: "", year: 2020, genre: "", rating: 7.0 });
  const [editingId, setEditingId] = useState(null);

  async function loadMovies() {
    setStatus("Loading...");
    try {
      const res = await fetch(`${API_BASE}/api/movies`);
      const data = await res.json();
      setMovies(data);
      setStatus("");
    } catch (e) {
      setStatus("Cannot reach backend. Is FastAPI running on :8000?");
    }
  }

  useEffect(() => {
    loadMovies();
  }, []);

  const allGenres = useMemo(() => {
    const set = new Set(movies.map((m) => m.genre).filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [movies]);

  const visibleMovies = useMemo(() => {
    let list = [...movies];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.genre.toLowerCase().includes(q) ||
          String(m.year).includes(q)
      );
    }

    if (genreFilter !== "All") {
      list = list.filter((m) => m.genre === genreFilter);
    }

    if (sortBy === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    } else {
      // newest (id desc already, but we keep it)
      list.sort((a, b) => b.id - a.id);
    }

    return list;
  }, [movies, query, genreFilter, sortBy]);

  function resetForm() {
    setForm({ title: "", year: 2020, genre: "", rating: 7.0 });
    setEditingId(null);
  }

  async function submit(e) {
    e.preventDefault();

    const payload = {
      title: form.title.trim(),
      year: Number(form.year),
      genre: form.genre.trim(),
      rating: form.rating === "" ? null : Number(form.rating),
    };

    if (!payload.title || !payload.genre) {
      setStatus("Title and Genre are required.");
      return;
    }

    setStatus(editingId ? "Updating..." : "Creating...");

    try {
      if (editingId) {
        await fetch(`${API_BASE}/api/movies/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${API_BASE}/api/movies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      await loadMovies();
    } catch (e) {
      setStatus("Request failed. Check backend logs.");
    }
  }

  async function removeMovie(id) {
    if (!confirm("Delete this movie?")) return;
    setStatus("Deleting...");
    try {
      await fetch(`${API_BASE}/api/movies/${id}`, { method: "DELETE" });
      await loadMovies();
    } catch (e) {
      setStatus("Delete failed. Check backend logs.");
    }
  }

  function startEdit(m) {
    setEditingId(m.id);
    setForm({
      title: m.title,
      year: m.year,
      genre: m.genre,
      rating: m.rating ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const stats = useMemo(() => {
    const count = movies.length;
    const avg =
      count === 0
        ? null
        : (
            movies.reduce((acc, m) => acc + (m.rating ?? 0), 0) /
            movies.filter((m) => m.rating !== null && m.rating !== undefined).length
          ) || null;
    return { count, avg: avg ? avg.toFixed(1) : "—" };
  }, [movies]);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.icon}>🎬</div>
          <div>
            <h1 style={styles.h1}>Movies CRUD</h1>
            <div style={styles.sub}>
              Frontend (React) → Backend (FastAPI) → Database (PostgreSQL)
            </div>
          </div>
        </div>

        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Movies</div>
            <div style={styles.statValue}>{stats.count}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Avg rating</div>
            <div style={styles.statValue}>{stats.avg}</div>
          </div>
        </div>
      </header>

      <main style={styles.grid}>
        <section style={styles.card}>
          <div style={styles.cardTitleRow}>
            <h2 style={styles.h2}>{editingId ? "Edit movie" : "Add movie"}</h2>
            {editingId && (
              <span style={styles.badgeWarn}>Editing #{editingId}</span>
            )}
          </div>

          <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <label style={styles.label}>
              Title
              <input
                style={styles.input}
                placeholder="e.g. Interstellar"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </label>

            <div style={styles.row2}>
              <label style={styles.label}>
                Year
                <input
                  style={styles.input}
                  type="number"
                  min="1888"
                  max="2100"
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                  required
                />
              </label>

              <label style={styles.label}>
                Genre
                <input
                  style={styles.input}
                  placeholder="e.g. Sci-Fi"
                  value={form.genre}
                  onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                  required
                />
              </label>
            </div>

            <label style={styles.label}>
              Rating (0–10)
              <input
                style={styles.input}
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={form.rating}
                onChange={(e) => setForm((f) => ({ ...f, rating: clampRating(e.target.value) }))}
              />
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={styles.primaryBtn} type="submit">
                {editingId ? "Save changes" : "Create"}
              </button>
              <button style={styles.ghostBtn} type="button" onClick={resetForm}>
                {editingId ? "Cancel" : "Clear"}
              </button>
            </div>

            {status && <div style={styles.status}>{status}</div>}
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.listHeader}>
            <h2 style={styles.h2}>Movies</h2>
            <button style={styles.ghostBtn} onClick={loadMovies}>Refresh</button>
          </div>

          <div style={styles.filters}>
            <input
              style={styles.input}
              placeholder="Search title, genre, year..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <select style={styles.input} value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}>
              {allGenres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <select style={styles.input} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Sort: newest</option>
              <option value="title">Sort: title</option>
              <option value="rating">Sort: rating</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {visibleMovies.length === 0 ? (
              <div style={styles.empty}>
                No movies found. Try adding one or adjusting filters.
              </div>
            ) : (
              visibleMovies.map((m) => (
                <div key={m.id} style={styles.movieCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={styles.movieTitle}>
                        {m.title} <span style={styles.muted}>({m.year})</span>
                      </div>
                      <div style={styles.metaRow}>
                        <span style={styles.badge}>{m.genre}</span>
                        <span style={styles.pill}>⭐ {m.rating ?? "N/A"}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button style={styles.ghostBtn} onClick={() => startEdit(m)}>Edit</button>
                      <button style={styles.dangerBtn} onClick={() => removeMovie(m.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        Movies CRUD • React + FastAPI + PostgreSQL
      </footer>
    </div>
  );
}

const styles = {
  page: { maxWidth: 1100, margin: "24px auto", padding: "0 16px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    padding: "18px 18px",
    border: "1px solid #e6e6e6",
    borderRadius: 16,
    background: "linear-gradient(135deg, #f8f9ff, #ffffff)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  },
  brand: { display: "flex", gap: 12, alignItems: "center" },
  icon: {
    width: 44, height: 44, borderRadius: 14,
    display: "grid", placeItems: "center",
    background: "#111827", color: "white", fontSize: 22,
  },
  h1: { margin: 0, fontSize: 30, letterSpacing: -0.5 },
  sub: { opacity: 0.72, marginTop: 2 },

  stats: { display: "flex", gap: 10 },
  statCard: { padding: "10px 12px", border: "1px solid #e6e6e6", borderRadius: 12, minWidth: 110, background: "white" },
  statLabel: { fontSize: 12, opacity: 0.7 },
  statValue: { fontSize: 20, fontWeight: 700 },

  grid: { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, marginTop: 16 },
  card: {
    border: "1px solid #e6e6e6",
    borderRadius: 16,
    padding: 16,
    background: "white",
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  },

  cardTitleRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  h2: { margin: "0 0 10px 0", fontSize: 18 },

  label: { display: "grid", gap: 6, fontSize: 13, opacity: 0.9 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #dcdcdc",
    outline: "none",
    fontSize: 14,
    background: "white",
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },

  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #111827",
    background: "#111827",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  ghostBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #dcdcdc",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  dangerBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ef4444",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },

  status: { marginTop: 6, fontSize: 13, opacity: 0.8 },
  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  filters: { display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 10 },

  movieCard: { padding: 14, borderRadius: 14, border: "1px solid #eeeeee", background: "#fff" },
  movieTitle: { fontSize: 16, fontWeight: 800 },
  metaRow: { display: "flex", gap: 10, marginTop: 6, alignItems: "center" },
  badge: { padding: "4px 10px", borderRadius: 999, background: "#f3f4f6", fontSize: 12, fontWeight: 700 },
  pill: { padding: "4px 10px", borderRadius: 999, border: "1px solid #e5e7eb", fontSize: 12, fontWeight: 700 },
  badgeWarn: { padding: "4px 10px", borderRadius: 999, background: "#fff7ed", border: "1px solid #fed7aa", fontSize: 12, fontWeight: 700 },

  empty: { padding: 14, borderRadius: 14, border: "1px dashed #cfcfcf", opacity: 0.75 },
  muted: { opacity: 0.6 },
  footer: { padding: "16px 2px", opacity: 0.6, fontSize: 12 },
};
