import express from 'express'
import cors from 'cors'
import { getAllNodes, getNodeById, getNodeByLabel, login, signUp } from './database/requests.js'
import { filterByProperties } from './utils/db-filters.js'
import { validateUser } from './validators/validate-user.js'

const app = express()
const PORT = process.env.PORT ?? 3000
app.disable('x-powered-by') 

const ACCEPTED_ORIGINS = {
  origin: ['http://localhost:5173']
}

// ---- Middleware ----
app.use(cors(ACCEPTED_ORIGINS))
app.use(express.json())
app.use((req, res, next) => {
  //console.log('Middleware')
  next()
})

// ---- Routing ----
app.get('/hello', (req, res) => {
  res.send('hello world!')
})

app.get('/', async (req, res) => {
  const filters = req.query

  let data
  if (filters.label) {
    data = await getNodeByLabel(filters.label.toUpperCase())
    let nodes = []
    for (let i in data) {
      nodes.push(data[i].properties)
    }
  
    const fn = filterByProperties(nodes, filters)
    return res.json(fn)
  }

  data = await getAllNodes()
  const fdata = data.map(node => {
    return {
      elementId: node.elementId,
      label: node.labels[0],
      properties: node.properties
    }
  })
  return res.json(fdata)
})

app.get('/users', async (req, res) => {
  const filters = req.query
  const data = await getNodeByLabel('USER')

  let users = []
  for (let i in data) {
    users.push(data[i].properties)
  }

  const fu = filterByProperties(users, filters)
  res.json(fu)
})

// ---- conexion con cuenta de usuario ----
app.get('/users/:id', async (req, res) => {
  const { id } = req.params
  const data = await getNodeById(id)

  const user = {
    elementId: data.elementId,
    properties: data.properties
  }
  res.json(user)
})

// ---- registro de nuevo usuario ----
app.post('/users/signup', async (req, res) => {
  const properties = req.body
  const userData = validateUser(properties)
  if (userData.error) {
    return res.status(400).json(userData.error.issues[0])
  }

  try {
    const newUser = await signUp(userData.data)
    res.status(201).json({
      message: 'User registered successfully',
      properties: {
        name: userData.data.name,
        email: userData.data.email
      },
      elementId: newUser.elementId,
      url: `/users/${newUser.elementId}`
    })
  } catch (error) {
    console.log(error)
    res.status(400).send('User already exists')
  }
})

// ---- inicio de sesion ----
app.post('/users/login', async (req, res) => {
  const properties = req.body
  const user = validateUser(properties)
  if (user.error) {
    return res.status(400).json({error: user.error.issues[0]})
  }
  
  try {
    const userData = await login(user.data)
    const log = {
      elementId: userData.elementId,
      properties: userData.properties,
      url: `/users/${userData.elementId}`
    }
    return res.json(log)
  } catch (error) {
    return res.status(400).json(error.message)
  }
})

app.get('/products', async (req, res) => {
  const filters = req.query
  const data = await getNodeByLabel('PRODUCT')

  let products = []
  for (let i in data) {
    products.push(data[i].properties)
  }

  let fp = filterByProperties(products, filters)
  res.json(fp)
})

app.get('/products/:id', async (req, res) => {
  const { id } = req.params
  const data = await getNodeById(id)

  const product = {
    elementId: data.elementId,
    properties: data.properties
  }
  res.json(product)
})

app.get('/suppliers', async (req, res) => {
  const filters = req.query
  const data = await getNodeByLabel('SUPPLIER')

  let suppliers = []
  for (let i in data) {
    suppliers.push(data[i].properties)
  }

  const fs = filterByProperties(suppliers, filters)
  res.json(fs)
})

app.use((req, res) => {
  res.status(404).send('<h1>404 Page not found</h1>')
})

app.listen(PORT, ()=> {
  console.log(`app listening on port: http://localhost:${PORT}`)
})