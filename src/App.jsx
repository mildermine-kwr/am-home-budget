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

const inputStyle = {
width: '100%',
padding: '14px',
borderRadius: '14px',
border: '1px solid #e5e7eb',
marginTop: '12px',
}

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
<div className="layout">
<aside className="sidebar">
<div className="brand">
🏡 AM Home
</div>

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
  </main>
</div>

)
}
