import house3d from './image.png'

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

export default function App() {
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

  const [data, setData] = useState(() => {
    try {
      const saved =
        localStorage.getItem(
          STORAGE_KEY
        )

      if (saved) {
        const parsed =
          JSON.parse(saved)

        return {
          tort:
            parsed?.tort ||
            DEFAULT_TORT,
          furn:
            parsed?.furn ||
            DEFAULT_FURN,
        }
      }
    } catch (e) {
      console.log(e)
    }

    return {
      tort: DEFAULT_TORT,
      furn: DEFAULT_FURN,
    }
  })

  const [form, setForm] = useState({
    date: '',
    cat: '',
    note: '',
    total: '',
    paid: '',
    remark: '',
  })

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    )
  }, [data])

  const items =
    activeTab === 'tort'
      ? data.tort
      : data.furn

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q =
        (
          item.note + item.cat
        ).toLowerCase()

      const matchSearch =
        q.includes(
          search.toLowerCase()
        )

      const remain =
        item.total - item.paid

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
        matchSearch && matchFilter
      )
    })
  }, [items, search, filter])

  const totals = useMemo(() => {
    const total = items.reduce(
      (s, i) => s + i.total,
      0
    )

    const paid = items.reduce(
      (s, i) => s + i.paid,
      0
    )

    return {
      total,
      paid,
      remain: total - paid,
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
      item.total - item.paid

    if (item.paid <= 0)
      return 'ยังไม่จ่าย'

    if (remain <= 0)
      return 'จ่ายครบแล้ว'

    return 'ชำระบางส่วน'
  }

  const addItem = () => {
    if (!form.note || !form.total)
      return

    const next = {
      id: Date.now(),
      date:
        form.date || '—',
      cat: form.cat || 'อื่นๆ',
      note: form.note,
      total: Number(form.total),
      paid: Number(form.paid || 0),
    }

    setData((prev) => ({
      ...prev,
      [activeTab]: [
        next,
        ...prev[activeTab],
      ],
    }))

    setOpen(false)

    setForm({
      date: '',
      cat: '',
      note: '',
      total: '',
      paid: '',
    })
  }

  const confirmPayment = (id) => {
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

    setPayingId(null)
    setPayAmount('')
  }

  const resetData = () => {
    localStorage.removeItem(
      STORAGE_KEY
    )

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
      budgeting your
      <br />
      dream home.
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

    <div
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginTop: '32px',
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={resetData}
        style={{
          border: '1px solid rgba(0,0,0,.08)',
          background: 'rgba(255,255,255,.68)',
          backdropFilter: 'blur(16px)',
          borderRadius: '36px',
          padding: '14px 20px',
          fontSize: '16px',
          fontWeight: 600,
          color: '#444',
          boxShadow: '0 4px 20px rgba(0,0,0,.04)',
        }}
      >
        รีเซ็ต
      </button>

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
                  cat:
                    activeTab === 'tort'
                      ? TCATS[0]
                      : FCATS[0],
                  note: '',
                  total: '',
                  paid: '',
                  remark: '',
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
              + เพิ่มรายการ
            </button>
          </div>

          
          <div className="mobile-cards">
            {filteredItems.map((item) => {
              const remain = item.total - item.paid

              return (
                <div
                  key={item.id}
                  className="mobile-budget-card"
                >
                  <div className="mobile-budget-title">
                    {item.note}
                  </div>

                  <div className="mobile-budget-meta">
                    <div>
                      <div className="mobile-budget-label">
                        หมวด
                      </div>

                      <div className="mobile-budget-value">
                        {item.cat}
                      </div>
                    </div>

                    <div>
                      <div className="mobile-budget-label">
                        วันที่
                      </div>

                      <div className="mobile-budget-value">
                        {item.date}
                      </div>
                    </div>

                    <div>
                      <div className="mobile-budget-label">
                        จ่ายแล้ว
                      </div>

                      <div className="mobile-budget-value">
                        ฿{item.paid.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="mobile-budget-label">
                        คงเหลือ
                      </div>

                      <div className="mobile-budget-value">
                        ฿{remain.toLocaleString()}
                      </div>
                    </div>
                  </div>

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
                </div>
              )
            })}
          </div>

<div
            style={{
              width: '100%',
              overflowX: 'auto',
              overflowY: 'hidden',
              position: 'relative',
              WebkitOverflowScrolling: 'touch',
              borderRadius: '0 0 32px 32px',
            }}
          >
            <table
              className="desktop-table"
              style={{
                minWidth: '1400px',
                width: 'max-content',
                borderCollapse: 'separate',
                borderSpacing: 0,
                background: 'transparent',
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
                    งบ
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
                  <TH>
                    Action
                  </TH>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map(
                  (item) => {
                    const remain =
                      item.total -
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
                              item.date
                            }
                          </TD>

                          <TD>
                            {
                              item.cat
                            }
                          </TD>

                          <TD>
                            {
                              item.note
                            }

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
                                    item.total /
                                    item.installment.total
                                  ).toLocaleString()}
                                  / งวด
                                </span>
                              </div>
                            )}
                          </TD>

                          <TD>
                            ฿
                            {item.total.toLocaleString()}
                          </TD>

                          <TD>
                            ฿
                            {item.paid.toLocaleString()}
                          </TD>

                          <TD>
                            ฿
                            {remain.toLocaleString()}
                          </TD>

                          <TD>
                            <StatusBadge>
                              {statusText(
                                item
                              )}
                            </StatusBadge>
                          </TD>

                          <TD>
                            <button
                              style={{
                                border: '1px solid rgba(0,0,0,.08)',
                                background: 'rgba(255,255,255,.92)',
                                boxShadow: '0 4px 14px rgba(0,0,0,.06)',
                                borderRadius: '12px',
                                padding: '8px 12px',
                              }}
                              onClick={() => {
                                setPayingId(
                                  item.id
                                )

                                setPayAmount(
                                  item.installment
                                    ? String(
                                        Math.round(
                                          item.total /
                                          item.installment.total
                                        )
                                      )
                                    : ''
                                )
                              }}
                            >
                              + ชำระ
                            </button>
                          </TD>
                        </tr>

                        {payingId ===
                          item.id && (
                          <tr>
                            <td
                              colSpan={
                                8
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
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: window.innerWidth < 768 ? '100vw' : '820px',
        borderRadius: window.innerWidth < 768 ? '0px' : '40px',
        padding: window.innerWidth < 768 ? '28px 20px 40px' : '32px',
        background:
          'rgba(255,255,255,.82)',
        backdropFilter:
          'blur(24px)',
        border:
          '1px solid rgba(255,255,255,.6)',
        boxShadow:
          '0 30px 90px rgba(0,0,0,.12)',
        height:
          window.innerWidth < 768
            ? '100vh'
            : 'auto',
        overflowY: 'auto',
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

      <h3
        style={{
          fontSize: '42px',
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing:
            '-0.05em',
          color: '#6B4B2A',
          marginBottom: '34px',
        }}
      >
        + เพิ่มรายการ
      </h3>

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
            value={form.date}
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
                cat:
                  e.target.value,
              })
            }
            style={fieldStyle}
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
          label="ราคา / งบ (บาท)"
        >
          <input
            type="number"
            value={form.total}
            onChange={(e) =>
              setForm({
                ...form,
                total:
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
            value={form.paid}
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

      <div
        style={{
          display: 'flex',
          justifyContent:
            'flex-end',
          gap: '16px',
          marginTop: '34px',
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
          onClick={addItem}
          className="modal-save"
          style={{
            height: '58px',
            padding: '0 36px',
            border: 'none',
            borderRadius: '22px',
            background: '#4E82AD',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow:
              '0 14px 30px rgba(78,130,173,.22)',
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
        }}
      >
        ฿
        {value.toLocaleString()}
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
        fontWeight: 700,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {children}
    </span>
  )
}
function TH({
  children,
}) {
  return (
    <th
      style={{
        padding: '18px 20px',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        background: '#FFFFFF',
        borderBottom:
          '1px solid rgba(0,0,0,.06)',
      }}
    >
      {children}
    </th>
  )
}

function TD({
  children,
  sticky,
  action,
}) {
  return (
    <td
      style={{
        padding: '18px 20px',
        whiteSpace: 'nowrap',
        borderBottom:
          '1px solid rgba(0,0,0,.05)',
        background: sticky
          ? '#FFFFFF'
          : 'rgba(255,255,255,.72)',
        position: sticky
          ? 'sticky'
          : 'static',
        right: sticky
          ? action
            ? 0
            : 140
          : undefined,
        zIndex: sticky ? 20 : 1,
        boxShadow: sticky
          ? '-10px 0 24px rgba(15,23,42,.06)'
          : 'none',
        backdropFilter: sticky
          ? 'blur(14px)'
          : 'blur(20px)',
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
