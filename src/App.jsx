import { useState, useEffect, useCallback } from "react";

const CATEGORIES = ["🥩 Meat & Fish", "🥛 Dairy", "🥦 Produce", "🧃 Drinks", "🫙 Condiments", "🍳 Leftovers", "🧊 Frozen", "🥚 Eggs & Other"];
const CATEGORY_COLORS = {
  "🥩 Meat & Fish": "#e07a5f",
  "🥛 Dairy": "#f2cc8f",
  "🥦 Produce": "#81b29a",
  "🧃 Drinks": "#7eb5d6",
  "🫙 Condiments": "#c9a96e",
  "🍳 Leftovers": "#b07fb5",
  "🧊 Frozen": "#88c9e0",
  "🥚 Eggs & Other": "#f4a261",
};

const FAMILY_MEMBERS = [
  { name: "Parent 1", emoji: "👨", color: "#e07a5f" },
  { name: "Parent 2", emoji: "👩", color: "#81b29a" },
  { name: "Child 1", emoji: "🧒", color: "#f2cc8f" },
  { name: "Child 2", emoji: "👧", color: "#7eb5d6" },
  { name: "Guest", emoji: "🙋", color: "#b07fb5" },
];

const POLL_INTERVAL = 3000;

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function FridgeApp() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: CATEGORIES[2], quantity: "1", unit: "", addedBy: "" });
  const [filterCat, setFilterCat] = useState("All");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadItems = useCallback(async () => {
    try {
      const result = await window.storage.get("fridge-items", true);
      const data = result ? JSON.parse(result.value) : [];
      setItems(data);
      setLastUpdated(new Date());
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, []);

  const saveItems = async (updated) => {
    try {
      await window.storage.set("fridge-items", JSON.stringify(updated), true);
      setItems(updated);
      setLastUpdated(new Date());
    } catch (e) {
      showToast("❌ Failed to save");
    }
  };

  useEffect(() => {
    loadItems();
    const interval = setInterval(loadItems, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [loadItems]);

  const addItem = async () => {
    if (!newItem.name.trim()) return;
    const item = {
      id: generateId(),
      name: newItem.name.trim(),
      category: newItem.category,
      quantity: newItem.quantity || "1",
      unit: newItem.unit.trim(),
      addedBy: user.name,
      addedAt: new Date().toISOString(),
    };
    const updated = [...items, item];
    await saveItems(updated);
    setNewItem({ name: "", category: CATEGORIES[2], quantity: "1", unit: "", addedBy: "" });
    setShowAdd(false);
    showToast(`✅ ${item.name} added!`);
  };

  const removeItem = async (id, itemName) => {
    const updated = items.filter((i) => i.id !== id);
    await saveItems(updated);
    showToast(`🗑️ ${itemName} removed`);
  };

  const updateQty = async (id, delta) => {
    const updated = items.map((i) => {
      if (i.id !== id) return i;
      const cur = parseFloat(i.quantity) || 1;
      const next = Math.max(0.5, cur + delta);
      return { ...i, quantity: String(next % 1 === 0 ? next : next.toFixed(1)) };
    });
    await saveItems(updated);
  };

  if (!user) {
    return (
      <div style={styles.loginBg}>
        <div style={styles.loginCard}>
          <div style={styles.fridgeIcon}>🧊</div>
          <h1 style={styles.loginTitle}>FamilyFridge</h1>
          <p style={styles.loginSub}>Who's checking the fridge?</p>
          <div style={styles.memberGrid}>
            {FAMILY_MEMBERS.map((m) => (
              <button key={m.name} style={{ ...styles.memberBtn, borderColor: m.color }} onClick={() => setUser(m)}>
                <span style={styles.memberEmoji}>{m.emoji}</span>
                <span style={{ ...styles.memberName, color: m.color }}>{m.name}</span>
              </button>
            ))}
          </div>
          <p style={styles.sharedNote}>🔗 Shared with all family members in real-time</p>
        </div>
      </div>
    );
  }

  const filtered = filterCat === "All" ? items : items.filter((i) => i.category === filterCat);
  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div style={styles.appBg}>
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🧊</span>
          <div>
            <h1 style={styles.headerTitle}>FamilyFridge</h1>
            <span style={styles.headerSub}>
              {lastUpdated ? `Synced ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Syncing..."}
            </span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={{ ...styles.userBadge, background: user.color + "22", borderColor: user.color }}>
            <span>{user.emoji}</span>
            <span style={{ color: user.color, fontWeight: 600, fontSize: 13 }}>{user.name}</span>
          </div>
          <button style={styles.switchBtn} onClick={() => setUser(null)}>Switch</button>
        </div>
      </header>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        <div style={styles.stat}><span style={styles.statNum}>{items.length}</span><span style={styles.statLabel}>Items</span></div>
        <div style={styles.statDiv} />
        <div style={styles.stat}><span style={styles.statNum}>{Object.keys(items.reduce((a, i) => ({ ...a, [i.category]: 1 }), {})).length}</span><span style={styles.statLabel}>Categories</span></div>
        <div style={styles.statDiv} />
        <div style={styles.stat}><span style={styles.statNum}>{[...new Set(items.map(i => i.addedBy))].length}</span><span style={styles.statLabel}>Contributors</span></div>
      </div>

      {/* Filter pills */}
      <div style={styles.filterRow}>
        {["All", ...CATEGORIES].map((cat) => (
          <button key={cat} onClick={() => setFilterCat(cat)} style={{
            ...styles.filterPill,
            background: filterCat === cat ? (CATEGORY_COLORS[cat] || "#3d5a3e") : "#f0ede8",
            color: filterCat === cat ? "#fff" : "#555",
            fontWeight: filterCat === cat ? 700 : 400,
          }}>{cat}</button>
        ))}
      </div>

      {/* Items */}
      <div style={styles.content}>
        {loading ? (
          <div style={styles.emptyState}><div style={styles.spinner} /></div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 48 }}>🥶</span>
            <p style={styles.emptyText}>Nothing here yet!</p>
            <p style={styles.emptySubText}>Tap + to add items to the fridge</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} style={styles.categorySection}>
              <div style={{ ...styles.catHeader, borderLeftColor: CATEGORY_COLORS[cat] || "#ccc" }}>
                <span style={styles.catName}>{cat}</span>
                <span style={{ ...styles.catCount, background: CATEGORY_COLORS[cat] + "33", color: CATEGORY_COLORS[cat] }}>{catItems.length}</span>
              </div>
              {catItems.map((item) => (
                <div key={item.id} style={styles.itemCard}>
                  <div style={styles.itemMain}>
                    <div style={{ ...styles.itemDot, background: CATEGORY_COLORS[item.category] || "#ccc" }} />
                    <div style={styles.itemInfo}>
                      <span style={styles.itemName}>{item.name}</span>
                      <span style={styles.itemMeta}>Added by {item.addedBy} · {new Date(item.addedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={styles.itemActions}>
                    <button style={styles.qtyBtn} onClick={() => updateQty(item.id, -0.5)}>−</button>
                    <span style={styles.qtyDisplay}>{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span>
                    <button style={styles.qtyBtn} onClick={() => updateQty(item.id, 0.5)}>+</button>
                    <button style={styles.removeBtn} onClick={() => removeItem(item.id, item.name)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button style={styles.fab} onClick={() => setShowAdd(true)}>＋</button>

      {/* Add modal */}
      {showAdd && (
        <div style={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Add to Fridge</h2>
            <label style={styles.label}>Item name *</label>
            <input style={styles.input} placeholder="e.g. Whole milk, Chicken breast…" value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && addItem()} autoFocus />
            <label style={styles.label}>Category</label>
            <select style={styles.input} value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Quantity</label>
                <input style={styles.input} type="number" min="0.5" step="0.5" value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Unit (optional)</label>
                <input style={styles.input} placeholder="kg, L, pcs…" value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
              <button style={{ ...styles.addBtn, opacity: newItem.name.trim() ? 1 : 0.5 }} onClick={addItem}>Add Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  loginBg: { minHeight: "100vh", background: "linear-gradient(135deg, #e8f5e2 0%, #d4edda 50%, #c8e6c9 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif" },
  loginCard: { background: "#fff", borderRadius: 24, padding: "40px 36px", maxWidth: 420, width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" },
  fridgeIcon: { fontSize: 56, marginBottom: 8 },
  loginTitle: { fontFamily: "'Georgia', serif", fontSize: 32, color: "#2d4a2d", margin: "0 0 6px" },
  loginSub: { color: "#7a9b7a", fontSize: 15, marginBottom: 28 },
  memberGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
  memberBtn: { border: "2px solid", borderRadius: 14, padding: "14px 10px", background: "#fafafa", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "transform 0.15s", "&:hover": { transform: "scale(1.04)" } },
  memberEmoji: { fontSize: 32 },
  memberName: { fontSize: 13, fontWeight: 600 },
  sharedNote: { fontSize: 12, color: "#aaa", marginTop: 8 },
  appBg: { minHeight: "100vh", background: "#f5f2ed", fontFamily: "'Georgia', serif", paddingBottom: 100 },
  toast: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#2d4a2d", color: "#fff", padding: "10px 22px", borderRadius: 40, zIndex: 9999, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" },
  header: { background: "#fff", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ece8e0", position: "sticky", top: 0, zIndex: 10 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerIcon: { fontSize: 28 },
  headerTitle: { margin: 0, fontSize: 20, color: "#2d4a2d", fontFamily: "'Georgia', serif" },
  headerSub: { fontSize: 11, color: "#aaa", display: "block" },
  headerRight: { display: "flex", alignItems: "center", gap: 8 },
  userBadge: { border: "1.5px solid", borderRadius: 20, padding: "5px 12px", display: "flex", gap: 6, alignItems: "center", fontSize: 13 },
  switchBtn: { background: "none", border: "1px solid #ddd", borderRadius: 20, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#888" },
  statsBar: { background: "#fff", borderBottom: "1px solid #ece8e0", display: "flex", justifyContent: "center", gap: 0 },
  stat: { display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 32px" },
  statNum: { fontSize: 22, fontWeight: 700, color: "#2d4a2d" },
  statLabel: { fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: 1 },
  statDiv: { width: 1, background: "#ece8e0", margin: "10px 0" },
  filterRow: { display: "flex", gap: 8, overflowX: "auto", padding: "14px 16px", scrollbarWidth: "none" },
  filterPill: { border: "none", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" },
  content: { padding: "8px 16px" },
  categorySection: { marginBottom: 20 },
  catHeader: { borderLeft: "4px solid", paddingLeft: 10, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 },
  catName: { fontWeight: 700, fontSize: 14, color: "#3a3a3a" },
  catCount: { borderRadius: 10, padding: "2px 8px", fontSize: 12, fontWeight: 700 },
  itemCard: { background: "#fff", borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  itemMain: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  itemDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  itemInfo: { display: "flex", flexDirection: "column", minWidth: 0 },
  itemName: { fontSize: 15, color: "#2d2d2d", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  itemMeta: { fontSize: 11, color: "#aaa", marginTop: 2 },
  itemActions: { display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
  qtyBtn: { background: "#f0ede8", border: "none", borderRadius: 8, width: 28, height: 28, fontSize: 16, cursor: "pointer", color: "#555", display: "flex", alignItems: "center", justifyContent: "center" },
  qtyDisplay: { minWidth: 36, textAlign: "center", fontSize: 14, fontWeight: 600, color: "#2d4a2d" },
  removeBtn: { background: "#fee2e2", border: "none", borderRadius: 8, width: 28, height: 28, fontSize: 12, cursor: "pointer", color: "#e07a5f", marginLeft: 4 },
  fab: { position: "fixed", bottom: 28, right: 24, width: 58, height: 58, borderRadius: "50%", background: "#3d5a3e", color: "#fff", fontSize: 30, border: "none", cursor: "pointer", boxShadow: "0 6px 24px rgba(61,90,62,0.4)", zIndex: 100 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 },
  modal: { background: "#fff", borderRadius: "20px 20px 0 0", padding: "28px 24px 36px", width: "100%", maxWidth: 500 },
  modalTitle: { margin: "0 0 20px", fontSize: 20, color: "#2d4a2d", fontFamily: "'Georgia', serif" },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4, marginTop: 14 },
  input: { width: "100%", border: "1.5px solid #e0dbd4", borderRadius: 10, padding: "10px 12px", fontSize: 15, fontFamily: "'Georgia', serif", background: "#faf9f7", boxSizing: "border-box", outline: "none" },
  modalActions: { display: "flex", gap: 10, marginTop: 24 },
  cancelBtn: { flex: 1, padding: "12px", border: "1.5px solid #ddd", borderRadius: 10, background: "none", fontSize: 15, cursor: "pointer", color: "#888" },
  addBtn: { flex: 2, padding: "12px", border: "none", borderRadius: 10, background: "#3d5a3e", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Georgia', serif" },
  emptyState: { textAlign: "center", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  emptyText: { fontSize: 18, color: "#555", margin: 0, fontWeight: 600 },
  emptySubText: { fontSize: 14, color: "#aaa", margin: 0 },
  spinner: { width: 36, height: 36, border: "3px solid #e0dbd4", borderTop: "3px solid #3d5a3e", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};