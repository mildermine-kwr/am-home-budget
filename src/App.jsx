import { supabase } from "./supabase";
import house3d from "./image.png";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

import { useEffect, useMemo, useRef, useState } from "react";
import { TORT, FURN } from "./data/items";
import Checklist from "./Checklist";

const DEFAULT_TORT = TORT;

const DEFAULT_FURN = FURN;

const STORAGE_KEY = "am-home-react-budget";

const TCATS = [
  "ค่ามัดจำต่อเติม",
  "เสาเข็ม",
  "งานปูน",
  "งานระบบ",
  "หลังคา",
  "งานโครงสร้าง",
  "อื่นๆ",
];

const FCATS = [
  "Home Appliances",
  "Furniture",
  "Building Materials / Repairs",
  "Kitchenware",
  "Bedding",
  "Decorations",
  "อื่นๆ",
];

const PLATFORMS = ["Shopee", "HomePro", "ไทวัสดุ", "บุญถาวร", "IKEA", "อื่นๆ"];

const convertThaiDate = (thaiDate) => {
  try {
    if (!thaiDate) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(thaiDate)) {
      return thaiDate;
    }

    if (thaiDate.includes("/")) {
      const [d, m, y] = thaiDate.split("/");
      const christianYear = Number(y) - 543;

      return `${christianYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    return "";
  } catch {
    return "";
  }
};

const formatThaiDate = (dateValue) => {
  if (!dateValue) return "-";

  try {
    // already formatted dd/mm/yyyy
    if (
      typeof dateValue === "string" &&
      /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)
    ) {
      const [, , year] = dateValue.split("/");

      // already Buddhist year
      if (Number(year) > 2500) {
        return dateValue;
      }

      return dateValue;
    }

    // yyyy-mm-dd
    if (
      typeof dateValue === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
      const [year, month, day] = dateValue.split("-");

      const christianYear = Number(year);

      const buddhistYear =
        christianYear > 2500 ? christianYear : christianYear + 543;

      return `${day}/${month}/${buddhistYear}`;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    const day = String(date.getDate()).padStart(2, "0");

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const rawYear = date.getFullYear();

    const buddhistYear = rawYear > 2500 ? rawYear : rawYear + 543;

    return `${day}/${month}/${buddhistYear}`;
  } catch (e) {
    return "-";
  }
};

const safeNumber = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const FormattedBaht = ({ value, style = {} }) => {
  const numStr = safeNumber(value);
  const dotIdx = numStr.lastIndexOf(".");
  const integerPart = dotIdx >= 0 ? numStr.slice(0, dotIdx) : numStr;
  const decimalPart = dotIdx >= 0 ? numStr.slice(dotIdx) : ".00";
  return (
    <span style={{ whiteSpace: "nowrap", ...style }}>
      ฿{integerPart}
      <span style={{ opacity: 0.35 }}>{decimalPart}</span>
    </span>
  );
};

const normalizeItem = (item) => ({
  ...item,
  category: item.category || "",
  budget: Number(item.budget || 0),
  paid: Number(item.paid || 0),
  remaining: Number(
    item.remaining ?? Number(item.budget || 0) - Number(item.paid || 0),
  ),
  title: item.title || item.note || "",
  platform: item.platform || "",
  status:
    item.status ||
    (Number(item.paid || 0) >= Number(item.budget || 0)
      ? "paid"
      : Number(item.paid || 0) > 0
        ? "partial"
        : "unpaid"),
});

export default function App() {
  useEffect(() => {
    testDB();
  }, []);

  const testDB = async () => {
    const { data, error } = await supabase.from("budget").select("*");

    console.log(data);
    console.log(error);
  };

  const [page, setPage] = useState("budget");
  const [activeTab, setActiveTab] = useState("tort");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("json");

  const [theme, setTheme] = useState(() => localStorage.getItem("am-home-theme") || "system");
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isDark = theme === "dark" || (theme === "system" && systemDark);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("am-home-theme", theme);
  }, [theme, isDark]);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("all");

  const [subFilter, setSubFilter] = useState("all");

  useEffect(() => {
    setSubFilter("all");
  }, [activeTab]);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      supabase
        .from("checklist")
        .select("id, title, category, quantity, bought, checked")
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setChecklistItems(data);
        });
    }
  }, [open]);

  const [payingId, setPayingId] = useState(null);

  const [payAmount, setPayAmount] = useState("");

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    text: "",
  });

  const [deleteId, setDeleteId] = useState(null);

  const [data, setData] = useState({
    tort: [],
    furn: [],
  });

  const [editingId, setEditingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [linkedChecklistId, setLinkedChecklistId] = useState(null);
  const [clSearch, setClSearch] = useState("");

  const [form, setForm] = useState({
    date: "",
    category: "",
    title: "",
    note: "",
    budget: "",
    paid: "",
    remaining: "",
    status: "",
    paymentType: "full",
    installmentTotal: "",
    installmentPaid: "",
    quantity: "1",
    platform: "",
  });

  const normalizeValue = (v) => String(v ?? "").trim();

  const hasFormChanges = useMemo(() => {
    if (!editingId) return true;

    return (
      normalizeValue(form.date) !== normalizeValue(selectedItem?.date) ||
      normalizeValue(form.category) !==
        normalizeValue(selectedItem?.category) ||
      normalizeValue(form.title) !== normalizeValue(selectedItem?.title) ||
      normalizeValue(form.note) !== normalizeValue(selectedItem?.note) ||
      Number(form.budget || 0) !== Number(selectedItem?.budget || 0) ||
      Number(form.paid || 0) !== Number(selectedItem?.paid || 0) ||
      normalizeValue(form.platform) !== normalizeValue(selectedItem?.platform)
    );
  }, [form, selectedItem, editingId]);

  useEffect(() => {
    loadBudgets();
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const loadBudgets = async () => {
    const { data, error } = await supabase.from("budget").select("*");

    if (error) {
      console.log(error);
      return;
    }

    const safeData = Array.isArray(data) ? data : [];

    const sortNewest = (arr) =>
      [...arr].sort(
        (a, b) =>
          new Date(b.created_at || b.date || 0) -
          new Date(a.created_at || a.date || 0),
      );

    const tort = sortNewest(safeData.filter((i) => i.type === "tort"));

    const furn = sortNewest(safeData.filter((i) => i.type === "furn"));

    setData({
      tort,
      furn,
    });
  };

  const migrateLocalData = async () => {
    try {
      const tort = DEFAULT_TORT.map((i) => ({
        ...i,
        type: "tort",
      }));

      const furn = DEFAULT_FURN.map((i) => ({
        ...i,
        type: "furn",
      }));

      const all = [...tort, ...furn];

      const { error } = await supabase.from("budget").insert(all);

      if (error) {
        console.log(error);
        alert("migrate fail");
        return;
      }

      alert("migrate success");

      loadBudgets();
    } catch (e) {
      console.log(e);
    }
  };

  const items = activeTab === "tort" ? data?.tort || [] : data?.furn || [];

  const MATERIAL_KEYWORDS = [
    "TOA",
    "สี",
    "ปลั๊ก",
    "สวิตช์",
    "สายไฟ",
    "หลอด",
    "ทราย",
    "ปูน",
    "กระเบื้อง",
    "ยาง",
    "กาว",
    "สกรู",
    "ตะปู",
    "กระจก",
    "ไม้",
    "แผ่น",
    "เหล็ก",
    "อิฐ",
    "หิน",
    "ซีเมนต์",
    "ท่อ",
    "อลูมิเนียม",
    "พลาสติก",
    "สแตนเลส",
    "หลังคา",
    "สุขภัณฑ์",
    "ฝักบัว",
    "ก๊อก",
    "ซิงค์",
    "แท้งค์",
    "ถัง",
    "เครื่อง",
    "แอร์",
    "เตา",
    "อ่าง",
    "พัดลม",
    "วัสดุ",
    "คอนกรีต",
    "อะไหล่",
  ];

  const filteredItems = (() => {
    let result = items || [];

    if (activeTab === "tort" && subFilter !== "all") {
      result = result.filter((item) => {
        const isLabor =
          item.note?.includes("[ต่อเติม]") || item.title?.includes("[ต่อเติม]");
        if (subFilter === "labor") return isLabor;
        if (subFilter === "material") return !isLabor;
        return true;
      });
    }

    if (filter !== "all") {
      result = result.filter((item) => {
        if (filter === "done") return item.status === "paid";
        if (filter === "partial") return item.status === "partial";
        if (filter === "none") return item.status === "unpaid";
        return true;
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.note?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q),
      );
    }

    return result;
  })();

  const repairInstallments = async () => {
    const repaired = (items || []).map((item) => {
      if (!item.installment) return item;

      const monthly = Number(item.installment?.monthly || 0);

      if (!monthly) return item;

      const paidCount = Math.min(
        Math.round(Number(item.paid || 0) / monthly),
        Number(item.installment?.total || 0),
      );

      return {
        ...item,
        installment: {
          ...item.installment,
          paid: paidCount,
        },
      };
    });

    setData((prev) => ({
      ...prev,
      [activeTab]: repaired,
    }));

    for (const item of repaired) {
      if (item.installment) {
        await supabase
          .from("budget")
          .update({
            installment: item.installment,
          })
          .eq("id", item.id);
      }
    }
  };

  const totals = useMemo(() => {
    const total = items.reduce((s, i) => s + Number(i.budget || 0), 0);

    const paid = items.reduce((s, i) => s + Number(i.paid || 0), 0);

    const remain = items.reduce(
      (s, i) =>
        s + Number(i.remaining ?? Number(i.budget || 0) - Number(i.paid || 0)),
      0,
    );

    return {
      total,
      paid,
      remain,
    };
  }, [items]);

  const overallTotals = useMemo(() => {
    const all = [...(data.tort || []), ...(data.furn || [])];
    const total = all.reduce((s, i) => s + Number(i.budget || 0), 0);
    const paid = all.reduce((s, i) => s + Number(i.paid || 0), 0);
    const remain = all.reduce(
      (s, i) =>
        s + Number(i.remaining ?? Number(i.budget || 0) - Number(i.paid || 0)),
      0,
    );
    return { total, paid, remain };
  }, [data.tort, data.furn]);

  const progress =
    totals.total > 0 ? Math.round((totals.paid / totals.total) * 100) : 0;

  const statusText = (item) => {
    const remain = item.budget - item.paid;

    if (item.paid <= 0) return "ยังไม่จ่าย";

    if (remain <= 0) return "จ่ายครบแล้ว";

    return "ชำระบางส่วน";
  };

  const getPaidInstallments = (item) => {
    const total = Number(item.installment?.total || 0);
    if (!total) return 0;
    const perInstallment = Number(item.budget || 0) / total;
    if (!perInstallment) return 0;
    const paidCount = Math.floor(Number(item.paid || 0) / perInstallment);
    return Math.min(paidCount, total);
  };

  const addItem = async () => {
    try {
      if (!form.title?.trim()) {
        showToast("กรุณากรอกรายละเอียด");
        return;
      }

      if (!form.budget) {
        showToast("กรุณากรอกราคา");
        return;
      }

      const budget = Number(form.budget || 0);
      const paid = Number(form.paid || 0);

      const remaining = Math.max(budget - paid, 0);

      const status = paid <= 0 ? "unpaid" : remaining <= 0 ? "paid" : "partial";

      const next = {
        date: form.date || null,
        category: form.category || "อื่นๆ",
        title: form.title,
        note: form.note || "",
        budget,
        paid,
        remaining,
        status,
        platform:
          form.platform === "อื่นๆ" ? form.otherPlatform : form.platform,
        installment:
          form.paymentType === "installment"
            ? {
                total: Number(form.installmentTotal || 0),
                paid: Number(form.installmentPaid || 0),
              }
            : null,

        type: activeTab,
        checklist_id: linkedChecklistId || null,
        quantity: Number(form.quantity || 1),
      };

      if (editingId) {
        const payload = {
          date: form.date || null,
          category: form.category || "",
          title: form.title || "",
          note: form.note || "",
          budget: Number(form.budget || 0),
          paid: Number(form.paid || 0),
          remaining: Math.max(
            Number(form.budget || 0) - Number(form.paid || 0),
            0,
          ),
          status:
            Number(form.paid || 0) <= 0
              ? "unpaid"
              : Number(form.budget || 0) - Number(form.paid || 0) <= 0
                ? "paid"
                : "partial",
          platform:
            form.platform === "อื่นๆ"
              ? form.otherPlatform || ""
              : form.platform || "",
          type: activeTab,
          checklist_id: linkedChecklistId || null,
          quantity: Number(form.quantity || 1),
        };

        const { error } = await supabase
          .from("budget")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          console.log(error);
          showToast("แก้ไขไม่สำเร็จ");
          return;
        }

        setData((prev) => ({
          ...prev,
          [activeTab]: (prev[activeTab] || []).map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  ...payload,
                }
              : item,
          ),
        }));

        if (payload.status === "paid" && payload.checklist_id) {
          const clItem = checklistItems.find((c) => c.id === payload.checklist_id);
          if (clItem) {
            await supabase
              .from("checklist")
              .update({ checked: true, bought: clItem.quantity })
              .eq("id", payload.checklist_id);
            setChecklistItems((prev) =>
              prev.map((c) =>
                c.id === payload.checklist_id
                  ? { ...c, checked: true, bought: c.quantity }
                  : c,
              ),
            );
            showToast("แก้ไขรายการสำเร็จ ✅ ติ๊กรายการซื้อแล้ว");
          } else {
            showToast("แก้ไขรายการสำเร็จ");
          }
        } else {
          showToast("แก้ไขรายการสำเร็จ");
        }
      } else {
        const { error } = await supabase.from("budget").insert(next);

        if (error) {
          console.log(error);
          showToast("บันทึกรายการไม่สำเร็จ");
          return;
        }

        const optimisticItem = {
          id: Date.now(),
          created_at: new Date().toISOString(),
          type: activeTab,
          date: next.date || null,
          category: next.category || "",
          title: next.title || "",
          note: next.note || "",
          platform: next.platform || "",
          budget: Number(next.budget || 0),
          paid: Number(next.paid || 0),
          remaining: Number(next.remaining || 0),
          status: next.status || "unpaid",
          checklist_id: next.checklist_id || null,
          quantity: Number(next.quantity || 1),
        };

        setData((prev) => {
          const updated = {
            ...prev,
            [activeTab]: [optimisticItem, ...(prev[activeTab] || [])],
          };

          return updated;
        });

        if (next.status === "paid" && linkedChecklistId) {
          const clItem = checklistItems.find((c) => c.id === linkedChecklistId);
          if (clItem) {
            await supabase
              .from("checklist")
              .update({ checked: true, bought: clItem.quantity })
              .eq("id", linkedChecklistId);
            setChecklistItems((prev) =>
              prev.map((c) =>
                c.id === linkedChecklistId
                  ? { ...c, checked: true, bought: c.quantity }
                  : c,
              ),
            );
            showToast("บันทึกรายการสำเร็จ ✅ ติ๊กรายการซื้อแล้ว");
          } else {
            showToast("บันทึกรายการสำเร็จ");
          }
        } else {
          showToast("บันทึกรายการสำเร็จ");
        }
      }

      setOpen(false);

      setEditingId(null);

      setEditingId(null);
      setSelectedItem(null);

      setForm({
        date: "",
        category: "",
        title: "",
        note: "",
        budget: "",
        paid: "",
        platform: "",
        otherPlatform: "",
        quantity: "1",
      });
      setLinkedChecklistId(null);
      setClSearch("");
    } catch (error) {
      console.log(error);
      showToast("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setSelectedItem(item);

    setForm({
      date: item.date || "",
      category: item.category || "",
      title: item.title || "",
      note: item.note || "",

      paymentType: item.installment
        ? "installment"
        : Number(item.paid || 0) >= Number(item.budget || 0)
          ? "full"
          : "partial",

      budget: String(item.budget || ""),
      paid: String(item.paid || ""),

      installmentTotal: item.installment?.total || "",

      installmentPaid: item.installment?.paid || "",

      remaining: String(item.remaining || ""),
      status: item.status || "",
      platform: item.platform || "",
      otherPlatform: "",
      quantity: String(item.quantity || 1),
    });

    setLinkedChecklistId(item.checklist_id || null);
    setClSearch("");
    setOpen(true);
  };

  const confirmPayment = async (id) => {
    try {
      const amount = Number(payAmount || 0);

      if (!amount || amount <= 0) {
        showToast("กรุณากรอกจำนวนเงิน");
        return;
      }

      const currentItem = items.find((item) => item.id === id);

      if (!currentItem) {
        showToast("ไม่พบรายการ");
        return;
      }

      const updatedPaid = Number(currentItem.paid || 0) + amount;

      const remaining = Math.max(
        Number(currentItem.budget || 0) - updatedPaid,
        0,
      );

      const status =
        updatedPaid <= 0 ? "unpaid" : remaining <= 0 ? "paid" : "partial";

      const { error } = await supabase
        .from("budget")
        .update({
          paid: updatedPaid,
          remaining,
          status,
        })
        .eq("id", id);

      if (error) {
        console.log(error);
        showToast("บันทึกการชำระไม่สำเร็จ");
        return;
      }

      setData((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].map((item) =>
          item.id === id
            ? {
                ...item,
                paid: updatedPaid,
                remaining,
                status,
              }
            : item,
        ),
      }));

      if (status === "paid" && currentItem.checklist_id) {
        const clItem = checklistItems.find((c) => c.id === currentItem.checklist_id);
        if (clItem) {
          await supabase
            .from("checklist")
            .update({ checked: true, bought: clItem.quantity })
            .eq("id", currentItem.checklist_id);
          setChecklistItems((prev) =>
            prev.map((c) =>
              c.id === currentItem.checklist_id
                ? { ...c, checked: true, bought: c.quantity }
                : c,
            ),
          );
          showToast("บันทึกการชำระสำเร็จ ✅ ติ๊กรายการซื้อแล้ว");
        } else {
          showToast("บันทึกการชำระสำเร็จ");
        }
      } else {
        showToast("บันทึกการชำระสำเร็จ");
      }

      setPayingId(null);
      setPayAmount("");
    } catch (error) {
      console.log(error);
      showToast("เกิดข้อผิดพลาดในการชำระเงิน");
    }
  };

  const deleteItem = async (id) => {
    await supabase.from("budget").delete().eq("id", id);

    setData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((item) => item.id !== id),
    }));

    setDeleteId(null);

    showToast("ลบรายการสำเร็จ");
  };

  const showToast = (text) => {
    setToast({
      show: true,
      text,
    });

    setTimeout(() => {
      setToast({
        show: false,
        text: "",
      });
    }, 2200);
  };

  const handleBackup = async () => {
    try {
      const [budgetRes, checklistRes] = await Promise.all([
        supabase.from("budget").select("*"),
        supabase.from("checklist").select("*"),
      ]);
      if (budgetRes.error) throw budgetRes.error;
      if (checklistRes.error) throw checklistRes.error;
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const ts =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
        `-${pad(now.getHours())}-${pad(now.getMinutes())}`;
      const payload = {
        version: 1,
        exportedAt: now.toISOString(),
        tables: {
          budget: budgetRes.data,
          checklist: checklistRes.data,
        },
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `am-home-budget-backup-${ts}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("📥 สำรองข้อมูลสำเร็จ");
    } catch (err) {
      showToast("❌ สำรองข้อมูลไม่สำเร็จ");
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toCSV = (rows) => {
    if (!rows || rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const escape = (val) => {
      if (val === null || val === undefined) return "";
      const str = typeof val === "object" ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };
    const lines = [headers.map(escape).join(",")];
    for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(","));
    return "\uFEFF" + lines.join("\r\n");
  };

  const handleExport = async () => {
    setExportModalOpen(false);
    try {
      const [budgetRes, checklistRes] = await Promise.all([
        supabase.from("budget").select("*"),
        supabase.from("checklist").select("*"),
      ]);
      if (budgetRes.error) throw budgetRes.error;
      if (checklistRes.error) throw checklistRes.error;

      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const ts =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
        `-${pad(now.getHours())}-${pad(now.getMinutes())}`;

      if (exportFormat === "json") {
        const payload = {
          version: 1,
          exportedAt: now.toISOString(),
          tables: { budget: budgetRes.data, checklist: checklistRes.data },
        };
        downloadBlob(
          new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
          `am-home-budget-backup-${ts}.json`,
        );
      } else {
        const tables = { budget: budgetRes.data, checklist: checklistRes.data };
        for (const [name, rows] of Object.entries(tables)) {
          downloadBlob(
            new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" }),
            `am-home-budget-${name}-${ts}.csv`,
          );
        }
      }
      showToast("📥 ส่งออกข้อมูลสำเร็จ");
    } catch {
      showToast("❌ ส่งออกข้อมูลไม่สำเร็จ");
    }
  };

  const resetData = () => {
    setData({
      tort: DEFAULT_TORT,
      furn: DEFAULT_FURN,
    });
  };

  const C = {
    navBg: isDark ? "rgba(15,17,21,0.92)" : "rgba(238,243,249,0.92)",
    drawerBg: isDark ? "rgba(15,17,21,0.97)" : "rgba(238,243,249,0.97)",
    shellBg: isDark
      ? "#0F1115"
      : "radial-gradient(circle at 15% 10%,rgba(0,0,0,.07),transparent 35%),radial-gradient(circle at 85% 80%,rgba(0,0,0,.05),transparent 35%),linear-gradient(160deg,#EEF3F9 0%,#F4F8FC 100%)",
    line: isDark ? "rgba(255,255,255,.08)" : "#DDE6F0",
    lineFaint: isDark ? "rgba(255,255,255,.06)" : "#EEF3F9",
    text: isDark ? "#FFFFFF" : "#1B2430",
    text2: isDark ? "#E0E6F0" : "#111",
    muted: isDark ? "#B8C0CC" : "#7C8798",
    card: isDark ? "#171A21" : "#FFFFFF",
    surface: isDark ? "#20242D" : "#FFFFFF",
    section1Bg: isDark ? "#1A1E28" : "#F0F6FF",
    section1Border: isDark ? "rgba(255,255,255,.06)" : "#D8E8F8",
    badgeBg: isDark ? "rgba(30,100,200,.25)" : "#DBEAFE",
    badgeColor: isDark ? "#7EB8F7" : "#1D5FA8",
    tabBg: isDark ? "rgba(255,255,255,.08)" : "#DDE6F0",
    progressTrack: isDark ? "rgba(255,255,255,.08)" : "#EEF3F9",
    inputBg: isDark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.75)",
    inputBorder: isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.06)",
    thBg: isDark ? "#1A1E25" : "#F7FAFB",
    tdBg: isDark ? "#171A21" : "#FFFFFF",
    tdBorder: isDark ? "rgba(255,255,255,.06)" : "#EEF3F9",
    modalBg: isDark ? "#171A21" : "#FFFFFF",
    modalHeaderBorder: isDark ? "rgba(255,255,255,.08)" : "#F0F2F5",
    closeBtnBg: isDark ? "#2A2D35" : "#F2F4F7",
    closeBtnHoverBg: isDark ? "#3A3D45" : "#E4E7EC",
    closeBtnColor: isDark ? "#B8C0CC" : "#555",
    payModalBg: isDark ? "rgba(23,26,33,.94)" : "rgba(255,255,255,.82)",
    payModalBorder: isDark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.6)",
    payInputBg: isDark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.88)",
    payInputBorder: isDark ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.5)",
    payCloseBg: isDark ? "#20242D" : "rgba(255,255,255,.8)",
    deleteBg: isDark ? "rgba(23,26,33,.94)" : "rgba(255,255,255,.88)",
    cancelBg: isDark ? "#2A2D35" : "#F5F5F5",
    cancelColor: isDark ? "#E0E6F0" : "#333",
    exportModalBg: isDark ? "#171A21" : "#fff",
    exportSelectedBorder: isDark ? "#FFFFFF" : "#111",
    exportSelectedBg: isDark ? "#20242D" : "#F8F9FB",
    exportUnselectedBorder: isDark ? "rgba(255,255,255,.12)" : "#DDE6F0",
    exportUnselectedBg: isDark ? "#171A21" : "#fff",
    exportRadioSelected: isDark ? "#FFFFFF" : "#111",
    exportRadioUnselected: isDark ? "rgba(255,255,255,.2)" : "#C5D0DC",
    exportCancelColor: isDark ? "#B8C0CC" : "#3A4660",
    settingsCardBg: isDark ? "#171A21" : "#fff",
    toolbarBorder: isDark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.45)",
    noteBg: isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.04)",
    editBtnBg: isDark ? "#20242D" : "rgba(255,255,255,.95)",
    editBtnBorder: isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)",
    deleteBtnBg: isDark ? "rgba(220,69,69,.15)" : "rgba(255,240,240,.95)",
    deleteBtnBorder: isDark ? "rgba(220,69,69,.2)" : "rgba(255,0,0,.08)",
    filterBg: isDark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.85)",
    filterBorder: isDark ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.5)",
    payTypeBg: isDark ? "#20242D" : "#F2F4F7",
    deleteDialogText: isDark ? "#B8C0CC" : "#666",
  };

  return (
    <>
      <style>
        {`
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap');

*{
  box-sizing:border-box;
}

button,
input,
textarea,
select{
  font-family:'IBM Plex Sans Thai', sans-serif;
  transition:all .28s cubic-bezier(.22,1,.36,1);
}

button:hover{
  transform:translateY(-2px);
}
`}
      </style>

      <style>
        {`
  @media (max-width: 1024px) {
    .hero-grid {
      grid-template-columns: 1fr !important;
      gap: 40px !important;
      min-height: auto !important;
    }

    .hero-title {
      font-size: 72px !important;
    }
  }

  @media (max-width: 768px) {
    .app-shell {
      padding: 20px !important;
    }

    .hero-title {
      font-size: 54px !important;
      line-height: .95 !important;
    }

    .hero-subtitle {
      font-size: 18px !important;
    }

    .summary-grid {
      grid-template-columns: 1fr !important;
    }

    .summary-card {
      padding: 24px !important;
      border-radius: 24px !important;
    }

    .summary-value {
      font-size: 42px !important;
    }

    .table-toolbar {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 14px !important;
    }

    .table-filters {
      overflow-x: auto !important;
      padding-bottom: 4px !important;
      scrollbar-width: none;
    }

    .table-filters::-webkit-scrollbar {
      display: none;
    }

    .status-chips-scroll {
      display: flex !important;
      gap: 8px !important;
      overflow-x: auto !important;
      padding-bottom: 2px !important;
      scrollbar-width: none;
      flex-wrap: nowrap !important;
    }

    .status-chips-scroll::-webkit-scrollbar {
      display: none;
    }

    .status-chips-scroll button {
      white-space: nowrap !important;
      flex-shrink: 0 !important;
    }

    .status-filter-row {
      flex-wrap: nowrap !important;
    }

    .desktop-table {
      display: none !important;
    }

    .mobile-cards {
      display: flex !important;
      flex-direction: column;
      gap: 16px;
      padding: 18px;
    }

    .mobile-budget-card {
      background: #FFFFFF;
      border: 1px solid #DDE6F0;
      border-radius: 20px;
      padding: 18px;
      box-shadow: 0 3px 14px rgba(30,45,61,.06);
    }

    .mobile-budget-title {
      font-size: 18px;
      line-height: 1.4;
      font-weight: 700;
      margin-bottom: 14px;
      max-width: 180px;
      padding-right: 8px;
    }

    .mobile-budget-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }

    .mobile-budget-label {
      color: #8B8B8B;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .mobile-budget-value {
      font-size: 16px;
      font-weight: 600;
    }

    .mobile-action {
      width: 100%;
      border: none;
      background: linear-gradient(135deg,#111111,#000000);
      color: white;
      padding: 14px;
      border-radius: 16px;
      font-weight: 700;
      margin-top: 10px;
      box-shadow: 0 6px 18px rgba(0,0,0,.28);
    }

    .desktop-add-btn {
      display: none !important;
    }

    .mobile-fab {
      display: flex !important;
      align-items: center;
      justify-content: center;
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg,#111111,#000000);
      color: white;
      font-size: 28px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0,0,0,.28);
      z-index: 100;
    }
  }

  @media (min-width: 769px) {
    .mobile-cards {
      display: none !important;
    }

    .mobile-fab {
      display: none !important;
    }

    .status-chips-scroll {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
  }
`}
      </style>

      <style>
        {`
          @keyframes meshMove {
            0% {
              background-position: 0% 50%;
            }

            50% {
              background-position: 100% 50%;
            }

            100% {
              background-position: 0% 50%;
            }
          }

          @keyframes toastSlide {
            0% {
              opacity: 0;
              transform: translate(-50%, -14px) scale(.95);
            }

            100% {
              opacity: 1;
              transform: translate(-50%, 0px) scale(1);
            }
          }

          @keyframes drawerSlide {
            from { transform: translateX(-100%); }
            to   { transform: translateX(0); }
          }

          .nav-desktop-links { display: flex; gap: 8px; }
          .nav-hamburger { display: none; }

          @media (max-width: 767px) {
            .nav-desktop-links { display: none !important; }
            .nav-hamburger { display: flex !important; }
          }

          .mobile-section-label { display: none; }

          @media (max-width: 767px) {
            .mobile-section-label {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 13px;
              font-weight: 700;
              color: #7C8798;
              letter-spacing: 0.04em;
              text-transform: uppercase;
              margin-bottom: 12px;
            }
            .mobile-section-label .label-line {
              flex: 1;
              height: 1px;
              background: #DDE6F0;
            }
            .mobile-section-divider { display: block; height: 36px; }
          }
          .mobile-section-divider { display: none; }

          @keyframes floatCard {
            0% {
              transform: translateY(0px);
            }

            50% {
              transform: translateY(-10px);
            }

            100% {
              transform: translateY(0px);
            }
          }
        `}
      </style>

      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: C.navBg,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${C.line}`,
          padding: "0 40px",
          fontFamily: "'IBM Plex Sans Thai', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            height: 60,
            gap: 8,
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: 17,
              color: C.text,
              letterSpacing: "-0.02em",
              marginRight: "auto",
            }}
          >
            AM Home Budget
          </span>

          <div className="nav-desktop-links">
            {[
              { key: "budget", label: "💰 งบประมาณ" },
              { key: "checklist", label: "✅ รายการซื้อ" },
              { key: "settings", label: "⚙️ ตั้งค่า" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPage(key)}
                style={{
                  border: "none",
                  background: page === key ? C.text : "transparent",
                  color: page === key ? (isDark ? "#111" : "#fff") : C.muted,
                  borderRadius: 12,
                  padding: "8px 18px",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all .2s ease",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            className="nav-hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label="เปิดเมนู"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "6px",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="5" width="18" height="2" rx="1" fill="#1B2430" />
              <rect x="2" y="10" width="18" height="2" rx="1" fill="#1B2430" />
              <rect x="2" y="15" width="18" height="2" rx="1" fill="#1B2430" />
            </svg>
          </button>
        </div>
      </nav>

      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            zIndex: 200,
          }}
        />
      )}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100%",
          width: "260px",
          background: C.drawerBg,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 201,
          boxShadow: "4px 0 24px rgba(0,0,0,.12)",
          display: "flex",
          flexDirection: "column",
          paddingTop: "20px",
          fontFamily: "'IBM Plex Sans Thai', sans-serif",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .28s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px 20px",
            borderBottom: `1px solid ${C.line}`,
          }}
        >
          <span style={{ fontWeight: 800, fontSize: 15, color: C.text, letterSpacing: "-0.02em" }}>
            AM Home Budget
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="ปิดเมนู"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "4px",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              color: C.muted,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "12px 12px" }}>
          {[
            { key: "budget", label: "💰 งบประมาณ" },
            { key: "checklist", label: "✅ รายการซื้อ" },
            { key: "settings", label: "⚙️ ตั้งค่า" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setPage(key); setDrawerOpen(false); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                border: "none",
                background: page === key ? C.text : "transparent",
                color: page === key ? (isDark ? "#111" : "#fff") : C.muted,
                borderRadius: 12,
                padding: "12px 16px",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                fontFamily: "inherit",
                marginBottom: 4,
                transition: "background .18s ease, color .18s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="app-shell"
        style={{
          minHeight: "100vh",
          ...(isDark
            ? { background: "#0F1115" }
            : {
                backgroundImage:
                  "radial-gradient(circle at 15% 10%,rgba(0,0,0,.07),transparent 35%),radial-gradient(circle at 85% 80%,rgba(0,0,0,.05),transparent 35%),linear-gradient(160deg,#EEF3F9 0%,#F4F8FC 100%)",
                backgroundSize: "100% 100%",
              }),
          animation: "none",
          padding: "40px",
          fontFamily: "'IBM Plex Sans Thai', sans-serif",
        }}
      >
        {page === "checklist" && <Checklist />}
        {page === "settings" && (
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: C.text,
                marginBottom: "32px",
                letterSpacing: "-0.02em",
              }}
            >
              ตั้งค่า
            </h2>

            {/* ── Theme Settings ── */}
            <div
              style={{
                background: C.settingsCardBg,
                borderRadius: "20px",
                padding: "28px 32px",
                boxShadow: "0 2px 16px rgba(0,0,0,.07)",
                marginBottom: "20px",
                border: `1px solid ${C.line}`,
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: C.text, margin: "0 0 6px 0" }}>
                🎨 ธีม
              </h3>
              <p style={{ fontSize: "13px", color: C.muted, margin: "0 0 16px 0" }}>
                เลือกธีมสีของแอป
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { key: "light", label: "☀️ สว่าง" },
                  { key: "dark",  label: "🌙 มืด" },
                  { key: "system", label: "💻 ระบบ" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      border: `1.5px solid ${theme === key ? C.text : C.line}`,
                      borderRadius: "10px",
                      background: theme === key ? C.text : "transparent",
                      color: theme === key ? (isDark ? "#111" : "#fff") : C.muted,
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all .18s ease",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                background: C.settingsCardBg,
                borderRadius: "20px",
                padding: "28px 32px",
                boxShadow: "0 2px 16px rgba(0,0,0,.07)",
                border: `1px solid ${C.line}`,
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: C.text,
                  margin: "0 0 6px 0",
                }}
              >
                จัดการข้อมูล
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: C.muted,
                  margin: "0 0 20px 0",
                }}
              >
                ส่งออกข้อมูลทั้งหมดจาก Supabase เป็นไฟล์ JSON หรือ CSV
              </p>
              <button
                onClick={() => { setExportFormat("json"); setExportModalOpen(true); }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 22px",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "opacity .15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.82")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                📥 สำรองข้อมูลเดี๋ยวนี้
              </button>
            </div>
          </div>
        )}
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: page === "budget" ? "block" : "none",
          }}
        >
          {/* ── SECTION 1: Overall Home Summary ── */}
          <div
            style={{
              background: C.section1Bg,
              border: `1px solid ${C.section1Border}`,
              borderRadius: "24px",
              padding: "clamp(24px,3vw,40px)",
              marginBottom: "clamp(32px,5vw,56px)",
              boxShadow: "0 2px 20px rgba(30,45,61,.06)",
            }}
          >
            {/* Section header */}
            <div style={{ marginBottom: "28px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: C.badgeBg,
                  color: C.badgeColor,
                  borderRadius: "999px",
                  padding: "5px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  marginBottom: "12px",
                }}
              >
                🏠 ภาพรวมทั้งบ้าน
              </span>
              <h2
                style={{
                  margin: "0 0 4px",
                  fontSize: "clamp(20px,2.4vw,26px)",
                  fontWeight: 800,
                  color: C.text,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                }}
              >
                สรุปงบประมาณทั้งหมดของบ้าน
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: C.muted }}>
                รวมข้อมูลจาก &ldquo;ต่อเติม&rdquo; และ &ldquo;ของแต่งบ้าน&rdquo;
              </p>
            </div>

            {/* Existing hero grid (title + house image) */}
            <div
              className="hero-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                alignItems: "center",
                gap: "40px",
                marginBottom: "28px",
                minHeight: "260px",
              }}
            >
              <div style={{ position: "relative", zIndex: 2 }}>
                <h1
                  className="hero-title"
                  style={{
                    fontSize: "clamp(52px,6vw,84px)",
                    lineHeight: ".95",
                    letterSpacing: "-0.04em",
                    margin: 0,
                    color: C.text,
                    fontWeight: 800,
                  }}
                >
                  AM Home
                  <br />
                  Budget
                </h1>
                <p
                  className="hero-subtitle"
                  style={{
                    color: C.muted,
                    marginTop: "18px",
                    fontSize: "16px",
                    lineHeight: 1.7,
                    maxWidth: "640px",
                  }}
                >
                  Take control of your home budget with a softer, more
                  intentional experience — from renovation plans to furniture,
                  appliances, and installment tracking.
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <img
                  src={house3d}
                  alt="3D House"
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "760px",
                    objectFit: "contain",
                    filter: "drop-shadow(0 40px 80px rgba(0,0,0,.18))",
                    animation: "floatCard 7s ease-in-out infinite",
                  }}
                />
              </div>
            </div>

            {/* Existing overall summary cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  window.innerWidth < 768 ? "1fr" : "repeat(3, 1fr)",
                gap: "16px",
              }}
            >
              <SummaryCard
                title="🏠 ภาพรวมทั้งบ้าน — งบรวม"
                value={overallTotals.total}
                color="#111111"
              />
              <SummaryCard
                title="🏠 ภาพรวมทั้งบ้าน — จ่ายแล้ว"
                value={overallTotals.paid}
                color="#000000"
              />
              <SummaryCard
                title="🏠 ภาพรวมทั้งบ้าน — คงเหลือ"
                value={overallTotals.remain}
                color="#1E2D3D"
              />
            </div>
          </div>

          {/* ── SECTION 2: Current Category Budget ── */}
          <div style={{ marginBottom: "20px" }}>
            {/* Section header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: "0 0 4px",
                    fontSize: "clamp(20px,2.4vw,26px)",
                    fontWeight: 800,
                    color: C.text,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.2,
                  }}
                >
                  {activeTab === "tort" ? "🏗️ งบต่อเติม" : "🛋️ งบของแต่งบ้าน"}
                </h2>
                <p style={{ margin: 0, fontSize: "13px", color: C.muted }}>
                  รายละเอียดงบประมาณของหมวดนี้
                </p>
              </div>

              {/* Existing tab switcher */}
              <div
                style={{
                  display: "flex",
                  background: C.tabBg,
                  padding: "4px",
                  borderRadius: "14px",
                  fontSize: "16px",
                }}
              >
                <TabButton
                  active={activeTab === "tort"}
                  onClick={() => setActiveTab("tort")}
                >
                  🔨 ต่อเติม
                </TabButton>
                <TabButton
                  active={activeTab === "furn"}
                  onClick={() => setActiveTab("furn")}
                >
                  🛋 ของแต่งบ้าน
                </TabButton>
              </div>
            </div>

            {/* Existing category summary cards */}
            <div
              className="summary-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  window.innerWidth < 768 ? "1fr" : "2fr 1fr 1fr",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              <SummaryCard
                title="งบทั้งหมด"
                value={totals.total}
                color="#111111"
                large
                sub={`จ่ายไปแล้ว ${progress}% ของงบทั้งหมด`}
              />
              <SummaryCard
                title="จ่ายแล้ว"
                value={totals.paid}
                color="#000000"
                sub="ยอดที่ชำระแล้ว"
              />
              <SummaryCard
                title="คงเหลือ"
                value={totals.remain}
                color="#1E2D3D"
                sub="ยอดค้างจ่าย"
              />
            </div>

            {/* Existing progress bar */}
            <div
              style={{
                background: C.card,
                borderRadius: "20px",
                padding: "20px 24px",
                marginBottom: "20px",
                border: `1px solid ${C.line}`,
                boxShadow: "0 2px 12px rgba(30,45,61,.05)",
                color: C.text,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span>ความคืบหน้าการชำระ</span>
                <strong>{progress}%</strong>
              </div>
              <div
                style={{
                  height: "8px",
                  borderRadius: "999px",
                  background: C.progressTrack,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg,#111111,#000000)",
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              background: C.card,
              borderRadius: "20px",
              overflow: "hidden",
              border: `1px solid ${C.line}`,
              boxShadow: "0 2px 12px rgba(30,45,61,.05)",
            }}
          >
            <div
              className="table-toolbar"
              style={{
                padding: "16px",
                borderBottom: `1px solid ${C.toolbarBorder}`,
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "center",
                color: C.text,
              }}
            >
              <strong>รายการทั้งหมด</strong>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา..."
                style={{
                  marginLeft: "auto",
                  padding: "10px 14px",
                  borderRadius: "999px",
                  border: `1px solid ${C.inputBorder}`,
                  background: C.inputBg,
                  backdropFilter: "blur(16px)",
                  color: C.text,
                  outline: "none",
                }}
              />

              <button
                className="desktop-add-btn"
                onClick={() => {
                  setEditingId(null);
                  setSelectedItem(null);

                  setForm({
                    date: new Date().toISOString().slice(0, 10),
                    category: activeTab === "tort" ? TCATS[0] : FCATS[0],

                    paymentType: "full",

                    title: "",
                    note: "",
                    budget: "",
                    paid: "",

                    installmentTotal: "",
                    installmentPaid: "",

                    platform: "",
                    otherPlatform: "",
                    quantity: "1",
                  });

                  setLinkedChecklistId(null);
                  setClSearch("");
                  setOpen(true);
                }}
                style={{
                  border: "none",
                  background: "linear-gradient(135deg,#111111,#000000)",
                  color: "#fff",
                  borderRadius: "36px",
                  padding: "12px 18px",
                  fontWeight: 700,
                  boxShadow: "0 6px 20px rgba(0,0,0,.28)",
                  transition: "all .25s ease",
                }}
              >
                + เพิ่มรายการ
              </button>

              {activeTab === "tort" && (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    gap: "8px",
                    borderTop: "1px solid rgba(0,0,0,.06)",
                    paddingTop: "10px",
                    marginTop: "2px",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#8B8B8B",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ประเภท:
                  </span>
                  {[
                    ["all", "ทั้งหมด"],
                    ["labor", "ค่าแรง"],
                    ["material", "ค่าวัสดุ"],
                  ].map(([val, label]) => (
                    <FilterButton
                      key={val}
                      active={subFilter === val}
                      onClick={() => setSubFilter(val)}
                    >
                      {label}
                    </FilterButton>
                  ))}
                </div>
              )}

              <div
                className="status-filter-row"
                style={{
                  width: "100%",
                  display: "flex",
                  gap: "8px",
                  borderTop: "1px solid rgba(0,0,0,.06)",
                  paddingTop: "10px",
                  marginTop: "2px",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "#8B8B8B",
                    whiteSpace: "nowrap",
                  }}
                >
                  สถานะ:
                </span>
                <div className="status-chips-scroll">
                  {[
                    ["all", "ทั้งหมด"],
                    ["done", "จ่ายครบ"],
                    ["partial", "บางส่วน"],
                    ["none", "ยังไม่จ่าย"],
                  ].map(([val, label]) => (
                    <FilterButton
                      key={val}
                      active={filter === val}
                      onClick={() => setFilter(val)}
                    >
                      {label}
                    </FilterButton>
                  ))}
                </div>
              </div>
            </div>

            <div className="mobile-cards">
              {filteredItems.map((item) => {
                const remain = item.budget - item.paid;

                return (
                  <div
                    key={item.id}
                    className="mobile-budget-card"
                    style={{
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        marginBottom: "8px",
                      }}
                    >
                      <StatusBadge>{statusText(item)}</StatusBadge>
                    </div>

                    <div className="mobile-budget-title">
                      {item.title || item.note}
                    </div>

                    {item.installment && (
                      <div
  style={{
    marginTop: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgb(163 214 244 / 12%)",
    color: "rgb(63 134 197)",
    fontWeight: 700,
    fontSize: "14px",
    flexWrap: "nowrap",
  }}
>
                        ผ่อน {getPaidInstallments(item)}/{item.installment.total}
                        <span
                          style={{
                            opacity: 0.45,
                            whiteSpace: "nowrap",
                          }}
                        >
                          •
                        </span>
                        <FormattedBaht
                          value={Math.round(
                            Number(item.budget || 0) /
                              Number(item.installment?.total || 1),
                          )}
                        />
                        /งวด
                      </div>
                    )}

                    <div className="mobile-budget-meta">
                      <div>
                        <div className="mobile-budget-label">หมวด</div>

                        <div className="mobile-budget-value">
                          {item.category}
                        </div>
                      </div>

                      <div>
                        <div className="mobile-budget-label">วันที่</div>

                        <div className="mobile-budget-value">
                          {formatThaiDate(item.date)}
                        </div>
                      </div>

                      <div>
                        <div className="mobile-budget-label">ซื้อจาก</div>

                        <div className="mobile-budget-value">
                          {item.platform || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="mobile-budget-label">จ่ายแล้ว</div>

                        <div className="mobile-budget-value">
                          <FormattedBaht value={item.paid} />
                        </div>
                      </div>

                      <div>
                        <div className="mobile-budget-label">คงเหลือ</div>

                        <div className="mobile-budget-value">
                          <FormattedBaht value={remain} />
                        </div>
                      </div>
                    </div>

                    {item.note && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "12px",
                          borderRadius: "14px",
                          background: C.noteBg,
                          fontSize: "14px",
                          lineHeight: 1.5,
                          color: C.text,
                        }}
                      >
                        <strong>หมายเหตุ:</strong> {item.note}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "18px",
                        alignItems: "end",
                      }}
                    >
                      {item.paid < item.budget && (
                        <button
                          className="mobile-action"
                          onClick={() => {
                            setPayingId(item.id);

                            setPayAmount(
                              item.installment
                                ? String(
                                    Math.round(
                                      item.budget / item.installment.total,
                                    ),
                                  )
                                : item?.installmentPerMonth
                                  ? String(item.installmentPerMonth)
                                  : "",
                            );
                          }}
                        >
                          + ชำระ
                        </button>
                      )}

                      <button
                        onClick={() => handleEdit(item)}
                        style={{
                          width: "54px",
                          height: "54px",
                          borderRadius: "18px",
                          border: `1px solid ${C.line}`,
                          background: C.card,
                          color: C.text,
                          fontSize: "18px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <EditOutlined />
                      </button>

                      <button
                        onClick={() => setDeleteId(item.id)}
                        style={{
                          width: "54px",
                          height: "54px",
                          borderRadius: "18px",
                          border: "1px solid rgba(255,0,0,.12)",
                          background: isDark ? "rgba(200,50,50,.18)" : "rgba(255,240,240,.95)",
                          color: "#C94B4B",
                          fontSize: "18px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="mobile-fab"
              onClick={() => {
                setEditingId(null);
                setSelectedItem(null);

                setForm({
                  date: new Date().toISOString().slice(0, 10),
                  category: activeTab === "tort" ? TCATS[0] : FCATS[0],
                  paymentType: "full",
                  title: "",
                  note: "",
                  budget: "",
                  paid: "",
                  installmentTotal: "",
                  installmentPaid: "",
                  platform: "",
                  otherPlatform: "",
                  quantity: "1",
                });

                setLinkedChecklistId(null);
                setClSearch("");
                setOpen(true);
              }}
            >
              +
            </button>

            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                className="desktop-table"
                style={{
                  width: "100%",
                  minWidth: "1000px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <TH>วันที่</TH>
                    <TH>หมวด</TH>
                    <TH>รายละเอียด</TH>
                    <TH>ซื้อจาก</TH>
                    <TH>หมายเหตุ</TH>
                    <TH>ราคาเต็ม</TH>
                    <TH>จ่ายแล้ว</TH>
                    <TH>คงเหลือ</TH>
                    <TH sticky>Action</TH>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item) => {
                    const remain = item.budget - item.paid;

                    return (
                      <>
                        <tr key={item.id}>
                          <TD>{formatThaiDate(item.date)}</TD>

                          <TD>{item.category}</TD>

                          <TD>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                                alignItems: "flex-start",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span>{item.title || item.note}</span>
                                {item.quantity > 1 && (
                                  <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "2px 10px",
                                    borderRadius: "999px",
                                    background: "#F3F4F6",
                                    color: "#374151",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                  }}>×{item.quantity}</span>
                                )}
                              </div>

                              {item.checklist_id && (() => {
                                const cl = checklistItems.find(c => c.id === item.checklist_id);
                                return cl ? (
                                  <div style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    background: "rgba(34,197,94,0.10)",
                                    color: "#16a34a",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                  }}>
                                    <span>✅</span>
                                    <span>{cl.title}</span>
                                  </div>
                                ) : null;
                              })()}

                              {item.installment && (
                                <div
                                  style={{
                                    marginTop: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgb(163 214 244 / 12%)",
    color: "rgb(63 134 197)",
    fontWeight: 700,
    fontSize: "14px",
    flexWrap: "nowrap",
                                  }}
                                >
                                  <span style={{
                                      whiteSpace: "nowrap",
                                    }}>
                                    ผ่อน {getPaidInstallments(item)}/
                                    {item.installment.total}
                                  </span>

                                  <span
                                    style={{
                                      opacity: 0.45,
                                      fontWeight: 500,
                                    }}
                                  >
                                    •
                                  </span>

                                   <span style={{
                                      whiteSpace: "nowrap",
                                    }}>
                                    <FormattedBaht
                                      value={Math.round(
                                        item.budget / item.installment.total,
                                      )}
                                    />
                                    / งวด
                                  </span>
                                </div>
                              )}
                            </div>
                          </TD>

                          <TD>{item.platform || "—"}</TD>

                          <TD
                            style={{
                              maxWidth: "220px",
                              whiteSpace: "pre-wrap",
                              color: C.muted,
                            }}
                          >
                            {item.note || "—"}
                          </TD>

                          <TD><FormattedBaht value={item.budget} /></TD>

                          <TD><FormattedBaht value={item.paid} /></TD>

                          <TD><FormattedBaht value={remain} /></TD>

                          <TD sticky>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                gap: "8px",
                                alignItems: "center",
                                justifyContent: "flex-end",
                              }}
                            >
                              <StatusBadge>{statusText(item)}</StatusBadge>
                              {item.paid < item.budget && (
                                <button
                                  style={{
                                    border: `1px solid ${C.line}`,
                                    background: C.card,
                                    color: C.text,
                                    boxShadow: "0 4px 14px rgba(0,0,0,.06)",
                                    borderRadius: "12px",
                                    padding: "8px 12px",
                                    whiteSpace: "nowrap",
                                  }}
                                  onClick={() => {
                                    setPayingId(item.id);

                                    setPayAmount(
                                      item.installment
                                        ? String(
                                            Math.round(
                                              item.budget /
                                                item.installment.total,
                                            ),
                                          )
                                        : "",
                                    );
                                  }}
                                >
                                  + ชำระ
                                </button>
                              )}

                              <button
                                onClick={() => handleEdit(item)}
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "12px",
                                  border: `1px solid ${C.line}`,
                                  background: C.card,
                                  color: C.text,
                                  fontSize: "16px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <EditOutlined />
                              </button>

                              <button
                                onClick={() => setDeleteId(item.id)}
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "12px",
                                  border: "1px solid rgba(255,0,0,.12)",
                                  background: isDark ? "rgba(200,50,50,.18)" : "rgba(255,240,240,.9)",
                                  color: "#C94B4B",
                                  fontSize: "18px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <DeleteOutlined />
                              </button>
                            </div>
                          </TD>
                        </tr>

                        {payingId === item.id && (
                          <tr>
                            <td
                              colSpan={10}
                              style={{
                                background: "#EEF9FB",
                                padding: "14px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: "10px",
                                  alignItems: "center",
                                }}
                              >
                                <div style={{ position: "relative", flex: 1 }}>
                                  <span
                                    style={{
                                      position: "absolute",
                                      left: "12px",
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      fontSize: "15px",
                                      fontWeight: 600,
                                      color: C.muted,
                                      pointerEvents: "none",
                                    }}
                                  >
                                    ฿
                                  </span>
                                  <PayInput
                                    value={payAmount}
                                    onChange={setPayAmount}
                                    placeholder="จำนวนเงิน"
                                    style={{
                                      width: "100%",
                                      height: "40px",
                                      borderRadius: "12px",
                                      border: `1px solid ${C.line}`,
                                      background: C.inputBg,
                                      color: C.text,
                                      padding: "0 12px 0 34px",
                                      fontSize: "15px",
                                      outline: "none",
                                      boxSizing: "border-box",
                                    }}
                                  />
                                </div>

                                <button onClick={() => confirmPayment(item.id)}>
                                  ✓ บันทึก
                                </button>

                                <button onClick={() => setPayingId(null)}>
                                  ยกเลิก
                                </button>
                              </div>

                              {item.installment && (
                                <div
                                  style={{
                                    marginTop: "10px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgb(163 214 244 / 12%)",
    color: "rgb(63 134 197)",
    fontWeight: 700,
    fontSize: "14px",
    flexWrap: "nowrap",
                                  }}
                                >
                                  ผ่อน {getPaidInstallments(item)}/
                                  {item.installment.total}
                                  <span
                                    style={{
                                      opacity: 0.45,
                                    }}
                                  >
                                    •
                                  </span>
                                  <FormattedBaht
                                    value={Math.round(
                                      Number(item.budget || 0) /
                                        Number(item.installment?.total || 1),
                                    )}
                                  />
                                  /งวด
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {open && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(20,20,30,.35)",
              zIndex: 100,
              display: "flex",
              alignItems: window.innerWidth < 768 ? "flex-start" : "center",
              justifyContent: "center",
              backdropFilter: "blur(4px)",
              padding: window.innerWidth < 768 ? "0px" : "24px",
            }}
            onClick={() => setOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
                  e.preventDefault();

                  if (hasFormChanges) {
                    addItem();
                  }
                }
              }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: window.innerWidth < 768 ? "100%" : "620px",
                borderRadius: window.innerWidth < 768 ? "0px" : "28px",
                background: C.modalBg,
                border: "none",
                boxShadow:
                  window.innerWidth < 768
                    ? "none"
                    : "0 12px 60px rgba(0,0,0,.28)",
                height: window.innerWidth < 768 ? "100%" : "auto",
                maxHeight:
                  window.innerWidth < 768 ? "100%" : "calc(100vh - 48px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                WebkitOverflowScrolling: "touch",
                transform: "translateZ(0)",
                color: C.text,
              }}
            >
              <button
                onClick={() => setOpen(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? "#3A3F4A" : "#E4E7EC";
                  e.currentTarget.style.color = isDark ? "#fff" : "#111";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? "#2E3340" : "#F2F4F7";
                  e.currentTarget.style.color = isDark ? "#ccc" : "#555";
                }}
                style={{
                  position: "absolute",
                  top: window.innerWidth < 768 ? "18px" : "22px",
                  right: window.innerWidth < 768 ? "16px" : "22px",
                  width: "36px",
                  height: "36px",
                  border: "none",
                  borderRadius: "999px",
                  background: isDark ? "#2E3340" : "#F2F4F7",
                  cursor: "pointer",
                  color: isDark ? "#ccc" : "#555",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background .15s ease, color .15s ease",
                  zIndex: 10,
                }}
                aria-label="ปิด"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div
                style={{
                  flexShrink: 0,
                  zIndex: 2,
                  background: C.modalBg,
                  padding:
                    window.innerWidth < 768
                      ? "24px 20px 16px"
                      : "28px 28px 16px",
                  borderBottom: `1px solid ${C.line}`,
                }}
              >
                <h3
                  style={{
                    fontSize: window.innerWidth < 768 ? "24px" : "28px",
                    lineHeight: 1.2,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: C.text,
                    margin: 0,
                    paddingRight: "48px",
                  }}
                >
                  {editingId ? "แก้ไขรายการ" : "+ เพิ่มรายการ"}
                </h3>
              </div>

              <div
                className="modal-scroll"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding:
                    window.innerWidth < 768
                      ? "20px 20px 24px"
                      : "24px 28px 28px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      window.innerWidth < 768 ? "1fr" : "1fr 1fr",
                    gap: "14px",
                    marginBottom: "16px",
                  }}
                >
                  <Field label="วันที่">
                    <input
                      type="date"
                      value={convertThaiDate(form.date || "")}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          date: e.target.value,
                        })
                      }
                      style={fieldStyle}
                    />
                  </Field>

                  <Field label="หมวดงาน / หมวดสินค้า">
                    <CustomSelect
                      value={form.category}
                      onChange={(val) => setForm({ ...form, category: val })}
                      options={activeTab === "tort" ? TCATS : FCATS}
                      placeholder="เลือกหมวดหมู่..."
                    />
                  </Field>
                </div>

                <div
                  style={{
                    marginBottom: "18px",
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <Field label="รายละเอียด">
                        <input
                          type="text"
                          placeholder="ชื่อรายการ..."
                          value={form.title}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              title: e.target.value,
                            })
                          }
                          style={fieldStyle}
                        />
                      </Field>
                    </div>
                    <div style={{ width: "90px", flexShrink: 0 }}>
                      <Field label="จำนวน">
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={form.quantity}
                          onChange={(e) =>
                            setForm({ ...form, quantity: e.target.value })
                          }
                          style={{ ...fieldStyle, textAlign: "center" }}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginBottom: "18px",
                  }}
                >
                  <Field label="รูปแบบการชำระ">
                    <div
                      style={{
                        display: "flex",
                        background: "#F2F4F7",
                        borderRadius: "999px",
                        padding: "5px",
                        gap: "4px",
                      }}
                    >
                      {[
                        {
                          key: "full",
                          label: "ชำระเต็ม",
                        },
                        {
                          key: "partial",
                          label: "จ่ายบางส่วน",
                        },
                        {
                          key: "installment",
                          label: "ผ่อน",
                        },
                      ].map((tab) => {
                        const active = form.paymentType === tab.key;

                        return (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                paymentType: tab.key,
                              })
                            }
                            style={{
                              flex: 1,
                              height: "44px",
                              border: "none",
                              borderRadius: "999px",

                              background: active ? (isDark ? "#2E3340" : "#FFFFFF") : "transparent",

                              color: active ? (isDark ? "#FFFFFF" : "#111") : "#8A9BB5",

                              fontWeight: active ? 600 : 400,
                              fontSize: "14px",
                              cursor: "pointer",

                              transition: "all .18s ease",

                              boxShadow: active
                                ? "0 2px 8px rgba(0,0,0,.10)"
                                : "none",
                            }}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>

                {form.paymentType === "full" && (
                  <div
                    style={{
                      marginBottom: "18px",
                    }}
                  >
                    <Field label="ราคา (บาท)">
                      <BahtInput
                        value={form.budget}
                        onChange={(val) =>
                          setForm({
                            ...form,
                            budget: val,
                            paid: val,
                          })
                        }
                      />
                    </Field>
                  </div>
                )}

                {form.paymentType === "partial" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        window.innerWidth < 768 ? "1fr" : "1fr 1fr",
                      gap: "16px",
                      marginBottom: "18px",
                    }}
                  >
                    <Field label="ราคาเต็ม (บาท)">
                      <BahtInput
                        value={form.budget}
                        onChange={(val) =>
                          setForm({
                            ...form,
                            budget: val,
                          })
                        }
                      />
                    </Field>

                    <Field label="จ่ายแล้ว (บาท)">
                      <BahtInput
                        value={form.paid}
                        onChange={(val) =>
                          setForm({
                            ...form,
                            paid: val,
                          })
                        }
                      />
                    </Field>
                  </div>
                )}

                {form.paymentType === "installment" && (
                  <>
                    <div
                      style={{
                        marginBottom: "18px",
                      }}
                    >
                      <Field label="ราคาเต็ม (บาท)">
                        <BahtInput
                          value={form.budget}
                          onChange={(val) =>
                            setForm({
                              ...form,
                              budget: val,
                            })
                          }
                        />
                      </Field>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          window.innerWidth < 768 ? "1fr" : "1fr 1fr",
                        gap: "16px",
                        marginBottom: "18px",
                      }}
                    >
                      <Field label="จำนวนงวดทั้งหมด">
                        <input
                          type="number"
                          value={form.installmentTotal ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              installmentTotal: e.target.value,
                            })
                          }
                          style={fieldStyle}
                        />
                      </Field>

                      <Field label="จ่ายแล้วกี่งวด">
                        <input
                          type="number"
                          value={form.installmentPaid ?? ""}
                          onChange={(e) => {
                            const paidInstallments = Number(
                              e.target.value || 0,
                            );

                            const totalInstallments = Number(
                              form.installmentTotal || 0,
                            );

                            const installmentAmount =
                              totalInstallments > 0
                                ? Number(form.budget || 0) / totalInstallments
                                : 0;

                            setForm({
                              ...form,
                              installmentPaid: e.target.value,
                              paid: Math.round(
                                installmentAmount * paidInstallments,
                              ),
                            });
                          }}
                          style={fieldStyle}
                        />
                      </Field>
                    </div>
                  </>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      window.innerWidth < 768 ? "1fr" : "1fr 1fr",
                    gap: "16px",
                    marginBottom: "18px",
                  }}
                >
                  <Field label="ซื้อจาก">
                    <CustomSelect
                      value={form.platform}
                      onChange={(val) => setForm({ ...form, platform: val })}
                      options={[
                        { value: "", label: "เลือก Platform" },
                        ...PLATFORMS.map((p) => ({ value: p, label: p })),
                      ]}
                      placeholder="เลือก Platform"
                    />
                  </Field>

                  {form.platform === "อื่นๆ" && (
                    <Field label="ระบุร้าน / Platform">
                      <input
                        type="text"
                        placeholder="กรอกชื่อร้าน..."
                        value={form.otherPlatform}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            otherPlatform: e.target.value,
                          })
                        }
                        style={fieldStyle}
                      />
                    </Field>
                  )}
                </div>

                <div
                  style={{
                    marginBottom: "18px",
                  }}
                >
                  <Field label="หมายเหตุ">
                    <textarea
                      placeholder="หมายเหตุเพิ่มเติม..."
                      value={form.note}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          note: e.target.value,
                        })
                      }
                      style={{
                        ...fieldStyle,
                        borderRadius: "20px",
                        minHeight: "110px",
                        paddingTop: "16px",
                        paddingBottom: "16px",
                        resize: "none",
                        height: "auto",
                      }}
                    />
                  </Field>

                  <Field label="เชื่อมกับรายการซื้อ (ไม่บังคับ)">
                    {linkedChecklistId ? (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: "16px",
                        background: "rgba(34,197,94,0.08)",
                        border: "1.5px solid rgba(34,197,94,0.25)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "16px" }}>✅</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "14px", color: "#15803d" }}>
                              {checklistItems.find(c => c.id === linkedChecklistId)?.title}
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>
                              {checklistItems.find(c => c.id === linkedChecklistId)?.category}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => { setLinkedChecklistId(null); setClSearch(""); }}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#9ca3af", fontSize: "18px", lineHeight: 1, padding: "4px",
                          }}
                        >×</button>
                      </div>
                    ) : (
                      <div>
                        <input
                          placeholder="ค้นหารายการซื้อ..."
                          value={clSearch}
                          onChange={e => setClSearch(e.target.value)}
                          style={{ ...fieldStyle, marginBottom: "8px" }}
                        />
                        <div style={{
                          maxHeight: "180px",
                          overflowY: "auto",
                          border: "1px solid #E5E7EB",
                          borderRadius: "16px",
                          background: "#FAFAFA",
                        }}>
                          {checklistItems
                            .filter(c =>
                              !clSearch || c.title?.toLowerCase().includes(clSearch.toLowerCase()) ||
                              c.category?.toLowerCase().includes(clSearch.toLowerCase())
                            )
                            .map(c => (
                              <button
                                key={c.id}
                                onClick={() => setLinkedChecklistId(c.id)}
                                style={{
                                  width: "100%", display: "flex", alignItems: "center",
                                  justifyContent: "space-between", gap: "8px",
                                  padding: "10px 14px", background: "none", border: "none",
                                  borderBottom: "1px solid #F3F4F6", cursor: "pointer",
                                  textAlign: "left",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ fontSize: "13px" }}>{c.checked ? "✅" : "🔲"}</span>
                                  <div>
                                    <div style={{ fontSize: "14px", fontWeight: 500, color: C.text }}>{c.title}</div>
                                    <div style={{ fontSize: "12px", color: C.muted }}>{c.category}</div>
                                  </div>
                                </div>
                                {c.quantity > 1 && (
                                  <span style={{
                                    fontSize: "11px", color: "#6b7280", background: "#F3F4F6",
                                    borderRadius: "999px", padding: "2px 8px", whiteSpace: "nowrap",
                                  }}>×{c.quantity}</span>
                                )}
                              </button>
                            ))}
                          {checklistItems.filter(c =>
                            !clSearch || c.title?.toLowerCase().includes(clSearch.toLowerCase()) ||
                            c.category?.toLowerCase().includes(clSearch.toLowerCase())
                          ).length === 0 && (
                            <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                              ไม่พบรายการ
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Field>
                </div>
              </div>

              <div
                style={{
                  flexShrink: 0,
                  zIndex: 3,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                  padding:
                    window.innerWidth < 768
                      ? "16px 20px calc(16px + env(safe-area-inset-bottom))"
                      : "18px 28px",
                  background: C.modalBg,
                  borderTop: `1px solid ${C.line}`,
                }}
              >
                <button
                  onClick={() => setOpen(false)}
                  className="modal-cancel"
                  style={{
                    height: "52px",
                    padding: "0 28px",
                    borderRadius: "999px",
                    border: "none",
                    background: isDark ? "#2A2D35" : "#F2F4F7",
                    color: isDark ? "#B8C0CC" : "#555",
                    fontSize: "15px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all .18s ease",
                  }}
                >
                  ยกเลิก
                </button>

                <button
                  type="submit"
                  onClick={() => addItem()}
                  disabled={!hasFormChanges}
                  style={{
                    minWidth: "130px",
                    height: "52px",
                    padding: "0 28px",
                    border: "none",
                    borderRadius: "999px",
                    background: !hasFormChanges ? "#CCC" : "#111",
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: 600,
                    cursor: !hasFormChanges ? "not-allowed" : "pointer",
                    transition: "all .18s ease",
                  }}
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}

        {payingId && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,15,15,.28)",
              zIndex: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
              padding: window.innerWidth < 768 ? "18px" : "24px",
            }}
            onClick={() => {
              setPayingId(null);
              setPayAmount("");
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "460px",
                borderRadius: window.innerWidth < 768 ? "32px" : "36px",
                padding: window.innerWidth < 768 ? "28px 22px" : "32px",
                background: C.payModalBg,
                backdropFilter: "blur(24px)",
                border: `1px solid ${C.payModalBorder}`,
                boxShadow: "0 30px 90px rgba(0,0,0,.18)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "32px",
                    fontWeight: 800,
                    color: C.text,
                    letterSpacing: "-0.04em",
                  }}
                >
                  ชำระเงิน
                </h3>

                <button
                  onClick={() => {
                    setPayingId(null);
                    setPayAmount("");
                  }}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "999px",
                    border: "none",
                    background: C.payCloseBg,
                    color: C.text,
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  marginBottom: "20px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    marginBottom: "10px",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: C.muted,
                  }}
                >
                  จำนวนเงิน
                </label>

                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: C.muted,
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  >
                    ฿
                  </span>
                  <PayInput
                    value={payAmount}
                    onChange={setPayAmount}
                    placeholder="กรอกจำนวนเงิน"
                    style={{
                      width: "100%",
                      height: "62px",
                      borderRadius: "20px",
                      border: `1px solid ${C.payInputBorder}`,
                      background: C.payInputBg,
                      color: C.text,
                      padding: "0 20px 0 44px",
                      fontSize: "18px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  confirmPayment(payingId);
                }}
                style={{
                  width: "100%",
                  height: "60px",
                  border: "none",
                  borderRadius: "22px",
                  background: "linear-gradient(135deg,#111111,#000000)",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 10px 28px rgba(0,0,0,.28)",
                }}
              >
                บันทึกการชำระ
              </button>
            </div>
          </div>
        )}

        {deleteId && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,15,15,.28)",
              zIndex: 130,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
              padding: "20px",
            }}
            onClick={() => setDeleteId(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "420px",
                borderRadius: "32px",
                padding: "30px",
                background: C.deleteBg,
                backdropFilter: "blur(24px)",
                boxShadow: "0 30px 90px rgba(0,0,0,.18)",
                border: `1px solid ${C.line}`,
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  marginBottom: "12px",
                  color: C.text,
                }}
              >
                ลบรายการ
              </div>

              <div
                style={{
                  color: C.deleteDialogText,
                  lineHeight: 1.7,
                  marginBottom: "28px",
                }}
              >
                คุณต้องการลบรายการนี้จริงใช่ไหม
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  onClick={() => setDeleteId(null)}
                  style={{
                    height: "50px",
                    padding: "0 20px",
                    borderRadius: "16px",
                    border: `1px solid ${C.line}`,
                    background: C.cancelBg,
                    color: C.cancelColor,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ยกเลิก
                </button>

                <button
                  onClick={() => deleteItem(deleteId)}
                  style={{
                    height: "50px",
                    padding: "0 22px",
                    borderRadius: "16px",
                    border: "none",
                    background: "#D64545",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ลบรายการ
                </button>
              </div>
            </div>
          </div>
        )}

        {exportModalOpen && (
          <>
            <div
              onClick={() => setExportModalOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.40)",
                zIndex: 1000,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                zIndex: 1001,
                background: C.exportModalBg,
                borderRadius: "20px",
                padding: "28px 28px 24px",
                width: "min(440px, calc(100vw - 32px))",
                boxShadow: "0 24px 60px rgba(0,0,0,.28)",
                fontFamily: "'IBM Plex Sans Thai', sans-serif",
                border: `1px solid ${C.line}`,
                color: C.text,
              }}
            >
              <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
                ส่งออกข้อมูล
              </h3>
              <p style={{ margin: "0 0 20px", fontSize: "13px", color: C.muted }}>
                เลือกรูปแบบไฟล์ที่ต้องการส่งออก
              </p>

              {[
                {
                  value: "json",
                  label: "JSON (แนะนำ)",
                  desc: "สำรองข้อมูลครบถ้วนสำหรับกู้คืนแอปในภายหลัง",
                },
                {
                  value: "csv",
                  label: "CSV (สำหรับ Excel)",
                  desc: "ส่งออกข้อมูลเป็นไฟล์ CSV สำหรับเปิดหรือแก้ไขใน Excel",
                },
              ].map(({ value, label, desc }) => (
                <div
                  key={value}
                  onClick={() => setExportFormat(value)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: `2px solid ${exportFormat === value ? C.exportSelectedBorder : C.exportUnselectedBorder}`,
                    marginBottom: "10px",
                    cursor: "pointer",
                    background: exportFormat === value ? C.exportSelectedBg : C.exportUnselectedBg,
                    transition: "border-color .15s, background .15s",
                  }}
                >
                  <div
                    style={{
                      marginTop: "2px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: `2px solid ${exportFormat === value ? C.exportRadioSelected : C.exportRadioUnselected}`,
                      background: exportFormat === value ? C.exportRadioSelected : "transparent",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {exportFormat === value && (
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: isDark ? "#0F1115" : "#fff" }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: C.text, marginBottom: "3px" }}>{label}</div>
                    <div style={{ fontSize: "12px", color: C.muted, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  onClick={() => setExportModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "11px",
                    border: `1.5px solid ${C.line}`,
                    borderRadius: "12px",
                    background: "transparent",
                    color: C.exportCancelColor,
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleExport}
                  style={{
                    flex: 2,
                    padding: "11px",
                    border: "none",
                    borderRadius: "12px",
                    background: "#111",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  📥 ส่งออก
                </button>
              </div>
            </div>
          </>
        )}

        {toast.show && (
          <div
            style={{
              position: "fixed",
              top: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 99999,
              animation: "toastSlide .38s cubic-bezier(.22,1,.36,1)",
            }}
          >
            <div
              style={{
                background: "rgba(22,22,22,.92)",
                color: "#fff",
                padding: "14px 18px",
                borderRadius: "18px",
                backdropFilter: "blur(18px)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontWeight: 700,
                boxShadow: "0 18px 50px rgba(0,0,0,.18)",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "999px",
                  background: "#DDF5E4",
                  color: "#2E6B45",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 900,
                }}
              >
                ✓
              </div>

              {toast.text}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const fieldStyle = {
  width: "100%",
  borderRadius: "999px",
  border: "none",
  background: "var(--input-bg)",
  padding: "0 20px",
  fontSize: "15px",
  height: "52px",
  outline: "none",
  boxSizing: "border-box",
  appearance: "none",
  WebkitAppearance: "none",
  color: "var(--input-color)",
};

function BahtInput({ value, onChange, placeholder = "", style = {} }) {
  const [focused, setFocused] = useState(false);
  const raw = String(value || "");
  const num = Number(raw);
  const formatted = raw
    ? focused
      ? raw
      : isNaN(num)
        ? ""
        : num.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
    : "";

  return (
    <div style={{ position: "relative" }}>
      <span
        style={{
          position: "absolute",
          left: "22px",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "15px",
          fontWeight: 600,
          color: "var(--field-label)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        ฿
      </span>
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={formatted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          let v = e.target.value.replace(/[^\d.]/g, "");
          const parts = v.split(".");
          if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
          if (parts[1] !== undefined) v = parts[0] + "." + parts[1].slice(0, 2);
          onChange(v);
        }}
        style={{
          ...fieldStyle,
          paddingLeft: "40px",
          ...style,
        }}
      />
    </div>
  );
}

function PayInput({ value, onChange, placeholder = "", style = {} }) {
  const [focused, setFocused] = useState(false);
  const raw = String(value || "");
  const num = Number(raw);
  const formatted = raw
    ? focused
      ? raw
      : isNaN(num)
        ? ""
        : num.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
    : "";

  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={formatted}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        let v = e.target.value.replace(/[^\d.]/g, "");
        const parts = v.split(".");
        if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
        if (parts[1] !== undefined) v = parts[0] + "." + parts[1].slice(0, 2);
        onChange(v);
      }}
      style={style}
    />
  );
}

function CustomSelect({ value, onChange, options, placeholder = "เลือก..." }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selectedLabel = options.find(
    (o) => (o.value !== undefined ? o.value : o) === value,
  )
    ? options.find((o) => (o.value !== undefined ? o.value : o) === value)
        .label ||
      options.find((o) => (o.value !== undefined ? o.value : o) === value)
    : null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          ...fieldStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          textAlign: "left",
          color: selectedLabel ? "var(--input-color)" : "var(--input-placeholder)",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selectedLabel || placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8A9BB5"
          strokeWidth="2"
          style={{
            flexShrink: 0,
            marginLeft: "8px",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform .2s ease",
          }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "var(--dropdown-bg)",
            borderRadius: "18px",
            boxShadow: "0 8px 40px rgba(0,0,0,.20)",
            border: "1px solid var(--dropdown-border)",
            overflow: "hidden",
            maxHeight: "280px",
            overflowY: "auto",
          }}
        >
          {options.map((opt, i) => {
            const optValue = opt.value !== undefined ? opt.value : opt;
            const optLabel = opt.label !== undefined ? opt.label : opt;
            const isSelected = optValue === value;
            return (
              <div
                key={optValue || i}
                onClick={() => {
                  onChange(optValue);
                  setOpen(false);
                }}
                style={{
                  padding: "13px 20px",
                  fontSize: "15px",
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? "var(--dropdown-color)" : "var(--dropdown-color)",
                  cursor: "pointer",
                  background: isSelected ? "rgba(128,128,128,.12)" : "transparent",
                  borderBottom:
                    i < options.length - 1 ? "1px solid var(--td-border)" : "none",
                  transition: "background .15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "rgba(128,128,128,.07)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSelected
                    ? "rgba(128,128,128,.12)"
                    : "transparent";
                }}
              >
                {optLabel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          marginBottom: "8px",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--field-label)",
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </label>

      <div>{children}</div>
    </div>
  );
}

function SummaryCard({ title, value, color = "#111111", large = false, sub }) {
  const numStr = safeNumber(value);
  const dotIdx = numStr.lastIndexOf(".");
  const integerPart = dotIdx >= 0 ? numStr.slice(0, dotIdx) : numStr;
  const decimalPart = dotIdx >= 0 ? numStr.slice(dotIdx) : ".00";

  return (
    <div
      className="summary-card"
      style={{
        background: "var(--card-bg)",
        borderRadius: "20px",
        padding: large ? "28px 32px 24px" : "24px 24px 20px",
        border: "1px solid var(--card-border)",
        boxShadow: "0 2px 12px rgba(30,45,61,.05)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: large ? "140px" : "120px",
      }}
    >
      <div
        style={{
          color: "var(--field-label)",
          fontSize: "13px",
          fontWeight: 500,
          letterSpacing: "0.02em",
          marginBottom: large ? "12px" : "10px",
        }}
      >
        {title}
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
        <span
          style={{
            color: `var(--card-amount-color, ${color})`,
            fontSize: large
              ? "clamp(36px, 4vw, 56px)"
              : "clamp(26px, 2.8vw, 38px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          ฿{integerPart}
          <span
            style={{
              color: "var(--card-amount-color, #111111)",
              opacity: 0.35,
              fontSize: large ? "28px" : "20px",
              fontWeight: 700,
            }}
          >
            {decimalPart}
          </span>
        </span>
      </div>

      {sub && (
        <div
          style={{
            marginTop: "12px",
            fontSize: "12px",
            color: "var(--field-label)",
            fontWeight: 400,
            letterSpacing: "0.01em",
            borderTop: "1px solid var(--card-border)",
            paddingTop: "10px",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function TabButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        padding: "10px 18px",
        borderRadius: "10px",
        background: active ? "var(--tab-active-bg)" : "transparent",
        color: active ? "var(--tab-active-color)" : "var(--tab-inactive-color)",
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

function FilterButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "1px solid var(--filter-border)",
        borderRadius: "999px",
        padding: "6px 14px",
        background: active ? "var(--filter-active-bg)" : "var(--filter-inactive-bg)",
        color: active ? "var(--filter-active-color)" : "var(--tab-inactive-color)",
        backdropFilter: "blur(12px)",
      }}
    >
      {children}
    </button>
  );
}

function StatusBadge({ children }) {
  let cls = "status-default";
  if (children === "จ่ายครบแล้ว") cls = "status-paid";
  if (children === "ชำระบางส่วน") cls = "status-partial";
  if (children === "ยังไม่จ่าย") cls = "status-unpaid";

  return (
    <span className={`status-chip ${cls}`}>
      {children}
    </span>
  );
}
function TH({ children, sticky }) {
  return (
    <th
      style={{
        padding: "12px 14px",
        background: "var(--th-bg)",
        textAlign: "left",
        color: "var(--field-label)",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        position: sticky ? "sticky" : "static",
        right: sticky ? 0 : undefined,
      }}
    >
      {children}
    </th>
  );
}

function TD({ children, sticky, style = {} }) {
  return (
    <td
      style={{
        paddingTop: "14px",
        paddingBottom: "14px",
        paddingLeft: "14px",
        paddingRight: "14px",
        verticalAlign: "top",
        borderBottom: "1px solid var(--td-border)",
        transition: "background .2s ease",
        background: "var(--td-bg)",
        color: "var(--dropdown-color)",
        position: sticky ? "sticky" : "static",
        right: sticky ? 0 : undefined,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

// floating animation styles
const floatingStyle = {
  animation: "float 6s ease-in-out infinite",
};

/*
CLARIO THEME UPGRADE:
- editorial typography
- mesh gradient background
- premium glass cards
- floating fintech feel
- airy spacing
- luxury table styling
*/
