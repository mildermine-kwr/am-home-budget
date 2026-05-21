import house3d from './image.png'

import { useEffect, useMemo, useState } from 'react'
import { TORT, FURN } from './data/items'

const DEFAULT_TORT = TORT

const DEFAULT_FURN = FURN

const STORAGE_KEY =
  'am-home-react-budget'

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
    const saved =
      localStorage.getItem(
        STORAGE_KEY
      )

    if (saved)
      return JSON.parse(saved)

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
          radial-gradient(circle at 20% 20%, rgba(255,170,170,.55), transparent 32%),
          radial-gradient(circle at 80% 10%, rgba(170,190,255,.55), transparent 32%),
          radial-gradient(circle at 50% 80%, rgba(255,220,180,.45), transparent 36%),
          #F7F5F1
        `,
        backgroundSize: '140% 140%',
        animation: 'meshMove 18s ease infinite',
        padding: '48px',
        fontFamily:
          'Inter, Noto Sans Thai, sans-serif',
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
    marginBottom: '96px',
    minHeight: '720px',
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
        fontSize: '104px',
        lineHeight: '.95',
        letterSpacing: '-0.04em',
        margin: 0,
        color: '#111111',
        fontWeight: 800,
      }}
    >
      🏡 AM Home
      <br />
      budgeting your
      <br />
      dream home.
    </h1>

    <p
      className="hero-subtitle"
      style={{
        color: '#9B9B9B',
        marginTop: '18px',
        fontSize: '18px',
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
          background: 'rgba(255,255,255,.72)',
          backdropFilter: 'blur(16px)',
          borderRadius: '32px',
          padding: '14px 20px',
          fontWeight: 600,
          color: '#444',
          boxShadow: '0 4px 20px rgba(0,0,0,.04)',
        }}
      >
        ↺ รีเซ็ต
      </button>

      <div
        style={{
          display: 'flex',
          background: '#EDE7D9',
          padding: '4px',
          borderRadius: '14px',
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
            background: 'rgba(255,255,255,.72)',
            borderRadius: '32px',
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
            boxShadow: '0 10px 40px rgba(0,0,0,.04)',
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
                  'linear-gradient(90deg,#5E8B67,#8DB996)',
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,.72)',
            borderRadius: '32px',
            overflow: 'hidden',
          }}
        >
          <div
            className="table-toolbar"
            style={{
              padding: '16px',
              borderBottom:
                '1px solid #eee',
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
              onClick={() =>
                setOpen(true)
              }
              style={{
                border: 'none',
                background: '#111111',
                color: '#fff',
                borderRadius: '32px',
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

                  <button className="mobile-action">
                    + ชำระ
                  </button>
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
                  <TH sticky>
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
                                  fontSize:
                                    '12px',
                                  color:
                                    '#777',
                                  marginTop:
                                    '4px',
                                }}
                              >
                                ผ่อน{' '}
                                {
                                  item
                                    .installment
                                    .paid
                                }
                                /
                                {
                                  item
                                    .installment
                                    .total
                                }
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

                          <TD
                            sticky
                          >
                            <button
                              style={{
                                border: '1px solid rgba(0,0,0,.08)',
                                background: 'rgba(255,255,255,.92)',
                                boxShadow: '0 4px 14px rgba(0,0,0,.06)',
                                borderRadius: '12px',
                                padding: '8px 12px',
                              }}
                              onClick={() =>
                                setPayingId(
                                  item.id
                                )
                              }
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
      background: 'rgba(15,15,15,.45)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      zIndex: 9999,
    }}
  >
    <div
      style={{
        width: '100%',
        maxWidth: '620px',
        borderRadius: '36px',
        background:
          'rgba(255,255,255,.78)',
        backdropFilter: 'blur(24px)',
        border:
          '1px solid rgba(255,255,255,.55)',
        boxShadow:
          '0 30px 80px rgba(0,0,0,.12)',
        padding: '34px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          marginBottom: '28px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '42px',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#111',
              lineHeight: 1,
            }}
          >
            เพิ่มรายการ
          </div>

          <div
            style={{
              marginTop: '10px',
              color: '#8B8B8B',
              fontSize: '15px',
            }}
          >
            เพิ่มค่าใช้จ่ายใหม่เข้าสู่ระบบ
          </div>
        </div>

        <button
          onClick={() =>
            setOpen(false)
          }
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '999px',
            border: 'none',
            background:
              'rgba(0,0,0,.06)',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '16px',
        }}
      >
        <ModernInput
          placeholder="วันที่"
          value={form.date}
          onChange={(e) =>
            setForm({
              ...form,
              date: e.target.value,
            })
          }
        />

        <ModernInput
          placeholder="หมวด"
          value={form.cat}
          onChange={(e) =>
            setForm({
              ...form,
              cat: e.target.value,
            })
          }
        />

        <ModernInput
          placeholder="รายละเอียด"
          value={form.note}
          onChange={(e) =>
            setForm({
              ...form,
              note: e.target.value,
            })
          }
        />

        <ModernInput
          type="number"
          placeholder="งบประมาณ"
          value={form.total}
          onChange={(e) =>
            setForm({
              ...form,
              total:
                e.target.value,
            })
          }
        />

        <ModernInput
          type="number"
          placeholder="จ่ายแล้ว"
          value={form.paid}
          onChange={(e) =>
            setForm({
              ...form,
              paid:
                e.target.value,
            })
          }
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '32px',
        }}
      >
        <button
          onClick={() =>
            setOpen(false)
          }
          style={{
            border:
              '1px solid rgba(0,0,0,.08)',
            background:
              'rgba(255,255,255,.72)',
            padding:
              '14px 20px',
            borderRadius: '18px',
            fontWeight: 600,
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          ยกเลิก
        </button>

        <button
          onClick={addItem}
          style={{
            border: 'none',
            background:
              '#111111',
            color: '#fff',
            padding:
              '14px 24px',
            borderRadius: '18px',
            fontWeight: 700,
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow:
              '0 12px 24px rgba(0,0,0,.12)',
          }}
        >
          + บันทึกรายการ
        </button>
      </div>
    </div>
  </div>
)}
    </div>
    </>
  )
}

function ModernInput(props) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        border:
          '1px solid rgba(0,0,0,.06)',
        background:
          'rgba(255,255,255,.72)',
        backdropFilter: 'blur(12px)',
        borderRadius: '18px',
        padding: '18px 20px',
        fontSize: '16px',
        outline: 'none',
        transition:
          'all .25s ease',
        boxSizing: 'border-box',
      }}
    />
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
        background: 'rgba(255,255,255,.72)',
        borderRadius: '32px',
        padding: '48px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,.5)',
        boxShadow: '0 10px 40px rgba(0,0,0,.04)',
        transition: 'all .35s ease',
        animation: 'floatCard 7s ease-in-out infinite',
        transform: 'translateY(0px)',
      }}
    >
      <div
        style={{
          color: '#8B8B8B',
          fontSize: '15px',
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
          fontSize: '64px',
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
          '1px solid #ddd',
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
  return (
    <span
      style={{
        background:
          'rgba(193,154,91,.12)',
        color: '#A36D1F',
        borderRadius:
          '999px',
        padding:
          '4px 10px',
        fontSize: '12px',
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
}) {
  return (
    <td
      style={{
        padding: '14px',
        borderBottom:
          '1px solid rgba(0,0,0,.05)',
        transition: 'background .2s ease',
        background:
          '#fff',
        position: sticky
          ? 'sticky'
          : 'static',
        right: sticky
          ? 0
          : undefined,
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
