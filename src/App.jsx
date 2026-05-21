import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { TORT, FURN } from './data/items'

const initialItems = [...TORT, ...FURN].map((item) => ({
  id: item.id,
  title: item.note || item.title,
  category: item.cat,
  budget: item.total,
  paid: item.paid,
  date: item.date,
  installment: item.installment || null,
}))

const chartData = [
  { value: 10 },
  { value: 40 },
  { value: 20 },
  { value: 55 },
  { value: 30 },
  { value: 70 },
  { value: 45 },
]

export default function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem(
      'am-home-budget-items'
    )

    return saved
      ? JSON.parse(saved)
      : initialItems
  })

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] =
    useState('ทั้งหมด')

  const [form, setForm] = useState({
    title: '',
    category: 'ต่อเติม',
    budget: '',
    paid: '',
  })

  useEffect(() => {
    localStorage.setItem(
      'am-home-budget-items',
      JSON.stringify(items)
    )
  }, [items])

  const totals = useMemo(() => {
    const total = items.reduce(
      (s, i) => s + Number(i.budget),
      0
    )

    const paid = items.reduce(
      (s, i) => s + Number(i.paid),
      0
    )

    return {
      total,
      paid,
      remain: total - paid,
    }
  }, [items])

  const categories = useMemo(() => {
    return [
      'ทั้งหมด',
      ...new Set(
        items.map((i) => i.category)
      ),
    ]
  }, [items])

  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.title
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      item.category
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchCategory =
      activeCategory === 'ทั้งหมด' ||
      item.category === activeCategory

    return matchSearch && matchCategory
  })

  const addExpense = () => {
    if (!form.title || !form.budget) {
      alert('กรุณากรอกข้อมูลให้ครบ')
      return
    }

    const newItem = {
      id: Date.now(),
      title: form.title,
      category: form.category,
      budget: Number(form.budget),
      paid: Number(form.paid || 0),
    }

    setItems([newItem, ...items])

    setForm({
      title: '',
      category: 'ต่อเติม',
      budget: '',
      paid: '',
    })

    setOpen(false)
  }

  const deleteItem = (id) => {
    setItems(items.filter((i) => i.id !== id))
  }

  const addPayment = (id) => {
    const amount = prompt('เพิ่มยอดชำระ')

    if (!amount) return

    setItems(
      items.map((item) => {
        if (item.id === id) {
          const nextPaid = Math.min(
            item.paid + Number(amount),
            item.budget
          )

          return {
            ...item,
            paid: nextPaid,
          }
        }

        return item
      })
    )
  }

  const status = (item) => {
    if (item.paid <= 0) return 'ยังไม่จ่าย'
    if (item.paid >= item.budget)
      return 'จ่ายครบ'

    return 'บางส่วน'
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          🏡 AM Home
        </div>

        <div className="nav">
          <button>Dashboard</button>
          <button>ต่อเติม</button>
          <button>ของแต่งบ้าน</button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>AM Home Budget</h1>
            <p>{items.length} รายการ</p>
          </div>

          <button
            className="fab"
            onClick={() => setOpen(true)}
          >
            + เพิ่มรายการ
          </button>
        </div>

        <section className="summary">
          <div className="card">
            <label>งบทั้งหมด</label>

            <h2>
              ฿{totals.total.toLocaleString()}
            </h2>
          </div>

          <div className="card">
            <label>จ่ายแล้ว</label>

            <h2 style={{ color: '#10b981' }}>
              ฿{totals.paid.toLocaleString()}
            </h2>
          </div>

          <div className="card">
            <label>คงเหลือ</label>

            <h2 style={{ color: '#f59e0b' }}>
              ฿{totals.remain.toLocaleString()}
            </h2>
          </div>
        </section>

        <section className="grid">
          <div className="card">
            <h3>Budget Overview</h3>

            <div className="chart">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart data={chartData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3>Quick Search</h3>

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="ค้นหา..."
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid #e5e7eb',
                marginTop: '12px',
              }}
            />
          </div>
        </section>

        <section className="card">
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <h3 style={{ margin: 0 }}>
              รายการทั้งหมด
            </h3>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                paddingBottom: '4px',
              }}
            >
              {categories.map((category) => {
                const active =
                  activeCategory === category

                return (
                  <button
                    key={category}
                    onClick={() =>
                      setActiveCategory(
                        category
                      )
                    }
                    style={{
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '999px',
                      background: active
                        ? '#111827'
                        : '#f3f4f6',
                      color: active
                        ? '#fff'
                        : '#374151',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {category}
                  </button>
                )
              })}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>รายการ</th>
                <th>หมวด</th>
                <th>งบ</th>
                <th>จ่ายแล้ว</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {item.title}
                    </div>

                    {item.installment && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '4px',
                        }}
                      >
                        ผ่อน{' '}
                        {
                          item.installment
                            .paid
                        }
                        /
                        {
                          item.installment
                            .total
                        }{' '}
                        งวด
                      </div>
                    )}
                  </td>

                  <td>{item.category}</td>

                  <td>
                    ฿
                    {Number(
                      item.budget
                    ).toLocaleString()}
                  </td>

                  <td>
                    ฿
                    {Number(
                      item.paid
                    ).toLocaleString()}
                  </td>

                  <td>{status(item)}</td>

                  <td>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                      }}
                    >
                      <button
                        className="mobile-btn"
                        onClick={() =>
                          addPayment(item.id)
                        }
                      >
                        + ชำระ
                      </button>

                      <button
                        className="mobile-btn"
                        onClick={() =>
                          deleteItem(item.id)
                        }
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '500px',
            }}
          >
            <h2
              style={{
                marginBottom: '20px',
              }}
            >
              เพิ่มรายจ่าย
            </h2>

            <div
              style={{
                display: 'grid',
                gap: '14px',
              }}
            >
              <input
                placeholder="รายละเอียด"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title:
                      e.target.value,
                  })
                }
                style={inputStyle}
              />

              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category:
                      e.target.value,
                  })
                }
                style={inputStyle}
              >
                <option>ต่อเติม</option>
                <option>
                  Furniture
                </option>
                <option>
                  Home Appliances
                </option>
                <option>
                  Kitchenware
                </option>
              </select>

              <input
                type="number"
                placeholder="งบทั้งหมด"
                value={form.budget}
                onChange={(e) =>
                  setForm({
                    ...form,
                    budget:
                      e.target.value,
                  })
                }
                style={inputStyle}
              />

              <input
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
                style={inputStyle}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                gap: '10px',
                marginTop: '24px',
              }}
            >
              <button
                className="mobile-btn"
                onClick={() =>
                  setOpen(false)
                }
              >
                ยกเลิก
              </button>

              <button
                className="fab"
                onClick={addExpense}
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

const inputStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '14px',
  border: '1px solid #e5e7eb',
}
