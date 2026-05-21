
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
    <div
      style={{
        minHeight: '100vh',
        background: '''
          radial-gradient(circle at top left, rgba(255,220,220,.35), transparent 28%),
          radial-gradient(circle at top right, rgba(210,225,255,.35), transparent 28%),
          #F7F5F1
        ''',
        padding: '32px',
        fontFamily:
          'Inter, Noto Sans Thai, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '64px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '72px',
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
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <button
              onClick={resetData}
              style={{
                border: '1px solid rgba(0,0,0,.08)',
                background: 'rgba(255,255,255,.72)',
                backdropFilter: 'blur(16px)',
                borderRadius: '16px',
                padding: '12px 18px',
                fontWeight: 600,
                color: '#444',
                boxShadow: '0 4px 20px rgba(0,0,0,.04)',
                transition: '.2s ease',
              }}
            >
              ↺ รีเซ็ต
            </button>

            <div
              style={{
                display: 'flex',
                background:
                  '#EDE7D9',
                padding: '4px',
                borderRadius:
                  '12px',
              }}
            >
              <TabButton
                active={
                  activeTab ===
                  'tort'
                }
                onClick={() =>
                  setActiveTab(
                    'tort'
                  )
                }
              >
                🔨 ต่อเติม
              </TabButton>

              <TabButton
                active={
                  activeTab ===
                  'furn'
                }
                onClick={() =>
                  setActiveTab(
                    'furn'
                  )
                }
              >
                🛋 ของแต่งบ้าน
              </TabButton>
            </div>
          </div>
        </div>

        <div
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
            borderRadius: '16px',
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
        transform: 'translateY(0px)',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background:
                  '#4A7A52',
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,.72)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <div
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

            <FilterButton
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

            <input
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
                  '1px solid #ddd',
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
                borderRadius: '16px',
                padding: '12px 18px',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                transition: '.2s ease',
              }}
            >
              + เพิ่มรายการ
            </button>
          </div>

          <div
            style={{
              overflowX: 'auto',
            }}
          >
            <table
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
            position:
              'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,.4)',
            display: 'flex',
            justifyContent:
              'center',
            alignItems:
              'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background:
                '#fff',
              borderRadius:
                '20px',
              width: '100%',
              maxWidth:
                '520px',
              padding:
                '24px',
            }}
          >
            <h2>
              เพิ่มรายการ
            </h2>

            <div
              style={{
                display:
                  'grid',
                gap: '12px',
                marginTop:
                  '20px',
              }}
            >
              <input
                placeholder="วันที่"
                value={
                  form.date
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    date:
                      e
                        .target
                        .value,
                  })
                }
              />

              <input
                placeholder="หมวด"
                value={
                  form.cat
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    cat:
                      e
                        .target
                        .value,
                  })
                }
              />

              <input
                placeholder="รายละเอียด"
                value={
                  form.note
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    note:
                      e
                        .target
                        .value,
                  })
                }
              />

              <input
                type="number"
                placeholder="งบ"
                value={
                  form.total
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    total:
                      e
                        .target
                        .value,
                  })
                }
              />

              <input
                type="number"
                placeholder="จ่ายแล้ว"
                value={
                  form.paid
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    paid:
                      e
                        .target
                        .value,
                  })
                }
              />
            </div>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'flex-end',
                gap: '10px',
                marginTop:
                  '24px',
              }}
            >
              <button
                onClick={() =>
                  setOpen(
                    false
                  )
                }
              >
                ยกเลิก
              </button>

              <button
                onClick={
                  addItem
                }
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  title,
  value,
  color = '#2C5F82',
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,.72)',
        borderRadius: '16px',
        padding: '32px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,.5)',
        boxShadow: '0 10px 40px rgba(0,0,0,.04)',
        transition: 'all .35s ease',
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
        style={{
          marginTop: '4px',
          color,
          fontSize: '52px',
          letterSpacing: '-0.04em',
          fontWeight: 700,
        }}
      >
        ฿
        {value.toLocaleString()}
      </h2>
    </div>
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
          'rgba(255,255,255,.88)',
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
          '1px solid #eee',
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
