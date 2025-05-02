import express from 'express'
import cors from 'cors'
import { getAllNodes, getNodeById, getNodeByLabel, deleteNode, login, purchase, signUp, addProduct, updateProduct, updateUser, addSupplier, updateSupplier, consult1, consult2, consult3, consult4, purchases, supplies } from './database/requests.js'
import { filterByProperties } from './utils/db-filters.js'
import { validateUser } from './validators/validate-user.js'

const app = express()
const PORT = process.env.PORT ?? 3000
app.disable('x-powered-by')

const allowedOrigins = [
  'http://localhost:5173', 
  'https://simplex-phpd.onrender.com'
]

// ---- Middleware ----
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not accepted by CORS'))
    }
  }
}))
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
    if (data[i].properties.rol === 'admin') continue
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
      url: `/${newUser.properties.rol}/${newUser.elementId}`
    })
  } catch (error) {
    console.log(error)
    res.status(400).json({message: 'User already exists'})
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
      url: `/${userData.properties.rol}/${userData.elementId}`
    }
    return res.json(log)
  } catch (error) {
    return res.status(400).json({message: error.message})
  }
})

app.post('/users/purchase', async (req, res) => {
  const { products, userId } = req.body

  try {
    const data = await purchase(products, userId)
    return res.json({data})
  } catch (error) {
    return res.status(500).json({message: 'Something went wrong'})
  }
})

app.get('/users/delete/:email', async (req, res) => {
  const {email} = req.params

  try {
    const data = await deleteNode(email, 'email', 'USER')
    return res.json(data)
  } catch (error) {
    if (error.message.includes('it still has relationships')) {
      return res.status(400).json('This node still has relationships')
    }
    return res.status(500).json(error.message)
  }
})

app.post('/users/update', async (req, res) => {
  const params = req.body

  try {
    const data = await updateUser(params)
    return res.json(data)
  } catch (error) {
    if (error.message.includes('already exists')) return res.status(400).json({message: 'There is another user with this email'})
    return res.status(500).json(error.message)
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

app.post('/products/add/', async (req, res) => {
  const params = req.body

  try {
    const data = await addProduct(params)
    return res.json(data)
  } catch (error) {
    if (error.message.includes('already exists')){
      return res.status(400).json({message: 'Product with this code already exists'})
    }
    return res.status(500).json(error.message)
  }
})

app.post('/suppliers/add', async (req, res) => {
  const params = req.body

  try {
    const data = await addSupplier(params)
    return res.json(data)
  } catch (error) {
    if (error.message.includes('already exists')){
      return res.status(400).json({message: 'Supplier with this nit already exists'})
    }
    return res.status(500).json(error.message)
  }
})

app.get('/suppliers/delete/:nit', async (req, res) => {
  const { nit } = req.params

  try {
    const data = await deleteNode(nit, 'nit', 'SUPPLIER')
    return res.json(data)
  } catch (error) {
    if (error.message.includes('it still has relationships')) {
      return res.status(400).json('This node still has relationships')
    }
    return res.status(500).json(error.message)
  }
})

app.get('/products/delete/:code', async (req, res) => {
  const { code } = req.params

  try {
    const data = await deleteNode(code, 'code', 'PRODUCT')
    return res.json(data)
  } catch (error) {
    if (error.message.includes('it still has relationships')) {
      return res.status(400).json('This node still has relationships')
    }
    return res.status(500).json(error.message)
  }
})

app.post('/products/update', async (req, res) => {
  const params = req.body

  try {
    const data = await updateProduct(params)
    return res.json(data)
  } catch (error) {
    if (error.message.includes('already exists')) return res.status(400).json({message: 'There is another product with this code'})
    return res.status(500).json(error.message)
  }
})

app.post('/suppliers/update', async (req, res) => {
  const params = req.body

  try {
    const data = await updateSupplier(params)
    return res.json(data)
  } catch (error) {
    if (error.message.includes('already exists')) return res.status(400).json({message: 'There is another supplier with this code'})
    return res.status(500).json(error.message)
  }
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

app.get('/purchases', async (req, res) => {
  const data = await purchases()

  res.json(data)
})

app.get('/supplies', async (req, res) => {
  const data = await supplies()

  res.json(data)
})

app.get('/consult1', async (req, res) => {
  const data = await consult1()

  res.json(data)
})

app.get('/consult2', async (req, res) => {
  const data = await consult2()

  res.json(data)
})

app.get('/consult3', async (req, res) => {
  const data = await consult3()

  res.json(data)
})

app.get('/consult4', async (req, res) => {
  const data = await consult4()

  res.json(data)
})

app.use((req, res) => {
  res.status(404).send('<h1>404 Page not found</h1>')
})

app.listen(PORT, ()=> {
  console.log(`app listening on port: http://localhost:${PORT}`)
})
