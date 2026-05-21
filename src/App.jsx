import { useEffect, useMemo, useState } from 'react'
import {
LineChart,
Line,
ResponsiveContainer,
} from 'recharts'

import { TORT, FURN } from './data/items'

const initialItems = [...TORT, ...FURN].map(
(item) => ({
id: item.id,
title: item.note || item.title || '-',
category: item.cat || '-',
budget: Number(item.total || 0),
paid: Number(item.paid || 0),
date: item.date || '',
installment: item.installment || null,
})
)

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
const [activeTab, setActiveTab] =
useState('all')

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
(sum, item) =>
sum + Number(item.budget),
0
)

const paid = items.reduce(
  (sum, item) =>
    sum + Number(item.paid),
  0
)

return {
  total,
  paid,
  remain: total - paid,
}

}, [items])

const filteredItems = items.filter(
(item) => {
const matchSearch =
item.title
.toLowerCase()
.includes(
search.toLowerCase()
) ||
item.category
.toLowerCase()
.includes(
search.toLowerCase()
)

  if (activeTab === 'all') {
    return matchSearch
  }

  if (activeTab === 'ต่อเติม') {
    return (
      matchSearch &&
      ['ต่อเติม', 'TORT'].includes(
        item.category
      )
    )
  }

  if (activeTab === 'ของตกแต่ง') {
    return (
      matchSearch &&
      [
        'Furniture',
        'Home Appliances',
        'Kitchenware',
        'FURN',
      ].includes(item.category)
    )
  }

  return matchSearch
}

)

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
setItems(
items.filter(
(item) => item.id !== id
)
)
}

const addPayment = (id) => {
const amount = prompt(
'เพิ่มยอดชำระ'
)

if (!amount) return

setItems(
  items.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        paid: Math.min(
          item.paid +
            Number(amount),
          item.budget
        ),
      }
    }

    return item
  })
)

}

const getStatus = (item) => {
if (item.paid <= 0)
return 'ยังไม่จ่าย'

if (
  item.paid >= item.budget
)
  return 'จ่ายครบ'

return 'บางส่วน'

}

return (



🏡 AM Home



    <div className="nav">
      <button
        className={
          activeTab === 'all'
            ? 'active'
            : ''
        }
        onClick={() =>
          setActiveTab('all')
        }
      >
        Dashboard
      </button>

      <button
        className={
          activeTab === 'ต่อเติม'
            ? 'active'
            : ''
        }
        onClick={() =>
          setActiveTab('ต่อเติม')
        }
      >
        ต่อเติม
      </button>

      <button
        className={
          activeTab ===
          'ของตกแต่ง'
            ? 'active'
            : ''
        }
        onClick={() =>
          setActiveTab(
            'ของตกแต่ง'
          )
        }
      >
        ของตกแต่ง
      </button>
    </div>
  </aside>

  <main className="main">
    <div className="topbar">
      <div>
        <h1>
          AM Home Budget
        </h1>

        <p>
          {
            filteredItems.length
          }{' '}
          รายการ
        </p>
      </div>

      <button
        className="fab"
        onClick={() =>
          setOpen(true)
        }
      >
        + เพิ่มรายการ
      </button>
    </div>

    <section className="summary">
      <div className="card">
        <label>
          งบทั้งหมด
        </label>

        <h2>
          ฿
          {totals.total.toLocaleString()}
        </h2>
      </div>

      <div className="card">
        <label>
          จ่ายแล้ว
        </label>

        <h2
          style={{
            color:
              '#10b981',
          }}
        >
          ฿
          {totals.paid.toLocaleString()}
        </h2>
      </div>

      <div className="card">
        <label>
          คงเหลือ
        </label>

        <h2
          style={{
            color:
              '#f59e0b',
          }}
        >
          ฿
          {totals.remain.toLocaleString()}
        </h2>
      </div>
    </section>

    <section className="grid">
      <div className="card">
        <h3>
          Budget Overview
        </h3>

        <div className="chart">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={chartData}
            >
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
        <h3>
          Quick Search
        </h3>

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="ค้นหา..."
          style={inputStyle}
        />
      </div>
    </section>

    <section className="card">
      <h3>
        รายการทั้งหมด
      </h3>

      <table>
        <thead>
          <tr>
            <th>
              รายการ
            </th>
            <th>
              หมวด
            </th>
            <th>งบ</th>
            <th>
              จ่ายแล้ว
            </th>
            <th>
              สถานะ
            </th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {filteredItems.map(
            (item) => (
              <tr
                key={item.id}
              >
                <td>
                  {
                    item.title
                  }
                </td>

                <td>
                  {
                    item.category
                  }
                </td>

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

                <td>
                  {getStatus(
                    item
                  )}
                </td>

                <td>
                  <div
                    style={{
                      display:
                        'flex',
                      gap: '8px',
                    }}
                  >
                    <button
                      className="mobile-btn"
                      onClick={() =>
                        addPayment(
                          item.id
                        )
                      }
                    >
                      + ชำระ
                    </button>

                    <button
                      className="mobile-btn"
                      onClick={() =>
                        deleteItem(
                          item.id
                        )
                      }
                    >
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </section>
  </main>

  {open && (
    <div className="modal">
      <div className="modal-card">
        <h2>
          เพิ่มรายจ่าย
        </h2>

        <div className="form-grid">
          <input
            placeholder="รายละเอียด"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title:
                  e.target
                    .value,
              })
            }
            style={inputStyle}
          />

          <select
            value={
              form.category
            }
            onChange={(e) =>
              setForm({
                ...form,
                category:
                  e.target
                    .value,
              })
            }
            style={inputStyle}
          >
            <option>
              ต่อเติม
            </option>

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
                  e.target
                    .value,
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
                  e.target
                    .value,
              })
            }
            style={inputStyle}
          />
        </div>

        <div className="modal-actions">
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
marginTop: '12px',
}
