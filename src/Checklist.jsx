import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { DeleteOutlined, CheckOutlined, EditOutlined } from "@ant-design/icons";

const CATS = [
  "ปลั๊กและสวิตช์",
  "เครื่องใช้ไฟฟ้า",
  "เฟอร์นิเจอร์",
  "วัสดุก่อสร้าง",
  "ห้องน้ำ",
  "ครัว",
  "ของตกแต่ง",
  "อื่นๆ",
];

const CAT_COLORS = {
  "ปลั๊กและสวิตช์": "#E8F4FD",
  "เครื่องใช้ไฟฟ้า": "#FEF3C7",
  "เฟอร์นิเจอร์": "#F0FDF4",
  "วัสดุก่อสร้าง": "#FFF7ED",
  "ห้องน้ำ": "#EEF2FF",
  "ครัว": "#FDF2F8",
  "ของตกแต่ง": "#F0F9FF",
  "อื่นๆ": "#F4F4F5",
};

const CAT_TEXT = {
  "ปลั๊กและสวิตช์": "#1D4ED8",
  "เครื่องใช้ไฟฟ้า": "#92400E",
  "เฟอร์นิเจอร์": "#166534",
  "วัสดุก่อสร้าง": "#9A3412",
  "ห้องน้ำ": "#3730A3",
  "ครัว": "#86198F",
  "ของตกแต่ง": "#0369A1",
  "อื่นๆ": "#3F3F46",
};

const CAT_COLORS_DARK = {
  "ปลั๊กและสวิตช์": "rgba(59, 130, 246, 0.18)",
  "เครื่องใช้ไฟฟ้า": "rgba(245, 158, 11, 0.18)",
  "เฟอร์นิเจอร์": "rgba(34, 197, 94, 0.18)",
  "วัสดุก่อสร้าง": "rgba(249, 115, 22, 0.18)",
  "ห้องน้ำ": "rgba(99, 102, 241, 0.18)",
  "ครัว": "rgba(236, 72, 153, 0.18)",
  "ของตกแต่ง": "rgba(14, 165, 233, 0.18)",
  "อื่นๆ": "rgba(255, 255, 255, 0.08)",
};

const CAT_TEXT_DARK = {
  "ปลั๊กและสวิตช์": "#93C5FD",
  "เครื่องใช้ไฟฟ้า": "#FDE68A",
  "เฟอร์นิเจอร์": "#86EFAC",
  "วัสดุก่อสร้าง": "#FDBA74",
  "ห้องน้ำ": "#A5B4FC",
  "ครัว": "#F472B6",
  "ของตกแต่ง": "#7DD3FC",
  "อื่นๆ": "#D4D4D8",
};

export default function Checklist({ isDark: propIsDark }) {
  const [internalDark, setInternalDark] = useState(
    () => document.documentElement.getAttribute("data-theme") === "dark"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setInternalDark(document.documentElement.getAttribute("data-theme") === "dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const isDark = propIsDark !== undefined ? propIsDark : internalDark;

  const C = {
    text: isDark ? "#FFFFFF" : "#1B2430",
    text2: isDark ? "#E0E6F0" : "#111111",
    muted: isDark ? "#A0AEC0" : "#7C8798",
    muted2: isDark ? "#718096" : "#A0AEC0",
    card: isDark ? "#171A21" : "#FFFFFF",
    cardChecked: isDark ? "rgba(23, 26, 33, 0.55)" : "#F9FAFB",
    border: isDark ? "rgba(255, 255, 255, 0.08)" : "#DDE6F0",
    borderFaint: isDark ? "rgba(255, 255, 255, 0.05)" : "#EEF3F9",
    inputBg: isDark ? "#20242D" : "#FFFFFF",
    inputColor: isDark ? "#FFFFFF" : "#1B2430",
    pillBg: isDark ? "rgba(255, 255, 255, 0.08)" : "#EEF3F9",
    btnSecondaryBg: isDark ? "#20242D" : "#F9FAFB",
    modalBg: isDark ? "#171A21" : "#FFFFFF",
  };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("ปลั๊กและสวิตช์");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [buyingItem, setBuyingItem] = useState(null);
  const [buyQty, setBuyQty] = useState(1);
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, text: "" });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("checklist")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setDbError(true);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const showToast = (text) => {
    setToast({ show: true, text });
    setTimeout(() => setToast({ show: false, text: "" }), 2000);
  };

  const addItem = async () => {
    if (!title.trim()) return;
    setAdding(true);
    const { data, error } = await supabase
      .from("checklist")
      .insert({ title: title.trim(), category, notes: notes.trim(), checked: false, quantity: quantity || 1, bought: 0 })
      .select()
      .single();
    if (error) {
      console.error("addItem error:", error);
      showToast("เกิดข้อผิดพลาด: " + (error.message || "ไม่สามารถเพิ่มได้"));
    } else if (data) {
      setItems((prev) => [data, ...prev]);
      setTitle("");
      setNotes("");
      setCategory("ปลั๊กและสวิตช์");
      setQuantity(1);
      setShowForm(false);
      showToast("เพิ่มรายการแล้ว");
    }
    setAdding(false);
  };

  const toggleItem = (item) => {
    if (item.checked) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, checked: false, bought: 0 } : i))
      );
      supabase.from("checklist").update({ checked: false, bought: 0 }).eq("id", item.id);
      showToast("ยกเลิกเครื่องหมาย");
    } else if ((item.quantity || 1) <= 1) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, checked: true, bought: 1 } : i))
      );
      supabase.from("checklist").update({ checked: true, bought: 1 }).eq("id", item.id);
      showToast("ซื้อแล้ว ✓");
    } else {
      const remaining = (item.quantity || 1) - (item.bought || 0);
      setBuyQty(remaining > 0 ? remaining : 1);
      setBuyingItem(item);
    }
  };

  const confirmBuy = async () => {
    if (!buyingItem) return;
    const newBought = (buyingItem.bought || 0) + buyQty;
    const isChecked = newBought >= (buyingItem.quantity || 1);
    setItems((prev) =>
      prev.map((i) =>
        i.id === buyingItem.id ? { ...i, bought: newBought, checked: isChecked } : i
      )
    );
    await supabase
      .from("checklist")
      .update({ bought: newBought, checked: isChecked })
      .eq("id", buyingItem.id);
    setBuyingItem(null);
    showToast(
      isChecked
        ? "ซื้อครบแล้ว ✓"
        : `ซื้อไปแล้ว ${newBought}/${buyingItem.quantity} ชิ้น`
    );
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category || CATS[0]);
    setEditNotes(item.notes || "");
    setEditQuantity(item.quantity || 1);
  };

  const saveEdit = async () => {
    if (!editTitle.trim() || !editingItem) return;
    setSaving(true);
    const { error } = await supabase
      .from("checklist")
      .update({
        title: editTitle.trim(),
        category: editCategory,
        notes: editNotes.trim(),
        quantity: editQuantity,
      })
      .eq("id", editingItem.id);
    if (!error) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? { ...i, title: editTitle.trim(), category: editCategory, notes: editNotes.trim(), quantity: editQuantity }
            : i
        )
      );
      setEditingItem(null);
      showToast("บันทึกแล้ว");
    } else {
      showToast("เกิดข้อผิดพลาด: " + error.message);
    }
    setSaving(false);
  };

  const deleteItem = async (id) => {
    await supabase.from("checklist").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleteId(null);
    showToast("ลบรายการแล้ว");
  };

  const filtered = items.filter((item) => {
    const matchSearch =
      !search.trim() ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase()) ||
      item.notes?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "todo" && !item.checked) ||
      (filter === "done" && item.checked);
    return matchSearch && matchFilter;
  });

  const todo = filtered.filter((i) => !i.checked);
  const done = filtered.filter((i) => i.checked);
  const totalTodo = items.filter((i) => !i.checked).length;
  const totalDone = items.filter((i) => i.checked).length;

  if (dbError) {
    return (
      <div
        style={{
          maxWidth: 640,
          margin: "60px auto",
          background: C.card,
          borderRadius: 24,
          padding: 36,
          border: `1px solid ${C.border}`,
          boxShadow: "0 4px 24px rgba(0,0,0,.06)",
          color: C.text,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ margin: "0 0 8px", color: C.text }}>
          ต้องสร้างตารางในฐานข้อมูลก่อน
        </h2>
        <p style={{ color: C.muted, marginBottom: 24 }}>
          รัน SQL ด้านล่างนี้ใน Supabase → SQL Editor แล้ว reload หน้าเว็บ
        </p>
        <pre
          style={{
            background: isDark ? "#101318" : "#1B2430",
            color: "#A8D8A8",
            borderRadius: 12,
            padding: "16px 20px",
            fontSize: 13,
            overflowX: "auto",
            lineHeight: 1.6,
          }}
        >
          {`create table checklist (
  id bigserial primary key,
  created_at timestamptz default now(),
  title text not null,
  category text default '',
  notes text default '',
  checked boolean default false,
  quantity integer default 1,
  bought integer default 0
);

-- อนุญาตให้ anon อ่าน/เขียนได้
alter table checklist disable row level security;`}
        </pre>
        <button
          onClick={() => { setDbError(false); loadItems(); }}
          style={{
            marginTop: 20,
            background: isDark ? "#FFFFFF" : "#111",
            color: isDark ? "#111" : "#fff",
            border: "none",
            borderRadius: 14,
            padding: "12px 24px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", color: C.text }}>
      {toast.show && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: isDark ? "#FFFFFF" : "#111",
            color: isDark ? "#111" : "#fff",
            padding: "12px 24px",
            borderRadius: 99,
            fontWeight: 600,
            fontSize: 14,
            zIndex: 9999,
            boxShadow: "0 8px 24px rgba(0,0,0,.28)",
            whiteSpace: "nowrap",
          }}
        >
          {toast.text}
        </div>
      )}

      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setDeleteId(null)}
        >
          <div
            style={{
              background: C.modalBg,
              borderRadius: 24,
              padding: 32,
              width: 320,
              textAlign: "center",
              border: `1px solid ${C.border}`,
              boxShadow: "0 12px 40px rgba(0,0,0,.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <p style={{ fontWeight: 700, fontSize: 17, margin: "0 0 8px", color: C.text }}>
              ลบรายการนี้?
            </p>
            <p style={{ color: C.muted, fontSize: 14, margin: "0 0 24px" }}>
              ไม่สามารถกู้คืนได้
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  border: `1px solid ${C.border}`,
                  background: C.btnSecondaryBg,
                  color: C.muted,
                  borderRadius: 12,
                  padding: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => deleteItem(deleteId)}
                style={{
                  flex: 1,
                  border: "none",
                  background: "#EF4444",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {buyingItem && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
            backdropFilter: "blur(4px)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setBuyingItem(null)}
        >
          <div
            style={{
              background: C.modalBg, borderRadius: 24, padding: 28,
              width: 320, border: `1px solid ${C.border}`,
              boxShadow: "0 20px 60px rgba(0,0,0,.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 17, color: C.text }}>
              บันทึกการซื้อ
            </p>
            <p style={{
              margin: "0 0 20px", fontSize: 13, color: C.muted,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {buyingItem.title}
            </p>

            <div style={{ background: C.btnSecondaryBg, borderRadius: 16, padding: "14px 16px", marginBottom: 16, border: `1px solid ${C.borderFaint}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: C.muted }}>ต้องซื้อทั้งหมด</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{buyingItem.quantity} ชิ้น</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: C.muted }}>ซื้อไปแล้ว</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#22C55E" }}>{buyingItem.bought || 0} ชิ้น</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: C.muted }}>คงเหลือ</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>
                  {(buyingItem.quantity || 1) - (buyingItem.bought || 0)} ชิ้น
                </span>
              </div>
            </div>

            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: C.text }}>
              ซื้อครั้งนี้กี่ชิ้น?
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`,
                  background: C.btnSecondaryBg, color: C.text, fontSize: 20, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >−</button>
              <input
                type="number" min={1}
                max={(buyingItem.quantity || 1) - (buyingItem.bought || 0)}
                value={buyQty}
                onChange={(e) => setBuyQty(Math.max(1, Math.min(
                  parseInt(e.target.value) || 1,
                  (buyingItem.quantity || 1) - (buyingItem.bought || 0)
                )))}
                style={{
                  flex: 1, textAlign: "center", padding: "9px 12px",
                  borderRadius: 10, border: `1px solid ${C.border}`,
                  fontSize: 20, fontWeight: 800, color: C.text,
                  background: C.inputBg, fontFamily: "inherit", outline: "none",
                }}
              />
              <button
                onClick={() => setBuyQty((q) => Math.min(
                  q + 1, (buyingItem.quantity || 1) - (buyingItem.bought || 0)
                ))}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`,
                  background: C.btnSecondaryBg, color: C.text, fontSize: 20, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >+</button>
            </div>

            {(buyingItem.bought || 0) + buyQty >= (buyingItem.quantity || 1) ? (
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "#22C55E", fontWeight: 600, textAlign: "center" }}>
                ✓ ครบ! จะย้ายไปที่ "ซื้อแล้ว"
              </p>
            ) : (
              <p style={{ margin: "0 0 16px", fontSize: 12, color: C.muted, textAlign: "center" }}>
                จะเหลืออีก {(buyingItem.quantity || 1) - (buyingItem.bought || 0) - buyQty} ชิ้น
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setBuyingItem(null)}
                style={{
                  flex: 1, border: `1px solid ${C.border}`, background: C.btnSecondaryBg,
                  borderRadius: 12, padding: "12px", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", color: C.muted,
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmBuy}
                style={{
                  flex: 2, border: "none",
                  background: isDark ? "linear-gradient(135deg,#FFFFFF,#E2E8F0)" : "linear-gradient(135deg,#111,#000)",
                  color: isDark ? "#111" : "#fff", borderRadius: 12, padding: "12px",
                  fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
            backdropFilter: "blur(4px)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setEditingItem(null)}
        >
          <div
            style={{
              background: C.modalBg, borderRadius: 24, padding: 28,
              width: "100%", maxWidth: 420, border: `1px solid ${C.border}`,
              boxShadow: "0 20px 60px rgba(0,0,0,.35)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 18, color: C.text }}>
              แก้ไขรายการ
            </p>

            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              placeholder="ชื่อรายการ"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12,
                border: `1px solid ${C.border}`, fontSize: 15, fontFamily: "inherit",
                outline: "none", marginBottom: 14, boxSizing: "border-box",
                fontWeight: 600, color: C.text, background: C.inputBg,
              }}
            />

            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {CATS.map((c) => {
                const isSelected = editCategory === c;
                const bg = isDark ? (isSelected ? CAT_COLORS_DARK[c] : "rgba(255,255,255,0.05)") : (isSelected ? CAT_COLORS[c] : "#fff");
                const textColor = isDark ? (isSelected ? CAT_TEXT_DARK[c] : C.muted) : (isSelected ? CAT_TEXT[c] : C.muted);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditCategory(c)}
                    style={{
                      border: isSelected ? (isDark ? "1.5px solid #60A5FA" : "2px solid #111") : `1px solid ${C.border}`,
                      background: bg,
                      color: textColor,
                      borderRadius: 999, padding: "5px 13px",
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
              <span style={{ fontSize: 14, color: C.muted, fontWeight: 600, whiteSpace: "nowrap" }}>จำนวน</span>
              <button
                onClick={() => setEditQuantity((q) => Math.max(1, q - 1))}
                style={{
                  width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`,
                  background: C.btnSecondaryBg, color: C.text, fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >−</button>
              <input
                type="number" min={1} value={editQuantity}
                onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: 64, textAlign: "center", padding: "7px 10px",
                  borderRadius: 10, border: `1px solid ${C.border}`,
                  fontSize: 15, fontFamily: "inherit", outline: "none",
                  fontWeight: 700, color: C.text, background: C.inputBg,
                }}
              />
              <button
                onClick={() => setEditQuantity((q) => q + 1)}
                style={{
                  width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`,
                  background: C.btnSecondaryBg, color: C.text, fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >+</button>
              <span style={{ fontSize: 13, color: C.muted }}>ชิ้น / อัน</span>
            </div>

            <input
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="หมายเหตุ (ไม่บังคับ)"
              style={{
                width: "100%", padding: "10px 16px", borderRadius: 12,
                border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "inherit",
                outline: "none", marginBottom: 20, boxSizing: "border-box",
                background: C.inputBg, color: C.text,
              }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setEditingItem(null)}
                style={{
                  flex: 1, border: `1px solid ${C.border}`, background: C.btnSecondaryBg,
                  borderRadius: 12, padding: "12px", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", color: C.muted,
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={saveEdit}
                disabled={!editTitle.trim() || saving}
                style={{
                  flex: 2, border: "none",
                  background: editTitle.trim()
                    ? (isDark ? "linear-gradient(135deg,#FFFFFF,#E2E8F0)" : "linear-gradient(135deg,#111,#000)")
                    : (isDark ? "#20242D" : "#DDE6F0"),
                  color: editTitle.trim() ? (isDark ? "#111" : "#fff") : "#777",
                  borderRadius: 12, padding: "12px", fontWeight: 700,
                  cursor: editTitle.trim() ? "pointer" : "default", fontFamily: "inherit",
                }}
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(28px,4vw,42px)",
              fontWeight: 800,
              color: C.text,
              letterSpacing: "-0.03em",
            }}
          >
            รายการซื้อ
          </h1>
          <p style={{ margin: "6px 0 0", color: C.muted, fontSize: 14 }}>
            {totalTodo > 0 ? `ยังต้องซื้ออีก ${totalTodo} รายการ` : "ซื้อครบแล้ว 🎉"}
            {totalDone > 0 && ` · ซื้อแล้ว ${totalDone} รายการ`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: isDark ? "linear-gradient(135deg,#FFFFFF,#E2E8F0)" : "linear-gradient(135deg,#111,#000)",
            color: isDark ? "#111" : "#fff",
            border: "none",
            borderRadius: 36,
            padding: "12px 22px",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: isDark ? "0 6px 20px rgba(0,0,0,.5)" : "0 6px 20px rgba(0,0,0,.28)",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          + เพิ่มรายการ
        </button>
      </div>

      {/* Search & Filter */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหา..."
          style={{
            flex: 1,
            minWidth: 180,
            padding: "10px 18px",
            borderRadius: 999,
            border: `1px solid ${C.border}`,
            background: C.inputBg,
            color: C.text,
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        {["all", "todo", "done"].map((f) => {
          const isActive = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                border: isActive ? "none" : `1px solid ${C.border}`,
                background: isActive ? (isDark ? "#FFFFFF" : "#111") : (isDark ? "rgba(255,255,255,0.06)" : "#fff"),
                color: isActive ? (isDark ? "#111" : "#fff") : C.muted,
                borderRadius: 999,
                padding: "10px 18px",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
            >
              {f === "all" ? "ทั้งหมด" : f === "todo" ? "ยังต้องซื้อ" : "ซื้อแล้ว"}
            </button>
          );
        })}
      </div>

      {/* Add Form */}
      {showForm && (
        <div
          style={{
            background: C.card,
            borderRadius: 20,
            padding: 24,
            marginBottom: 20,
            border: `1px solid ${C.border}`,
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,.35)" : "0 4px 20px rgba(0,0,0,.07)",
          }}
        >
          <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: 16, color: C.text }}>
            เพิ่มรายการใหม่
          </p>
          <input
            autoFocus
            placeholder="ชื่อรายการ เช่น ปลั๊กสวิตช์ทางเดียว"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              fontSize: 15,
              fontFamily: "inherit",
              outline: "none",
              marginBottom: 12,
              boxSizing: "border-box",
              background: C.inputBg,
              color: C.text,
            }}
          />
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            {CATS.map((c) => {
              const isSelected = category === c;
              const bg = isDark ? (isSelected ? CAT_COLORS_DARK[c] : "rgba(255,255,255,0.05)") : (isSelected ? CAT_COLORS[c] : "#fff");
              const textColor = isDark ? (isSelected ? CAT_TEXT_DARK[c] : C.muted) : (isSelected ? CAT_TEXT[c] : C.muted);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  style={{
                    border: isSelected ? (isDark ? "1.5px solid #60A5FA" : "2px solid #111") : `1px solid ${C.border}`,
                    background: bg,
                    color: textColor,
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
            <span style={{ fontSize: 14, color: C.muted, fontWeight: 600, whiteSpace: "nowrap" }}>
              จำนวน
            </span>
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              style={{
                width: 34, height: 34, borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.btnSecondaryBg,
                color: C.text, fontSize: 18, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >−</button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: 64, textAlign: "center",
                padding: "7px 10px", borderRadius: 10,
                border: `1px solid ${C.border}`, fontSize: 15,
                fontFamily: "inherit", outline: "none",
                fontWeight: 700, color: C.text, background: C.inputBg,
              }}
            />
            <button
              onClick={() => setQuantity((q) => q + 1)}
              style={{
                width: 34, height: 34, borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.btnSecondaryBg,
                color: C.text, fontSize: 18, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >+</button>
            <span style={{ fontSize: 13, color: C.muted }}>ชิ้น / อัน</span>
          </div>
          <input
            placeholder="หมายเหตุ (ไม่บังคับ)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              marginBottom: 16,
              boxSizing: "border-box",
              background: C.inputBg,
              color: C.text,
            }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setShowForm(false); setTitle(""); setNotes(""); }}
              style={{
                flex: 1,
                border: `1px solid ${C.border}`,
                background: C.btnSecondaryBg,
                borderRadius: 12,
                padding: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                color: C.muted,
              }}
            >
              ยกเลิก
            </button>
            <button
              onClick={addItem}
              disabled={!title.trim() || adding}
              style={{
                flex: 2,
                border: "none",
                background: title.trim()
                  ? (isDark ? "linear-gradient(135deg,#FFFFFF,#E2E8F0)" : "#111")
                  : (isDark ? "#20242D" : "#DDE6F0"),
                color: title.trim() ? (isDark ? "#111" : "#fff") : "#777",
                borderRadius: 12,
                padding: "12px",
                fontWeight: 700,
                cursor: title.trim() ? "pointer" : "default",
                fontFamily: "inherit",
              }}
            >
              {adding ? "กำลังเพิ่ม..." : "เพิ่มรายการ"}
            </button>
          </div>
        </div>
      )}

      {/* List Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
          กำลังโหลด...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: C.muted,
            background: C.card,
            borderRadius: 20,
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 16, color: C.text }}>
            {search ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีรายการ"}
          </p>
          {!search && (
            <p style={{ margin: "8px 0 0", fontSize: 14 }}>
              กด "เพิ่มรายการ" เพื่อเริ่มต้น
            </p>
          )}
        </div>
      ) : (
        <>
          {todo.length > 0 && (filter === "all" || filter === "todo") && (
            <Section
              title="ยังต้องซื้อ"
              count={todo.length}
              color="#EF4444"
              isDark={isDark}
              C={C}
            >
              {todo.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onDelete={() => setDeleteId(item.id)}
                  onEdit={() => openEdit(item)}
                  isDark={isDark}
                  C={C}
                />
              ))}
            </Section>
          )}

          {done.length > 0 && (filter === "all" || filter === "done") && (
            <Section
              title="ซื้อแล้ว"
              count={done.length}
              color="#22C55E"
              isDark={isDark}
              C={C}
            >
              {done.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onDelete={() => setDeleteId(item.id)}
                  onEdit={() => openEdit(item)}
                  isDark={isDark}
                  C={C}
                />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, count, color, children, isDark, C }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: color,
            display: "inline-block",
            flexShrink: 0,
            boxShadow: `0 0 10px ${color}66`,
          }}
        />
        <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
          {title}
        </span>
        <span
          style={{
            background: C.pillBg,
            color: C.muted,
            borderRadius: 999,
            padding: "2px 10px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {count}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function ChecklistItem({ item, onToggle, onDelete, onEdit, isDark, C }) {
  const catBg = isDark
    ? (CAT_COLORS_DARK[item.category] || "rgba(255,255,255,0.08)")
    : (CAT_COLORS[item.category] || "#F4F4F5");
  const catColor = isDark
    ? (CAT_TEXT_DARK[item.category] || "#D4D4D8")
    : (CAT_TEXT[item.category] || "#3F3F46");

  return (
    <div
      style={{
        background: item.checked ? C.cardChecked : C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        transition: "all .2s ease",
        boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.18)" : "0 2px 8px rgba(0,0,0,0.03)",
      }}
    >
      <button
        onClick={() => onToggle(item)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: item.checked ? "none" : `2px solid ${isDark ? "rgba(255,255,255,0.2)" : "#DDE6F0"}`,
          background: item.checked ? "#22C55E" : (isDark ? "rgba(255,255,255,0.05)" : "#fff"),
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          padding: 0,
          transition: "all .2s ease",
        }}
      >
        {item.checked && (
          <CheckOutlined style={{ color: "#fff", fontSize: 13 }} />
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: item.checked ? C.muted2 : C.text,
            textDecoration: item.checked ? "line-through" : "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 4,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {(item.quantity || 1) > 1 && !item.checked && (
            <span
              style={{
                background: (item.bought || 0) > 0
                  ? (isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7")
                  : (isDark ? "rgba(255, 255, 255, 0.12)" : "#1B2430"),
                color: (item.bought || 0) > 0
                  ? (isDark ? "#FDE68A" : "#92400E")
                  : (isDark ? "#FFFFFF" : "#fff"),
                borderRadius: 999,
                padding: "2px 9px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {(item.bought || 0) > 0
                ? `ซื้อแล้ว ${item.bought}/${item.quantity}`
                : `×${item.quantity}`}
            </span>
          )}
          {(item.quantity || 1) > 1 && !item.checked && (item.bought || 0) > 0 && (
            <span
              style={{
                background: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEF2F2",
                color: isDark ? "#FCA5A5" : "#DC2626",
                borderRadius: 999,
                padding: "2px 9px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              คงเหลือ {item.quantity - item.bought}
            </span>
          )}
          {item.checked && (item.quantity || 1) > 1 && (
            <span style={{
              background: isDark ? "rgba(34, 197, 94, 0.18)" : "#F0FDF4",
              color: isDark ? "#86EFAC" : "#166534",
              borderRadius: 999, padding: "2px 9px",
              fontSize: 11, fontWeight: 700,
            }}>
              ครบ {item.quantity} ชิ้น
            </span>
          )}
          {item.category && (
            <span
              style={{
                background: catBg,
                color: catColor,
                borderRadius: 999,
                padding: "2px 10px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {item.category}
            </span>
          )}
          {item.notes && (
            <span style={{ fontSize: 12, color: C.muted }}>{item.notes}</span>
          )}
        </div>
      </div>

      <button
        onClick={onEdit}
        style={{
          border: "none", background: "transparent", color: isDark ? "#718096" : "#C8D3DF",
          cursor: "pointer", padding: 6, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "color .2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? "#60A5FA" : "#3B82F6")}
        onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "#718096" : "#C8D3DF")}
      >
        <EditOutlined style={{ fontSize: 15 }} />
      </button>

      <button
        onClick={onDelete}
        style={{
          border: "none", background: "transparent", color: isDark ? "#718096" : "#DDE6F0",
          cursor: "pointer", padding: 6, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "color .2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
        onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? "#718096" : "#DDE6F0")}
      >
        <DeleteOutlined style={{ fontSize: 16 }} />
      </button>
    </div>
  );
}
