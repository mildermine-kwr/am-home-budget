import { supabase }
  from './supabase'
import house3d from './image.png'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'

import { useEffect, useMemo, useState } from 'react'
import { TORT, FURN } from './data/items'

const DEFAULT_TORT = TORT

const DEFAULT_FURN = FURN

const STORAGE_KEY =
  'am-home-react-budget'


const TCATS = [
  'ค่ามัดจำต่อเติม',
  'เสาเข็ม',
  'งานปูน',
  'งานระบบ',
  'หลังคา',
  'งานโครงสร้าง',
  'อื่นๆ',
]

const FCATS = [
  'Home Appliances',
  'Furniture',
  'Building Materials / Repairs',
  'Kitchenware',
  'Bedding',
  'Decorations',
  'อื่นๆ',
]


const PLATFORMS = [
  'Shopee',
  'HomePro',
  'ไทวัสดุ',
  'บุญถาวร',
  'IKEA',
  'อื่นๆ',
]



const convertThaiDate = (thaiDate) => {
  try {
    if (!thaiDate) return ""

    if (/^\d{4}-\d{2}-\d{2}$/.test(thaiDate)) {
      return thaiDate
    }

    if (thaiDate.includes("/")) {
      const [d, m, y] = thaiDate.split("/")
      const christianYear = Number(y) - 543

      return `${christianYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
    }

    return ""
  } catch {
    return ""
  }
}

const formatThaiDate = (dateValue) => {
  if (!dateValue) return '-'

  try {
    // already formatted dd/mm/yyyy
    if (
      typeof dateValue === 'string' &&
      /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)
    ) {
      const [, , year] = dateValue.split('/')

      // already Buddhist year
      if (Number(year) > 2500) {
        return dateValue
      }

      return dateValue
    }

    // yyyy-mm-dd
    if (
      typeof dateValue === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
      const [year, month, day] =
        dateValue.split('-')

      const christianYear =
        Number(year)

      const buddhistYear =
        christianYear > 2500
          ? christianYear
          : christianYear + 543

      return `${day}/${month}/${buddhistYear}`
    }

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    const day = String(
      date.getDate()
    ).padStart(2, '0')

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0')

    const rawYear =
      date.getFullYear()

    const buddhistYear =
      rawYear > 2500
        ? rawYear
        : rawYear + 543

    return `${day}/${month}/${buddhistYear}`
  } catch (e) {
    return '-'
  }
}

const safeNumber = (value) => Number(value || 0).toLocaleString()


const normalizeItem = (item) => ({
  ...item,
  category: item.category || '',
  budget: Number(item.budget || 0),
  paid: Number(item.paid || 0),
  remaining: Number(
    item.remaining ??
    (Number(item.budget || 0) - Number(item.paid || 0))
  ),
  title: item.title || item.note || '',
  platform: item.platform || '',
  status:
    item.status ||
    (Number(item.paid || 0) >= Number(item.budget || 0)
      ? 'paid'
      : Number(item.paid || 0) > 0
      ? 'partial'
      : 'unpaid'),
})

export default function App() {
  useEffect(() => {
    testDB()
  }, [])

  const testDB = async () => {
    const { data, error } =
      await supabase
        .from('budget')
        .select('*')

    console.log(data)
    console.log(error)
  }
  
  const [activeTab, setActiveTab] =
    useState('tort')

  const [search, setSearch] =
    useState('')

  const [filter, setFilter] =
    useState('all')

  const [open, setOpen] =
    useState(false)

  const [payingId, setPayingId] =
    useState(null)

  const [payAmount, setPayAmount] =
    useState('')

  const [toast, setToast] = useState({
    show: false,
    text: '',
  })

  const [deleteId, setDeleteId] =
    useState(null)

  const [data, setData] = useState({
  tort: [],
  furn: [],
})

  const [editingId, setEditingId] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  

  const [form, setForm] = useState({
    date: '',
    category: '',
    title: '',
    note: '',
    budget: '',
    paid: '',
    remaining: '',
    status: '',
    platform: '',
  })

  const hasFormChanges =
    !editingId ||
    JSON.stringify({
      date: form.date || '',
      category: form.category || '',
      note: form.note || '',
      budget: String(form.budget ?? ''),
      paid: String(form.paid ?? ''),
      platform: form.platform || '',
      remark: form.remark || '',
    }) !==
      JSON.stringify({
        date: selectedItem?.date || '',
        category:
          selectedItem?.category || '',
        note:
          selectedItem?.note || '',
        budget: String(
          selectedItem?.budget ?? ''
        ),
        paid: String(
          selectedItem?.paid ?? ''
        ),
        platform:
          selectedItem?.platform || '',
        remark:
          selectedItem?.remark || '',
      });

  useEffect(() => {
  loadBudgets()
}, [])

const loadBudgets = async () => {
  const { data, error } =
    await supabase
      .from('budget')
      .select('*')

  if (error) {
    console.log(error)
    return
  }

  const safeData =
    Array.isArray(data)
      ? data
      : []

  const tort =
    safeData.filter(
      (i) => i.type === 'tort'
    )

  const furn =
    safeData.filter(
      (i) => i.type === 'furn'
    )

  setData({
    tort,
    furn,
  })
}

 const migrateLocalData =
  async () => {
    try {
      const tort =
        DEFAULT_TORT.map(
          (i) => ({
            ...i,
            type: 'tort',
          })
        )

      const furn =
        DEFAULT_FURN.map(
          (i) => ({
            ...i,
            type: 'furn',
          })
        )

      const all = [
        ...tort,
        ...furn,
      ]

      const { error } =
        await supabase
          .from('budget')
          .insert(all)

      if (error) {
        console.log(error)
        alert('migrate fail')
        return
      }

      alert(
        'migrate success'
      )

      loadBudgets()
    } catch (e) {
      console.log(e)
    }
  }

 

  const items =
    activeTab === 'tort'
      ? data?.tort || []
      : data?.furn || []

  const filteredItems = useMemo(() => {
    return (items || []).filter((item) => {
      const q =
        (
          item.note + item.category
        ).toLowerCase()

      const matchSearch =
        q.includes(
          search.toLowerCase()
        )

      const remain =
        item.budget - item.paid

      const status =
        item.paid <= 0
          ? 'none'
          : remain <= 0
          ? 'done'
          : 'partial'

      const matchFilter =
        filter === 'all' ||
        filter === status

      return (
        matchSearch &&
        matchFilter
      )
    })
  }, [items, search, filter])

  const repairInstallments =
    async () => {
      const repaired =
        (items || []).map((item) => {
          if (
            !item.installment
          )
            return item

          const monthly =
            Number(
              item.installment
                ?.monthly || 0
            )

          if (!monthly)
            return item

          const paidCount =
            Math.min(
              Math.floor(
                Number(
                  item.paid || 0
                ) / monthly
              ),
              Number(
                item.installment
                  ?.total || 0
              )
            )

          return {
            ...item,
            installment: {
              ...item.installment,
              paid: paidCount,
            },
          }
        })

      setData((prev) => ({
        ...prev,
        [activeTab]:
          repaired,
      }))

      for (const item of repaired) {
        if (
          item.installment
        ) {
          await supabase
            .from('budget')
            .update({
              installment:
                item.installment,
            })
            .eq('id', item.id)
        }
      }
    }

  useEffect(() => {
    if (
      Array.isArray(items) &&
      items.length > 0
    ) {
      repairInstallments()
    }
  }, [items])



  const totals = useMemo(() => {
    const total = items.reduce(
      (s, i) =>
        s + Number(i.budget || 0),
      0
    )

    const paid = items.reduce(
      (s, i) =>
        s + Number(i.paid || 0),
      0
    )

    const remain = items.reduce(
      (s, i) =>
        s +
        Number(
          i.remaining ??
            (Number(i.budget || 0) -
              Number(i.paid || 0))
        ),
      0
    )

    return {
      total,
      paid,
      remain,
    }
  }, [items])

  const progress =
    totals.total > 0
      ? Math.round(
          (totals.paid /
            totals.total) *
            100
        )
      : 0

  const statusText = (item) => {
    const remain =
      item.budget - item.paid

    if (item.paid <= 0)
      return 'ยังไม่จ่าย'

    if (remain <= 0)
      return 'จ่ายครบแล้ว'

    return 'ชำระบางส่วน'
  }

  const addItem = async () => {
    try {
      if (!form.note || !form.budget) {
        showToast('กรุณากรอกรายละเอียดและราคา')
        return
      }

      const budget =
        Number(form.budget || 0)

      const paid =
        Number(form.paid || 0)

      const remaining =
        Math.max(
          budget - paid,
          0
        )

      const status =
        paid <= 0
          ? 'unpaid'
          : remaining <= 0
          ? 'paid'
          : 'partial'

      const next = {
        id: editingId || Date.now(),
        date:
          form.date || '—',
        category:
          form.category || 'อื่นๆ',
        title:
          form.title ||
          form.note,
        note: form.note,
        budget,
        paid,
        remaining,
        status,
        remark: form.remark,
        platform:
          form.platform === 'อื่นๆ'
            ? form.otherPlatform
            : form.platform,
      }

    if (editingId) {
      const payload = {
        date: form.date || null,
        
        category: next.category,
        title: next.title,
        note: next.note,
        platform: next.platform,
        budget: Number(next.budget || 0),
        paid: Number(next.paid || 0),
        remaining: Number(next.remaining || 0),
        status: next.status,
        type: activeTab,
      }

      const { error } = await supabase
        .from('budget')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        console.log(error)
        showToast('แก้ไขไม่สำเร็จ')
        return
      }

      await loadBudgets()

      setEditingId(null)
      showToast('แก้ไขรายการสำเร็จ')
    } else {
      const { error } = await supabase
        .from('budget')
        .insert({
          ...next,
          type: activeTab,
        })

      if (error) {
        console.log(error)
        showToast('บันทึกรายการไม่สำเร็จ')
        return
      }

      await loadBudgets()

      showToast('บันทึกรายการสำเร็จ')
    }

    setOpen(false)

    setForm({
      date: '',
      category: '',
      note: '',
      budget: '',
      paid: '',
      remark: '',
      platform: '',
      otherPlatform: '',
    })

    setEditingId(null)
    } catch (error) {
      console.log(error)
      showToast('เกิดข้อผิดพลาดในการบันทึก')
    }
  }

  const handleEdit = (item) => {
    const presetPlatforms = [
      'Shopee',
      'HomePro',
      'ไทวัสดุ',
      'บุญถาวร',
      'IKEA',
    ]

    const isOther =
      item.platform &&
      !presetPlatforms.includes(
        item.platform
      )

    setForm({
      date: item.date || '',
      category: item.category || '',
      note: item.note || '',
      budget: item.budget != null ? String(item.budget) : '',
      paid: item.paid || '',
      remark: item.remark || '',
      platform: isOther
        ? 'อื่นๆ'
        : item.platform || '',
      otherPlatform: isOther
        ? item.platform
        : '',
    })

    setEditingId(item.id)
    setSelectedItem(item)
    setOpen(true)
  }

  const confirmPayment = async (id) => {
    const amount =
      Number(payAmount)

    if (!amount) return

    setData((prev) => ({
      ...prev,
      [activeTab]:
        prev[activeTab].map(
          (item) => {
            if (
              item.id === id
            ) {
              return {
                ...item,
                paid:
                  item.paid +
                  amount,
              }
            }

            return item
          }
        ),
    }))
    const item =
  items.find((i) => i.id === id)

if (item) {
  await supabase
    .from('budget')
    .update({
      paid:
        item.paid + amount,
    })
    .eq('id', id)
}

    showToast('บันทึกการชำระสำเร็จ')

    setPayingId(null)
    setPayAmount('')
  }

  const deleteItem = async (id) => {
    await supabase
      .from('budget')
      .delete()
      .eq('id', id)

    setData((prev) => ({
      ...prev,
      [activeTab]:
        prev[activeTab].filter(
          (item) => item.id !== id
        ),
    }))

    setDeleteId(null)

    showToast('ลบรายการสำเร็จ')
  }

  const showToast = (text) => {
    setToast({
      show: true,
      text,
    })

    setTimeout(() => {
      setToast({
        show: false,
        text: '',
      })
    }, 2200)
  }

  const resetData = () => {

    setData({
      tort: DEFAULT_TORT,
      furn: DEFAULT_FURN,
    })
  }

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
      background: rgba(255,255,255,.75);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,.6);
      border-radius: 24px;
      padding: 18px;
      box-shadow: 0 10px 30px rgba(0,0,0,.04);
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
      background: #111;
      color: white;
      padding: 14px;
      border-radius: 16px;
      font-weight: 700;
      margin-top: 10px;
    }
  }

  @media (min-width: 769px) {
    .mobile-cards {
      display: none !important;
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

    <div
      className="app-shell"
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 15% 20%, rgba(217,196,169,.42), transparent 32%),
          radial-gradient(circle at 80% 10%, rgba(186,215,255,.55), transparent 34%),
          radial-gradient(circle at 50% 80%, rgba(255,240,220,.42), transparent 36%),
          linear-gradient(180deg,#F8FAFF,#F8F4EF)
        `,
        backgroundSize: '140% 140%',
        animation: 'meshMove 18s ease infinite',
        padding: '40px',
        fontFamily: "'IBM Plex Sans Thai', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        
<div
  className="hero-grid"
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'center',
    gap: '40px',
    marginBottom: '48px',
    minHeight: '360px',
  }}
>
  <div
    style={{
      position: 'relative',
      zIndex: 2,
    }}
  >
    <h1
      className="hero-title"
      style={{
        fontSize: 'clamp(52px,6vw,84px)',
        lineHeight: '.95',
        letterSpacing: '-0.04em',
        margin: 0,
        color: '#1B2430',
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
        color: '#7C8798',
        marginTop: '18px',
        fontSize: '16px',
        lineHeight: 1.7,
        maxWidth: '640px',
      }}
    >
      Take control of your home budget with a
      softer, more intentional experience —
      from renovation plans to furniture,
      appliances, and installment tracking.
    </p>

  </div>

  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    }}
  >
    <img
      src={house3d}
      alt="3D House"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '760px',
        objectFit: 'contain',
        filter:
          'drop-shadow(0 40px 80px rgba(0,0,0,.18))',
        animation:
          'floatCard 7s ease-in-out infinite',
      }}
    />
  </div>
</div>

            <div
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'right',
        marginTop: '32px',
        flexWrap: 'wrap',
        marginBottom: '24px',
    width: '100%',
    justifyContent: 'flex-end',
      }}
    >
      

      <div
        style={{
          display: 'flex',
          background: '#EDE7D9',
          padding: '4px',
          borderRadius: '14px',
          fontSize: '16px'
        }}
      >
        <TabButton
          active={activeTab === 'tort'}
          onClick={() => setActiveTab('tort')}
        >
          🔨 ต่อเติม
        </TabButton>

        <TabButton
          active={activeTab === 'furn'}
          onClick={() => setActiveTab('furn')}
        >
          🛋 ของแต่งบ้าน
        </TabButton>
      </div>
    </div>

<div
  className="summary-grid"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(240px,1fr))',
            gap: '16px',
            marginBottom: '20px',
          
          }}
        >
          <SummaryCard
            title="งบทั้งหมด"
            value={totals.total}
          />

          <SummaryCard
            title="จ่ายแล้ว"
            value={totals.paid}
            color="#4A7A52"
          />

          <SummaryCard
            title="คงเหลือ"
            value={totals.remain}
            color="#B07D2A"
          />
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,.68)',
            borderRadius: '36px',
            padding: '20px',
            marginBottom: '20px',
            maxHeight: 'fit-content',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              marginBottom: '10px',
            }}
          >
            <span>
              ความคืบหน้าการชำระ
            </span>

            <strong>
              {progress}%
            </strong>
          </div>

          <div
            style={{
              height: '10px',
              borderRadius:
                '999px',
              background:
                'rgba(0,0,0,.06)',
              overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,.55)',
            boxShadow: '0 18px 50px rgba(31,41,55,.06)',
        transition: 'all .35s ease',
        animation: 'floatCard 7s ease-in-out infinite',
        transform: 'translateY(0px)',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background:
                  'linear-gradient(90deg,#6FA6E8,#B58A55)',
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,.68)',
            borderRadius: '36px',
            overflow: 'hidden',
          }}
        >
          <div
            className="table-toolbar"
            style={{
              padding: '16px',
              borderBottom:
                '1px solid rgba(255,255,255,.45)',
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <strong>
              รายการทั้งหมด
            </strong>

            <div className="table-filters" style={{display:'flex',gap:'10px',alignItems:'center'}}><FilterButton
              active={
                filter ===
                'all'
              }
              onClick={() =>
                setFilter(
                  'all'
                )
              }
            >
              ทั้งหมด
            </FilterButton>

            <FilterButton
              active={
                filter ===
                'done'
              }
              onClick={() =>
                setFilter(
                  'done'
                )
              }
            >
              จ่ายครบ
            </FilterButton>

            <FilterButton
              active={
                filter ===
                'partial'
              }
              onClick={() =>
                setFilter(
                  'partial'
                )
              }
            >
              บางส่วน
            </FilterButton>

            <FilterButton
              active={
                filter ===
                'none'
              }
              onClick={() =>
                setFilter(
                  'none'
                )
              }
            >
              ยังไม่จ่าย
            </FilterButton>

            </div><input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="ค้นหา..."
              style={{
                marginLeft:
                  'auto',
                padding:
                  '10px 14px',
                borderRadius:
                  '999px',
                border:
                  '1px solid rgba(0,0,0,.06)',
                background: 'rgba(255,255,255,.75)',
                backdropFilter: 'blur(16px)',
              }}
            />

            <button
              onClick={() => {
                setForm({
                  date: new Date()
                    .toISOString()
                    .slice(0, 10),
                  category:
                    activeTab === 'tort'
                      ? TCATS[0]
                      : FCATS[0],
                  note: '',
                  budget: '',
                  paid: '',
                  remark: '',
                  platform: '',
                  otherPlatform: '',
                })

                setOpen(true)
              }}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg,#6FA6E8,#4E82AD)',
                color: '#fff',
                borderRadius: '36px',
                padding: '12px 18px',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                transition: 'all .25s ease',
              }}
            >
              {editingId ? 'แก้ไขรายการ' : '+ เพิ่มรายการ'}
            </button>
            
          </div>

          
          <div className="mobile-cards">
            {filteredItems.map((item) => {
              const remain = item.budget - item.paid

              return (
                <div
  key={item.id}
  className="mobile-budget-card"
  style={{
    position: 'relative',
  }}
>
                  <div className="mobile-budget-title">
  {item.note}
</div>

<div
  style={{
    position: 'absolute',
    top: '18px',
    right: '18px',
  }}
>
  <StatusBadge>
    {statusText(item)}
  </StatusBadge>
</div>

                  <div className="mobile-budget-meta">
                    <div>
                      <div className="mobile-budget-label">
                        หมวด
                      </div>

                      <div className="mobile-budget-value">
                        {item.category}
                      </div>
                    </div>

                    <div>
                      <div className="mobile-budget-label">
                        วันที่
                      </div>

                      <div className="mobile-budget-value">
                        {formatThaiDate(item.date)}
                      </div>
                    </div>

                    <div>
                      <div className="mobile-budget-label">
                        ซื้อจาก
                      </div>

                      <div className="mobile-budget-value">
                        {item.platform || '—'}
                      </div>
                    </div>

                    <div>
                      <div className="mobile-budget-label">
                        จ่ายแล้ว
                      </div>

                      <div className="mobile-budget-value">
                        ฿{safeNumber(item.paid)}
                      </div>
                    </div>

                    <div>
                      <div className="mobile-budget-label">
                        คงเหลือ
                      </div>

                      <div className="mobile-budget-value">
                        ฿{safeNumber(remain)}
                      </div>
                    </div>
                  </div>

                  {item.remark && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '12px',
                        borderRadius: '14px',
                        background: 'rgba(0,0,0,.04)',
                        fontSize: '14px',
                        lineHeight: 1.5,
                      }}
                    >
                      <strong>หมายเหตุ:</strong> {item.remark}
                    </div>
                  )}

                  <div
  style={{
    display: 'flex',
    gap: '10px',
    marginTop: '18px',
        alignItems: 'end'
  }}
>
  {item.paid < item.budget && (
    <button
      className="mobile-action"
      onClick={() => {
        setPayingId(item.id)

        setPayAmount(
          item?.installmentPerMonth
            ? String(
                item.installmentPerMonth
              )
            : ''
        )
      }}
    >
      + ชำระ
    </button>
  )}


  <button
    onClick={() =>
      handleEdit(item)
    }
    style={{
      width: '54px',
      height: '54px',
      borderRadius: '18px',
      border:
        '1px solid rgba(0,0,0,.06)',
      background:
        'rgba(255,255,255,.95)',
      color: '#111',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <EditOutlined />
  </button>

  <button
    onClick={() =>
      setDeleteId(item.id)
    }
    style={{
      width: '54px',
      height: '54px',
      borderRadius: '18px',
      border:
        '1px solid rgba(255,0,0,.08)',
      background:
        'rgba(255,240,240,.95)',
      color: '#C94B4B',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <DeleteOutlined />
  </button>
</div>
                </div>
              )
            })}
          </div>

<div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
              className="desktop-table"
              style={{
                width: '100%',
                minWidth:
                  '1000px',
                borderCollapse:
                  'collapse',
              }}
            >
              <thead>
                <tr>
                  <TH>
                    วันที่
                  </TH>
                  <TH>
                    หมวด
                  </TH>
                  <TH>
                    รายละเอียด
                  </TH>
                  <TH>
                    ซื้อจาก
                  </TH>
                  <TH>
                    หมายเหตุ
                  </TH>
                  <TH>
                    ราคาเต็ม
                  </TH>
                  <TH>
                    จ่ายแล้ว
                  </TH>
                  <TH>
                    คงเหลือ
                  </TH>
                  <TH>
                    สถานะ
                  </TH>
                  <TH sticky>
                    Action
                  </TH>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map(
                  (item) => {
                    const remain =
                      item.budget -
                      item.paid

                    return (
                      <>
                        <tr
                          key={
                            item.id
                          }
                        >
                          <TD>
                            {
                              formatThaiDate(item.date)
                            }
                          </TD>

                          <TD>
                            {
                              item.category
                            }
                          </TD>

                          <TD>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                alignItems: 'flex-start',
                              }}
                            >
                              <div>
                                {
                                  item.note
                                }
                              </div>

                            {item.installment && (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px 14px',
                                  borderRadius: '999px',
                                  background:
                                    'rgba(111,166,232,.14)',
                                  color: '#4E82AD',
                                  fontSize: '14px',
                                  fontWeight: 700,
                                  marginTop: '10px',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span>
                                  ผ่อน{' '}
                                  {item.installment.paid}/
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

                                <span>
                                  ฿
                                  {Math.round(
                                    item.budget /
                                    item.installment.total
                                  ).toLocaleString()}
                                  / งวด
                                </span>
                              </div>
                            )}

                            </div>
                          </TD>

                          <TD>
                            {item.platform || '—'}
                          </TD>

                          <TD
                            style={{
                              maxWidth: '220px',
                              whiteSpace: 'pre-wrap',
                              color: '#666',
                            }}
                          >
                            {item.remark || '—'}
                          </TD>

                          <TD>
                            ฿
                            {safeNumber(item.budget)}
                          </TD>

                          <TD>
                            ฿
                            {safeNumber(item.paid)}
                          </TD>

                          <TD>
                            ฿
                            {safeNumber(remain)}
                          </TD>

                          <TD>
                            <StatusBadge>
                              {statusText(
                                item
                              )}
                            </StatusBadge>
                          </TD>

                          <TD
                            sticky
                          >
                            <div
                              style={{
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'center',
                                height: '100%',
                              }}
                            >
                             {item.paid < item.budget && (
  <button
    style={{
      border:
        '1px solid rgba(0,0,0,.08)',
      background:
        'rgba(255,255,255,.92)',
      boxShadow:
        '0 4px 14px rgba(0,0,0,.06)',
      borderRadius: '12px',
      padding: '8px 12px',
      whiteSpace: 'nowrap',
    }}
    onClick={() => {
      setPayingId(item.id)

      setPayAmount(
        item.installment
          ? String(
              Math.round(
                item.budget /
                  item.installment.total
              )
            )
          : ''
      )
    }}
  >
    + ชำระ
  </button>
)}

<button
  onClick={() =>
    handleEdit(item)
  }
  style={{
    width: '32px',
    height: '32px',
    borderRadius: '12px',
    border:
      '1px solid rgba(0,0,0,.08)',
    background:
      'rgba(255,255,255,.92)',
    color: '#111',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  <EditOutlined />
</button>

<button
  onClick={() =>
    setDeleteId(item.id)
  }
  style={{
    width: '32px',
    height: '32px',
    borderRadius: '12px',
    border:
      '1px solid rgba(255,0,0,.08)',
    background:
      'rgba(255,240,240,.9)',
    color: '#C94B4B',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  <DeleteOutlined />
</button>
                            </div>
                          </TD>
                        </tr>

                        {payingId ===
                          item.id && (
                          <tr>
                            <td
                              colSpan={
                                10
                              }
                              style={{
                                background:
                                  '#F2F8F3',
                                padding:
                                  '14px',
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    'flex',
                                  gap: '10px',
                                  alignItems:
                                    'center',
                                }}
                              >
                                <input
                                  type="number"
                                  value={
                                    payAmount
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    setPayAmount(
                                      e
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder="จำนวนเงิน"
                                />

                                <button
                                  onClick={() =>
                                    confirmPayment(
                                      item.id
                                    )
                                  }
                                >
                                  ✓
                                  บันทึก
                                </button>

                                <button
                                  onClick={() =>
                                    setPayingId(
                                      null
                                    )
                                  }
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      

{open && (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background:
        'rgba(15,15,15,.28)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)',
      padding: window.innerWidth < 768 ? '0px' : '24px',
    }}
    onClick={() =>
      setOpen(false)
    }
  >
    <div
      onClick={(e) =>
        e.stopPropagation()
      }
      onKeyDown={(e) => {
        if (
          e.key === 'Enter' &&
          e.target.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault()

          if (hasFormChanges) {
            addItem()
          }
        }
      }}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: window.innerWidth < 768 ? '100%' : '820px',
        borderRadius: window.innerWidth < 768 ? '28px 28px 0 0' : '40px',
        background:
          'rgba(255,255,255,.92)',
        backdropFilter:
          'blur(24px)',
        border:
          '1px solid rgba(255,255,255,.6)',
        boxShadow:
          '0 30px 90px rgba(0,0,0,.12)',
        maxHeight:
          window.innerWidth < 768
            ? '100dvh'
            : 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(false)}
        style={{
          position: 'absolute',
          top: '18px',
          right: '18px',
          width: '42px',
          height: '42px',
          border: 'none',
          borderRadius: '999px',
          background: 'rgba(255,255,255,.82)',
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
          fontSize: '18px',
          fontWeight: 700,
        }}
      >
        ✕
      </button>

      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: 'rgba(255,255,255,.94)',
          backdropFilter: 'blur(16px)',
          padding:
            window.innerWidth < 768
              ? '28px 20px 18px'
              : '32px 32px 20px',
          borderBottom: '1px solid rgba(0,0,0,.06)',
        }}
      >
        <h3
          style={{
            fontSize: window.innerWidth < 768 ? '32px' : '42px',
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing:
              '-0.05em',
            color: '#6B4B2A',
            margin: 0,
            paddingRight: '48px',
          }}
        >{editingId ? 'แก้ไขรายการ' : '+ เพิ่มรายการ'}</h3>
      </div>

      <div
          style={{
            flex: 1,
            overflowY: 'auto',
          padding:
            window.innerWidth < 768
              ? '20px 20px 120px'
              : '24px 32px 140px',
        }}
      >

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            window.innerWidth < 768
              ? '1fr'
              : '1fr 1fr',
          gap: '16px',
          marginBottom: '18px',
        }}
      >
        <Field label="วันที่">
          <input
            type="date"
            value={convertThaiDate(form.date || "")}
            onChange={(e) =>
              setForm({
                ...form,
                date:
                  e.target.value,
              })
            }
            style={fieldStyle}
          />
        </Field>

        <Field label="หมวดงาน / หมวดสินค้า">
          <select
            value={form.cat}
            onChange={(e) =>
              setForm({
                ...form,
                category:
                  e.target.value,
              })
            }
            style={{
  ...fieldStyle,
  appearance: 'none',
  WebkitAppearance: 'none',
  padding: '0 48px 0 22px',

  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23666' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",

  backgroundRepeat: 'no-repeat',

  backgroundPosition:
    'right 20px center',
}}
          >
            {(activeTab ===
            'tort'
              ? TCATS
              : FCATS
            ).map((c) => (
              <option
                key={c}
                value={c}
              >
                {c}
              </option>
            ))}
          </select>
        </Field>
        </div>
      

      <div
        style={{
          marginBottom: '18px',
        }}
      >
        <Field label="รายละเอียด">
          <input
            type="text"
            placeholder="ชื่อรายการ..."
            value={form.note}
            onChange={(e) =>
              setForm({
                ...form,
                note:
                  e.target.value,
              })
            }
            style={fieldStyle}
          />
        </Field>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            window.innerWidth < 768
              ? '1fr'
              : '1fr 1fr',
          gap: '16px',
          marginBottom: '18px',
        }}
      >
        <Field
          label="ราคา (บาท)"
        >
          <input
            type="number"
            value={form.budget ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                budget:
                  e.target.value,
              })
            }
            style={fieldStyle}
          />
        </Field>

        <Field
          label="จ่ายแล้ว (บาท)"
        >
          <input
            type="number"
            value={form.paid ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                paid:
                  e.target.value,
              })
            }
            style={fieldStyle}
          />
        </Field>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            window.innerWidth < 768
              ? '1fr'
              : '1fr 1fr',
          gap: '16px',
          marginBottom: '18px',
        }}
      >
        <Field label="ซื้อจาก">
          <select
            value={form.platform}
            onChange={(e) =>
              setForm({
                ...form,
                platform:
                  e.target.value,
              })
            }
            style={{
              ...fieldStyle,
              appearance: 'none',
              WebkitAppearance: 'none',
              padding: '0 48px 0 22px',
            }}
          >
            <option value="">
              เลือก Platform
            </option>

            {PLATFORMS.map((p) => (
              <option
                key={p}
                value={p}
              >
                {p}
              </option>
            ))}
          </select>
        </Field>

        {form.platform ===
          'อื่นๆ' && (
          <Field label="ระบุร้าน / Platform">
            <input
              type="text"
              placeholder="กรอกชื่อร้าน..."
              value={
                form.otherPlatform
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  otherPlatform:
                    e.target.value,
                })
              }
              style={fieldStyle}
            />
          </Field>
        )}
      </div>

      <div
        style={{
          marginBottom: '18px',
        }}
      >
        <Field label="หมายเหตุ">
          <textarea
            placeholder="หมายเหตุเพิ่มเติม..."
            value={form.remark}
            onChange={(e) =>
              setForm({
                ...form,
                remark:
                  e.target.value,
              })
            }
            style={{
              ...fieldStyle,
              minHeight: '120px',
              paddingTop: '18px',
              resize: 'none',
            }}
          />
        </Field>
      </div>

      </div>

      <div
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 3,
          display: 'flex',
          justifyContent:
            'flex-end',
          gap: '16px',
          padding:
            window.innerWidth < 768
              ? '18px 20px calc(18px + env(safe-area-inset-bottom))'
              : '22px 32px',
          background: 'rgba(255,255,255,.96)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(0,0,0,.06)',
        }}
      >
        <button
          onClick={() =>
            setOpen(false)
          }
          className="modal-cancel"
          style={{
            height: '58px',
            padding: '0 34px',
            borderRadius: '22px',
            border: '1px solid #D8CCBB',
            background: '#EFE7DB',
            color: '#6F5B47',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ยกเลิก
        </button>

        <button
                  type="submit"
                  onClick={addItem}
                  disabled={!hasFormChanges}
                  style={{
                    minWidth: '140px',
                    height: '56px',
                    padding: '0 32px',
                    border: 'none',
                    borderRadius: '18px',
                    background:
                      'linear-gradient(135deg,#6FA6E8,#4E82AD)',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: !hasFormChanges
                      ? 'not-allowed'
                      : 'pointer',
                    opacity: !hasFormChanges
                      ? 0.55
                      : 1,
                    boxShadow:
                      '0 10px 24px rgba(78,130,173,.22)',
                    transition:
                      'all .2s ease',
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
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,15,15,.28)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)',
      padding:
        window.innerWidth < 768
          ? '18px'
          : '24px',
    }}
    onClick={() => {
      setPayingId(null)
      setPayAmount('')
    }}
  >
    <div
      onClick={(e) =>
        e.stopPropagation()
      }
      style={{
        width: '100%',
        maxWidth: '460px',
        borderRadius:
          window.innerWidth < 768
            ? '32px'
            : '36px',
        padding:
          window.innerWidth < 768
            ? '28px 22px'
            : '32px',
        background:
          'rgba(255,255,255,.82)',
        backdropFilter: 'blur(24px)',
        border:
          '1px solid rgba(255,255,255,.6)',
        boxShadow:
          '0 30px 90px rgba(0,0,0,.12)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '32px',
            fontWeight: 800,
            color: '#1B2430',
            letterSpacing:
              '-0.04em',
          }}
        >
          ชำระเงิน
        </h3>

        <button
          onClick={() => {
            setPayingId(null)
            setPayAmount('')
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '999px',
            border: 'none',
            background:
              'rgba(255,255,255,.8)',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          marginBottom: '20px',
        }}
      >
        <label
          style={{
            display: 'block',
            marginBottom: '10px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#8B7A68',
          }}
        >
          จำนวนเงิน
        </label>

        <input
          type="number"
          value={payAmount}
          onChange={(e) =>
            setPayAmount(
              e.target.value
            )
          }
          placeholder="กรอกจำนวนเงิน"
          style={{
            width: '100%',
            height: '62px',
            borderRadius: '20px',
            border:
              '1px solid rgba(255,255,255,.5)',
            background:
              'rgba(255,255,255,.88)',
            padding: '0 20px',
            fontSize: '18px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        onClick={() => {
          confirmPayment(
            payingId
          )
        }}
        style={{
          width: '100%',
          height: '60px',
          border: 'none',
          borderRadius: '22px',
          background:
            'linear-gradient(135deg,#6FA6E8,#4E82AD)',
          color: '#fff',
          fontSize: '18px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow:
            '0 14px 30px rgba(78,130,173,.22)',
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
      position: 'fixed',
      inset: 0,
      background:
        'rgba(15,15,15,.28)',
      zIndex: 130,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)',
      padding: '20px',
    }}
    onClick={() =>
      setDeleteId(null)
    }
  >
    <div
      onClick={(e) =>
        e.stopPropagation()
      }
      style={{
        width: '100%',
        maxWidth: '420px',
        borderRadius: '32px',
        padding: '30px',
        background:
          'rgba(255,255,255,.88)',
        backdropFilter:
          'blur(24px)',
        boxShadow:
          '0 30px 90px rgba(0,0,0,.12)',
      }}
    >
      <div
        style={{
          fontSize: '22px',
          fontWeight: 800,
          marginBottom: '12px',
          color: '#1B2430',
        }}
      >
        ลบรายการ
      </div>

      <div
        style={{
          color: '#666',
          lineHeight: 1.7,
          marginBottom: '28px',
        }}
      >
        คุณต้องการลบรายการนี้จริงใช่ไหม
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent:
            'flex-end',
          gap: '12px',
        }}
      >
        <button
          onClick={() =>
            setDeleteId(null)
          }
          style={{
            height: '50px',
            padding: '0 20px',
            borderRadius: '16px',
            border:
              '1px solid rgba(0,0,0,.08)',
            background:
              '#F5F5F5',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ยกเลิก
        </button>

        <button
          onClick={() =>
            deleteItem(deleteId)
          }
          style={{
            height: '50px',
            padding: '0 22px',
            borderRadius: '16px',
            border: 'none',
            background:
              '#D64545',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ลบรายการ
        </button>
      </div>
    </div>
  </div>
)}

{toast.show && (
  <div
    style={{
      position: 'fixed',
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      animation:
        'toastSlide .38s cubic-bezier(.22,1,.36,1)',
    }}
  >
    <div
      style={{
        background:
          'rgba(22,22,22,.92)',
        color: '#fff',
        padding: '14px 18px',
        borderRadius: '18px',
        backdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: 700,
        boxShadow:
          '0 18px 50px rgba(0,0,0,.18)',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '999px',
          background: '#DDF5E4',
          color: '#2E6B45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13px',
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
  )
}


const fieldStyle = {
  width: '100%',
  borderRadius: '22px',
  border: '1px solid rgba(255,255,255,.55)',
  background:
    'rgba(255,255,255,.88)',
  padding: '0 22px',
  fontSize: '16px',
  height: '64px',
  outline: 'none',
  boxSizing: 'border-box',
  appearance: 'none',
WebkitAppearance: 'none',
}

function Field({
  label,
  children,
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: '10px',
          fontSize: '16px',
          fontWeight: 600,
          color: '#9A8873',
        }}
      >
        {label}
      </label>

      <div>
        {children}
      </div>
    </div>
  )
}


function SummaryCard({
  title,
  value,
  color = '#2C5F82',
}) {
  return (
    <>

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

    <div
      className="summary-card"
      style={{
        background: 'rgba(255,255,255,.68)',
        borderRadius: '36px',
        padding: '40px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,.5)',
        boxShadow: '0 18px 50px rgba(31,41,55,.06)',
        transition: 'all .35s ease',
        animation: 'floatCard 7s ease-in-out infinite',
        transform: 'translateY(0px)',
      }}
    >
      <div
        style={{
          color: '#8B8B8B',
          fontSize: '16px',
          marginBottom: '12px',
        }}
      >
        {title}
      </div>

      <h2
        className="summary-value"
        style={{
          marginTop: '4px',
          color,
          fontSize: 'clamp(36px,4vw,54px)',
          letterSpacing: '-0.04em',
          fontWeight: 700,
          marginBottom: '0px',
        }}
      >
        ฿
        {safeNumber(value)}
      </h2>



    </div>
    </>
  )
}

function TabButton({
  children,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 'none',
        padding:
          '10px 18px',
        borderRadius:
          '10px',
        background: active
          ? '#111111'
          : 'transparent',
        color: active
          ? '#fff'
          : '#555',
      }}
    >
      {children}
    </button>
  )
}

function FilterButton({
  children,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border:
          '1px solid rgba(255,255,255,.5)',
        borderRadius:
          '999px',
        padding:
          '6px 14px',
        background: active
          ? '#111111'
          : 'rgba(255,255,255,.75)',
        color: active
          ? '#fff'
          : '#444',
        backdropFilter: 'blur(12px)',
      }}
    >
      {children}
    </button>
  )
}


function StatusBadge({
  children,
}) {

  let bg = '#FFF1D6'
  let color = '#A8741A'

  if (children === 'จ่ายครบแล้ว') {
    bg = '#DDF5E4'
    color = '#2E6B45'
  }

  if (children === 'ยังไม่จ่าย') {
    bg = '#FFE1E1'
    color = '#A23B3B'
  }

  return (
    <span
      style={{
        background: bg,
        color: color,
        borderRadius: '999px',
        padding: '6px 12px',
        fontSize: '14px',
        fontWeight: 600,
        whiteSpace: 'nowrap'
      }}
    >
      {children}
    </span>
  )
}
function TH({
  children,
  sticky,
}) {
  return (
    <th
      style={{
        padding: '14px',
        background:
          'rgba(255,255,255,.72)',
        backdropFilter: 'blur(20px)',
        textAlign:
          'left',
        position: sticky
          ? 'sticky'
          : 'static',
        right: sticky
          ? 0
          : undefined,
      }}
    >
      {children}
    </th>
  )
}

function TD({
  children,
  sticky,
  style = {},
}) {
  return (
    <td
      style={{
        paddingTop: '16px',
        paddingBottom: '16px',
        paddingLeft: '14px',
        paddingRight: '14px',
        verticalAlign: 'top',
        borderBottom:
          '1px solid rgba(0,0,0,.05)',
        transition: 'background .2s ease',
        background:
          'rgba(255,255,255,.72)',
        position: sticky
          ? 'sticky'
          : 'static',
        right: sticky
          ? 0
          : undefined,
        ...style,
      }}
    >
      {children}
    </td>
  )
}


// floating animation styles
const floatingStyle = {
  animation: 'float 6s ease-in-out infinite'
}

/*
CLARIO THEME UPGRADE:
- editorial typography
- mesh gradient background
- premium glass cards
- floating fintech feel
- airy spacing
- luxury table styling
*/
