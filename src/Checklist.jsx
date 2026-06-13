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

export default function Checklist() {
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
      // Uncheck: reset bought to 0
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, checked: false, bought: 0 } : i))
      );
      supabase.from("checklist").update({ checked: false, bought: 0 }).eq("id", item.id);
      showToast("ยกเลิกเครื่องหมาย");
    } else if ((item.quantity || 1) <= 1) {
      // Single item — check directly
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, checked: true, bought: 1 } : i))
      );
      supabase.from("checklist").update({ checked: true, bought: 1 }).eq("id", item.id);
      showToast("ซื้อแล้ว ✓");
    } else {
      // Multi-quantity — open buy modal
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
          background: "#fff",
          borderRadius: 24,
          padding: 36,
          border: "1px solid #DDE6F0",
          boxShadow: "0 4px 24px rgba(0,0,0,.06)",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ margin: "0 0 8px", color: "#1B2430" }}>
          ต้องสร้างตารางในฐานข้อมูลก่อน
        </h2>
        <p style={{ color: "#7C8798", marginBottom: 24 }}>
          รัน SQL ด้านล่างนี้ใน Supabase → SQL Editor แล้ว reload หน้าเว็บ
        </p>
        <pre
          style={{
            background: "#1B2430",
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
            background: "#111",
            color: "#fff",
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
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {toast.show && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111",
            color: "#fff",
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
            background: "rgba(0,0,0,.5)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setDeleteId(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 32,
              width: 320,
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <p style={{ fontWeight: 700, fontSize: 17, margin: "0 0 8px" }}>
              ลบรายการนี้?
            </p>
            <p style={{ color: "#7C8798", fontSize: 14, margin: "0 0 24px" }}>
              ไม่สามารถกู้คืนได้
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1,
                  border: "1px solid #DDE6F0",
                  background: "#fff",
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
            position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setBuyingItem(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 24, padding: 28,
              width: 320, boxShadow: "0 20px 60px rgba(0,0,0,.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 17, color: "#1B2430" }}>
              บันทึกการซื้อ
            </p>
            <p style={{
              margin: "0 0 20px", fontSize: 13, color: "#7C8798",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {buyingItem.title}
            </p>

            <div style={{ background: "#F9FAFB", borderRadius: 16, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#7C8798" }}>ต้องซื้อทั้งหมด</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1B2430" }}>{buyingItem.quantity} ชิ้น</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#7C8798" }}>ซื้อไปแล้ว</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#22C55E" }}>{buyingItem.bought || 0} ชิ้น</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#7C8798" }}>คงเหลือ</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>
                  {(buyingItem.quantity || 1) - (buyingItem.bought || 0)} ชิ้น
                </span>
              </div>
            </div>

            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1B2430" }}>
              ซื้อครั้งนี้กี่ชิ้น?
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: "1px solid #DDE6F0",
                  background: "#F9FAFB", fontSize: 20, cursor: "pointer",
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
                  borderRadius: 10, border: "1px solid #DDE6F0",
                  fontSize: 20, fontWeight: 800, color: "#1B2430",
                  fontFamily: "inherit", outline: "none",
                }}
              />
              <button
                onClick={() => setBuyQty((q) => Math.min(
                  q + 1, (buyingItem.quantity || 1) - (buyingItem.bought || 0)
                ))}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: "1px solid #DDE6F0",
                  background: "#F9FAFB", fontSize: 20, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >+</button>
            </div>

            {(buyingItem.bought || 0) + buyQty >= (buyingItem.quantity || 1) ? (
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "#22C55E", fontWeight: 600, textAlign: "center" }}>
                ✓ ครบ! จะย้ายไปที่ "ซื้อแล้ว"
              </p>
            ) : (
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "#7C8798", textAlign: "center" }}>
                จะเหลืออีก {(buyingItem.quantity || 1) - (buyingItem.bought || 0) - buyQty} ชิ้น
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setBuyingItem(null)}
                style={{
                  flex: 1, border: "1px solid #DDE6F0", background: "#fff",
                  borderRadius: 12, padding: "12px", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", color: "#7C8798",
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmBuy}
                style={{
                  flex: 2, border: "none",
                  background: "linear-gradient(135deg,#111,#000)",
                  color: "#fff", borderRadius: 12, padding: "12px",
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
            position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setEditingItem(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 24, padding: 28,
              width: "100%", maxWidth: 420,
              boxShadow: "0 20px 60px rgba(0,0,0,.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 18, color: "#1B2430" }}>
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
                border: "1px solid #DDE6F0", fontSize: 15, fontFamily: "inherit",
                outline: "none", marginBottom: 14, boxSizing: "border-box",
                fontWeight: 600, color: "#1B2430",
              }}
            />

            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditCategory(c)}
                  style={{
                    border: editCategory === c ? "2px solid #111" : "1px solid #DDE6F0",
                    background: editCategory === c ? CAT_COLORS[c] || "#F4F4F5" : "#fff",
                    color: editCategory === c ? CAT_TEXT[c] || "#111" : "#7C8798",
                    borderRadius: 999, padding: "5px 13px",
                    fontWeight: editCategory === c ? 700 : 500,
                    fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#7C8798", fontWeight: 600, whiteSpace: "nowrap" }}>จำนวน</span>
              <button
                onClick={() => setEditQuantity((q) => Math.max(1, q - 1))}
                style={{
                  width: 34, height: 34, borderRadius: 10, border: "1px solid #DDE6F0",
                  background: "#F9FAFB", fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >−</button>
              <input
                type="number" min={1} value={editQuantity}
                onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: 64, textAlign: "center", padding: "7px 10px",
                  borderRadius: 10, border: "1px solid #DDE6F0",
                  fontSize: 15, fontFamily: "inherit", outline: "none",
                  fontWeight: 700, color: "#1B2430",
                }}
              />
              <button
                onClick={() => setEditQuantity((q) => q + 1)}
                style={{
                  width: 34, height: 34, borderRadius: 10, border: "1px solid #DDE6F0",
                  background: "#F9FAFB", fontSize: 18, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >+</button>
              <span style={{ fontSize: 13, color: "#A0AEC0" }}>ชิ้น / อัน</span>
            </div>

            <input
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="หมายเหตุ (ไม่บังคับ)"
              style={{
                width: "100%", padding: "10px 16px", borderRadius: 12,
                border: "1px solid #DDE6F0", fontSize: 14, fontFamily: "inherit",
                outline: "none", marginBottom: 20, boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setEditingItem(null)}
                style={{
                  flex: 1, border: "1px solid #DDE6F0", background: "#fff",
                  borderRadius: 12, padding: "12px", fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", color: "#7C8798",
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={saveEdit}
                disabled={!editTitle.trim() || saving}
                style={{
                  flex: 2, border: "none",
                  background: editTitle.trim() ? "linear-gradient(135deg,#111,#000)" : "#DDE6F0",
                  color: editTitle.trim() ? "#fff" : "#aaa",
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
              color: "#1B2430",
              letterSpacing: "-0.03em",
            }}
          >
            รายการซื้อ
          </h1>
          <p style={{ margin: "6px 0 0", color: "#7C8798", fontSize: 14 }}>
            {totalTodo > 0 ? `ยังต้องซื้ออีก ${totalTodo} รายการ` : "ซื้อครบแล้ว 🎉"}
            {totalDone > 0 && ` · ซื้อแล้ว ${totalDone} รายการ`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: "linear-gradient(135deg,#111,#000)",
            color: "#fff",
            border: "none",
            borderRadius: 36,
            padding: "12px 22px",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,0,0,.28)",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          + เพิ่มรายการ
        </button>
      </div>

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
            padding: "10px 16px",
            borderRadius: 999,
            border: "1px solid #DDE6F0",
            background: "#fff",
            fontSize: 14,
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        {["all", "todo", "done"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              border: filter === f ? "none" : "1px solid #DDE6F0",
              background: filter === f ? "#111" : "#fff",
              color: filter === f ? "#fff" : "#7C8798",
              borderRadius: 999,
              padding: "10px 18px",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {f === "all" ? "ทั้งหมด" : f === "todo" ? "ยังต้องซื้อ" : "ซื้อแล้ว"}
          </button>
        ))}
      </div>

      {showForm && (
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: 24,
            marginBottom: 20,
            border: "1px solid #DDE6F0",
            boxShadow: "0 4px 20px rgba(0,0,0,.07)",
          }}
        >
          <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: 16, color: "#1B2430" }}>
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
              border: "1px solid #DDE6F0",
              fontSize: 15,
              fontFamily: "inherit",
              outline: "none",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  border: category === c ? "2px solid #111" : "1px solid #DDE6F0",
                  background: category === c ? CAT_COLORS[c] || "#F4F4F5" : "#fff",
                  color: category === c ? CAT_TEXT[c] || "#111" : "#7C8798",
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontWeight: category === c ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#7C8798", fontWeight: 600, whiteSpace: "nowrap" }}>
              จำนวน
            </span>
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              style={{
                width: 34, height: 34, borderRadius: 10,
                border: "1px solid #DDE6F0", background: "#F9FAFB",
                fontSize: 18, cursor: "pointer", display: "flex",
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
                border: "1px solid #DDE6F0", fontSize: 15,
                fontFamily: "inherit", outline: "none",
                fontWeight: 700, color: "#1B2430",
              }}
            />
            <button
              onClick={() => setQuantity((q) => q + 1)}
              style={{
                width: 34, height: 34, borderRadius: 10,
                border: "1px solid #DDE6F0", background: "#F9FAFB",
                fontSize: 18, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >+</button>
            <span style={{ fontSize: 13, color: "#A0AEC0" }}>ชิ้น / อัน</span>
          </div>
          <input
            placeholder="หมายเหตุ (ไม่บังคับ)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 12,
              border: "1px solid #DDE6F0",
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              marginBottom: 16,
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setShowForm(false); setTitle(""); setNotes(""); }}
              style={{
                flex: 1,
                border: "1px solid #DDE6F0",
                background: "#fff",
                borderRadius: 12,
                padding: "12px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                color: "#7C8798",
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
                background: title.trim() ? "#111" : "#DDE6F0",
                color: title.trim() ? "#fff" : "#aaa",
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

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#7C8798" }}>
          กำลังโหลด...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#7C8798",
            background: "#fff",
            borderRadius: 20,
            border: "1px solid #DDE6F0",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
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
            >
              {todo.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onDelete={() => setDeleteId(item.id)}
                  onEdit={() => openEdit(item)}
                />
              ))}
            </Section>
          )}

          {done.length > 0 && (filter === "all" || filter === "done") && (
            <Section
              title="ซื้อแล้ว"
              count={done.length}
              color="#22C55E"
            >
              {done.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={toggleItem}
                  onDelete={() => setDeleteId(item.id)}
                  onEdit={() => openEdit(item)}
                />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, count, color, children }) {
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
          }}
        />
        <span style={{ fontWeight: 700, fontSize: 14, color: "#1B2430" }}>
          {title}
        </span>
        <span
          style={{
            background: "#EEF3F9",
            color: "#7C8798",
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

function ChecklistItem({ item, onToggle, onDelete, onEdit }) {
  return (
    <div
      style={{
        background: item.checked ? "#F9FAFB" : "#fff",
        border: "1px solid #DDE6F0",
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        transition: "all .2s ease",
      }}
    >
      <button
        onClick={() => onToggle(item)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: item.checked ? "none" : "2px solid #DDE6F0",
          background: item.checked ? "#22C55E" : "#fff",
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
            color: item.checked ? "#A0AEC0" : "#1B2430",
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
                background: (item.bought || 0) > 0 ? "#FEF3C7" : "#1B2430",
                color: (item.bought || 0) > 0 ? "#92400E" : "#fff",
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
                background: "#FEF2F2",
                color: "#DC2626",
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
              background: "#F0FDF4", color: "#166534",
              borderRadius: 999, padding: "2px 9px",
              fontSize: 11, fontWeight: 700,
            }}>
              ครบ {item.quantity} ชิ้น
            </span>
          )}
          {item.category && (
            <span
              style={{
                background: CAT_COLORS[item.category] || "#F4F4F5",
                color: CAT_TEXT[item.category] || "#3F3F46",
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
            <span style={{ fontSize: 12, color: "#A0AEC0" }}>{item.notes}</span>
          )}
        </div>
      </div>

      <button
        onClick={onEdit}
        style={{
          border: "none", background: "transparent", color: "#C8D3DF",
          cursor: "pointer", padding: 6, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "color .2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#6B8CAE")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#C8D3DF")}
      >
        <EditOutlined style={{ fontSize: 14 }} />
      </button>

      <button
        onClick={onDelete}
        style={{
          border: "none", background: "transparent", color: "#DDE6F0",
          cursor: "pointer", padding: 6, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "color .2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#DDE6F0")}
      >
        <DeleteOutlined style={{ fontSize: 15 }} />
      </button>
    </div>
  );
}
