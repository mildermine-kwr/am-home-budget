
import { LineChart, Line, ResponsiveContainer } from 'recharts'

const chartData = [
  { value: 10 },
  { value: 40 },
  { value: 20 },
  { value: 55 },
  { value: 30 },
  { value: 70 },
  { value: 45 }
]

const items = [
  {
    title:'งานหลังคางวดที่ 2',
    budget:'฿76,000',
    paid:'฿50,000',
    status:'partial'
  },
  {
    title:'Lucky Flame',
    budget:'฿19,190',
    paid:'฿19,190',
    status:'paid'
  }
]

export default function App(){
  return (
    <div className="layout">

      <aside className="sidebar">
        <div className="brand">🏡 AM Home</div>

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
            <p>Modern responsive redesign dashboard</p>
          </div>

          <button className="fab">+ เพิ่มรายการ</button>
        </div>

        <section className="summary">
          <div className="card">
            <label>งบทั้งหมด</label>
            <h2>฿842K</h2>
            <small>รวมค่าใช้จ่ายทั้งหมด</small>
          </div>

          <div className="card">
            <label>จ่ายแล้ว</label>
            <h2 style={{color:'#10b981'}}>฿512K</h2>
            <small>61% ของงบทั้งหมด</small>
          </div>

          <div className="card">
            <label>คงเหลือ</label>
            <h2 style={{color:'#f59e0b'}}>฿330K</h2>
            <small>ยอดค้างชำระ</small>
          </div>
        </section>

        <section className="grid">

          <div className="card">
            <h3>Budget Overview</h3>

            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3>Recent Payments</h3>

            <div className="list">

              <div className="item">
                <div>
                  <strong>Samsung Bespoke</strong>
                  <small>20 ต.ค. 2568</small>
                </div>

                <div className="green">฿13,438</div>
              </div>

              <div className="item">
                <div>
                  <strong>งานหลังคา</strong>
                  <small>18 พ.ค. 2569</small>
                </div>

                <div className="green">฿50,000</div>
              </div>

            </div>
          </div>

        </section>

        <section className="card">

          <h3>รายการทั้งหมด</h3>

          <table>
            <thead>
              <tr>
                <th>รายการ</th>
                <th>งบ</th>
                <th>จ่ายแล้ว</th>
                <th>สถานะ</th>
              </tr>
            </thead>

            <tbody>
              {items.map(item => (
                <tr key={item.title}>
                  <td>{item.title}</td>
                  <td>{item.budget}</td>
                  <td>{item.paid}</td>
                  <td>
                    <span className={`badge ${item.status}`}>
                      {item.status === 'paid' ? 'จ่ายครบ' : 'บางส่วน'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mobile-cards">
            {items.map(item => (
              <div className="mobile-item" key={item.title}>

                <div className="mobile-item-top">
                  <strong>{item.title}</strong>

                  <span className={`badge ${item.status}`}>
                    {item.status === 'paid' ? 'จ่ายครบ' : 'บางส่วน'}
                  </span>
                </div>

                <div className="mobile-grid">
                  <div>
                    <span>งบ</span>
                    <strong>{item.budget}</strong>
                  </div>

                  <div>
                    <span>จ่ายแล้ว</span>
                    <strong>{item.paid}</strong>
                  </div>
                </div>

                <button className="mobile-btn">
                  + บันทึกชำระ
                </button>

              </div>
            ))}
          </div>

        </section>

      </main>

    </div>
  )
}
