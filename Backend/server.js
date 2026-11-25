require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'peoplehub-local-secret'
const DATA_FILE = path.join(__dirname, 'data', 'employees.json')

app.use(cors())
app.use(express.json())

const readEmployees = () => {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]')
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
}
const writeEmployees = (employees) => fs.writeFileSync(DATA_FILE, JSON.stringify(employees, null, 2))

app.post('/api/login', (req, res) => {
  const { email, password } = req.body
  if (email === 'admin@peoplehub.com' && password === 'admin123') {
    const token = jwt.sign({ email, role: 'Admin' }, JWT_SECRET, { expiresIn: '8h' })
    return res.json({ token, user: { name: 'Alex Morgan', email, role: 'Admin' } })
  }
  res.status(401).json({ message: 'Invalid email or password' })
})

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Authentication required' })
  try { req.user = jwt.verify(token, JWT_SECRET); next() }
  catch { res.status(401).json({ message: 'Invalid or expired token' }) }
}

app.get('/api/employees', authenticate, (req, res) => {
  const { search = '', department = '', status = '' } = req.query
  let employees = readEmployees()
  if (search) {
    const needle = search.toLowerCase()
    employees = employees.filter(e => [e.name, e.email, e.role].some(v => v?.toLowerCase().includes(needle)))
  }
  if (department) employees = employees.filter(e => e.department === department)
  if (status) employees = employees.filter(e => e.status === status)
  res.json(employees)
})

app.get('/api/employees/:id', authenticate, (req, res) => {
  const employee = readEmployees().find(e => e.id === req.params.id)
  employee ? res.json(employee) : res.status(404).json({ message: 'Employee not found' })
})

app.post('/api/employees', authenticate, (req, res) => {
  const employees = readEmployees()
  const { name, email, role, department, status = 'Active', phone = '', location = '', joinedAt } = req.body
  if (!name?.trim() || !email?.trim() || !role?.trim() || !department?.trim()) {
    return res.status(400).json({ message: 'Name, email, role, and department are required' })
  }
  if (employees.some(e => e.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: 'An employee with this email already exists' })
  }
  const employee = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name: name.trim(), email: email.trim(),
    role: role.trim(), department, status, phone: phone.trim(), location: location.trim(),
    joinedAt: joinedAt || new Date().toISOString().slice(0, 10)
  }
  employees.unshift(employee)
  writeEmployees(employees)
  res.status(201).json(employee)
})

app.put('/api/employees/:id', authenticate, (req, res) => {
  const employees = readEmployees()
  const index = employees.findIndex(e => e.id === req.params.id)
  if (index === -1) return res.status(404).json({ message: 'Employee not found' })
  if (req.body.email && employees.some(e => e.id !== req.params.id && e.email.toLowerCase() === req.body.email.toLowerCase())) {
    return res.status(409).json({ message: 'An employee with this email already exists' })
  }
  employees[index] = { ...employees[index], ...req.body, id: employees[index].id }
  writeEmployees(employees)
  res.json(employees[index])
})

app.delete('/api/employees/:id', authenticate, (req, res) => {
  const employees = readEmployees()
  const index = employees.findIndex(e => e.id === req.params.id)
  if (index === -1) return res.status(404).json({ message: 'Employee not found' })
  const [deleted] = employees.splice(index, 1)
  writeEmployees(employees)
  res.json(deleted)
})

app.listen(PORT, () => console.log(`PeopleHub API running at http://localhost:${PORT}`))
