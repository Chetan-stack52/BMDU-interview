import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const blank = { name:'', email:'', role:'', department:'Engineering', status:'Active', phone:'', location:'', joinedAt:'' }

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const headers = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${token}` })
  const load = async () => {
    if (!token) return
    setLoading(true)
    const params = new URLSearchParams({ search, department, status })
    const res = await fetch(`/api/employees?${params}`, { headers: headers() })
    if (res.status === 401) return logout()
    setEmployees(await res.json()); setLoading(false)
  }
  useEffect(() => { load() }, [token, search, department, status])

  function logout() { localStorage.removeItem('token'); setToken(null); setEmployees([]) }
  function openAdd() { setForm(blank); setError(''); setModal('add') }
  function openEdit(e) { setForm({...e}); setError(''); setModal('edit') }
  async function save(e) {
    e.preventDefault(); setError('')
    const method = modal === 'edit' ? 'PUT' : 'POST'
    const url = modal === 'edit' ? `/api/employees/${form.id}` : '/api/employees'
    const res = await fetch(url, { method, headers:headers(), body:JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) return setError(data.message)
    setModal(null); load()
  }
  async function remove(e) {
    if (!confirm(`Delete ${e.name}?`)) return
    await fetch(`/api/employees/${e.id}`, { method:'DELETE', headers:headers() }); load()
  }

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.status === 'Active').length,
    departments: new Set(employees.map(e => e.department)).size
  }), [employees])

  if (!token) return <Login onLogin={(t) => setToken(t)} />

  return <div className="app">
    <aside>
      <div className="brand"><div className="logo">P</div><strong>PeopleHub</strong></div>
      <nav><button className="active">◫<span>Employees</span></button><button>▦<span>Departments</span></button><button>◷<span>Attendance</span></button><button>⚙<span>Settings</span></button></nav>
      <div className="profile"><div className="avatar">AM</div><div><b>Alex Morgan</b><small>Administrator</small></div><button onClick={logout}>↪</button></div>
    </aside>
    <main>
      <header><div><p>EMPLOYEE DIRECTORY</p><h1>Employees</h1></div><button className="add" onClick={openAdd}>＋ Add employee</button></header>
      <section className="stats">
        <div><span>Total employees</span><strong>{stats.total}</strong><small>↗ 12% from last month</small></div>
        <div><span>Active</span><strong>{stats.active}</strong><small className="green">● Working today</small></div>
        <div><span>Departments</span><strong>{stats.departments}</strong><small>Across the organization</small></div>
      </section>
      <section className="table-card">
        <div className="toolbar"><label>⌕ <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employees..." /></label>
          <select value={department} onChange={e=>setDepartment(e.target.value)}><option value="">All departments</option>{['Engineering','Design','Marketing','Sales','Human Resources','Finance'].map(x=><option key={x}>{x}</option>)}</select>
          <select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All status</option><option>Active</option><option>On Leave</option><option>Inactive</option></select>
        </div>
        <table><thead><tr><th>EMPLOYEE</th><th>ROLE</th><th>DEPARTMENT</th><th>STATUS</th><th>JOINED</th><th></th></tr></thead><tbody>
          {loading ? <tr><td colSpan="6" className="empty">Loading...</td></tr> : employees.length ? employees.map(e=><tr key={e.id}><td><div className="person"><div className="initial">{e.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div><div><b>{e.name}</b><small>{e.email}</small></div></div></td><td>{e.role}</td><td>{e.department}</td><td><span className={`status ${e.status.toLowerCase().replace(' ','-')}`}>● {e.status}</span></td><td>{e.joinedAt}</td><td className="actions"><button title="Edit" onClick={()=>openEdit(e)}>✎</button><button title="Delete" onClick={()=>remove(e)}>⌫</button></td></tr>) : <tr><td colSpan="6" className="empty">No employees found</td></tr>}
        </tbody></table>
      </section>
    </main>
    {modal && <div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&setModal(null)}><form className="modal" onSubmit={save}><div className="modal-title"><div><p>{modal === 'edit' ? 'UPDATE DETAILS' : 'NEW TEAM MEMBER'}</p><h2>{modal === 'edit' ? 'Edit employee' : 'Add employee'}</h2></div><button type="button" onClick={()=>setModal(null)}>×</button></div>{error&&<div className="error">{error}</div>}<div className="grid">
      <label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></label>
      <label>Email address<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></label>
      <label>Job role<input required value={form.role} onChange={e=>setForm({...form,role:e.target.value})} /></label>
      <label>Department<select value={form.department} onChange={e=>setForm({...form,department:e.target.value})}>{['Engineering','Design','Marketing','Sales','Human Resources','Finance'].map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></label>
      <label>Location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} /></label>
      <label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Active</option><option>On Leave</option><option>Inactive</option></select></label>
      <label>Joined date<input type="date" value={form.joinedAt} onChange={e=>setForm({...form,joinedAt:e.target.value})} /></label>
    </div><div className="modal-actions"><button type="button" onClick={()=>setModal(null)}>Cancel</button><button className="save" type="submit">{modal === 'edit'?'Save changes':'Add employee'}</button></div></form></div>}
  </div>
}

function Login({onLogin}) {
  const [form,setForm] = useState({email:'admin@peoplehub.com', password:'admin123'})
  const [error,setError] = useState('')
  async function submit(e) { e.preventDefault(); const res=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)}); const data=await res.json(); if(!res.ok)return setError(data.message); localStorage.setItem('token',data.token); onLogin(data.token) }
  return <div className="login"><div className="login-card"><div className="brand centered"><div className="logo">P</div><strong>PeopleHub</strong></div><p className="login-title">Welcome back</p><span>Sign in to manage your team</span>{error&&<div className="error">{error}</div>}<form onSubmit={submit}><label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Password<input type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></label><button type="submit">Sign in</button></form></div></div>
}

createRoot(document.getElementById('root')).render(<App />)
