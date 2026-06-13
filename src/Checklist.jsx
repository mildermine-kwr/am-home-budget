import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { DeleteOutlined, CheckOutlined, PlusOutlined } from "@ant-design/icons";

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
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
      .insert({ title: title.trim(), category, notes: notes.trim(), checked: false })
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
      setShowForm(false);
      showToast("เพิ่มรายการแล้ว");
    }
    setAdding(false);
  };

  const toggleItem = async (item) => {
    const newVal = !item.checked;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: newVal } : i))
    );
    await supabase
      .from("checklist")
      .update({ checked: newVal })
      .eq("id", item.id);
    showToast(newVal ? "ทำเครื่องหมายซื้อแล้ว ✓" : "ยกเลิกเครื่องหมาย");
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
  checked boolean default false
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

function ChecklistItem({ item, onToggle, onDelete }) {
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
        onClick={onDelete}
        style={{
          border: "none",
          background: "transparent",
          color: "#DDE6F0",
          cursor: "pointer",
          padding: 6,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "color .2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#DDE6F0")}
      >
        <DeleteOutlined style={{ fontSize: 15 }} />
      </button>
    </div>
  );
}
