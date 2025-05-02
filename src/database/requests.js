import { createConnection } from "../config/dbconfig.js";

export const getAllNodes = async () => {
  const connection = createConnection()

  const query = `MATCH (n) RETURN n`

  const res = await connection.run(query)
  
  let nodes = []
  for (let i in res.records) {
    const node = res.records[i]._fields[0]
    nodes.push(node)
  }

  await connection.close()
  return nodes
}

export const getNodeByLabel = async (label) => {
  const connection = createConnection()

  const query = `MATCH (n:${label}) RETURN n`

  const res = await connection.run(query)
  
  let nodes = []
  for (let i in res.records) {
    const node = res.records[i]._fields[0]
    nodes.push(node)
  }

  await connection.close()
  return nodes
}

export const getNodeById = async (id) => {
  const connection = createConnection()

  const query = `MATCH (u) WHERE (elementId(u) = $id) RETURN u`

  const res = await connection.run(query, { id })
  const node = res.records[0].get('u')

  await connection.close()
  return node
}

export const deleteNode = async (pk, pk_name, label) => {
  const connection = createConnection()

  const query = `MATCH (n:${label} {${pk_name}: $pk}) DELETE n`

  const res = await connection.run(query, { pk })
  await connection.close()
  return res
}

export const addProduct = async (params) => {
  const connection = createConnection()

  const query = `CREATE (n:PRODUCT {code: $code, name: $name, unitPrice: $unitPrice}) RETURN n`

  const res = await connection.run(query, params)
  await connection.close()
  return res
}

export const addSupplier = async (params) => {
  const connection = createConnection()

  const query = `CREATE (n:SUPPLIER {nit: $nit, name: $name, address: $address}) RETURN n`

  const res = await connection.run(query, params)
  await connection.close()
  return res
}

export const updateProduct = async (params) => {
  const connection = createConnection()

  const query = `MATCH (n:PRODUCT {code: $lastCode}) SET n.code = $code SET n.name = $name SET n.unitPrice = $unitPrice`

  const res = await connection.run(query, params)
  await connection.close()
  return res
}

export const updateSupplier = async (params) => {
  const connection = createConnection()

  const query = `MATCH (n:SUPPLIER {nit: $lastNit}) SET n.nit = $nit SET n.name = $name SET n.address = $address`

  const res = await connection.run(query, params)
  await connection.close()
  return res
}

export const updateUser = async (params) => {
  const connection = createConnection()

  const query = `MATCH (n:USER {email: $lastEmail}) SET n.id = $id SET n.name = $name SET n.lastName = $lastName SET n.birthDate = $birthDate SET n.address = $address SET n.email = $email SET n.password = $password`

  const res = await connection.run(query, params)
  await connection.close()
  return res
}

export const signUp = async (params) => {
  const connection = createConnection()

  const schema = ['name', 'lastName', 'id', 'birthDate', 'address', 'email', 'password']
  for (let key of schema) {
    if (!params[key]) params[key] = 'null'
  }

  const query = `CREATE (u:USER {name: $name, lastName: $lastName, id: $id, birthDate: $birthDate, address: $address, email: $email, password: $password, rol: "user"}) RETURN u`

  const res = await connection.run(query, params)
  const user = res.records[0].get('u')
  
  await connection.close()
  return user
}

export const login = async (data) => {
  const connection = createConnection()

  const query = `MATCH (u:USER {email: $email, password: $password}) RETURN u`
  const { email, password } = data

  const res = await connection.run(query, { email, password })
  await connection.close()

  if (res.records.length > 0) {
    const user = res.records[0].get('u')
    return user
  } else {
    throw new Error('Invalid email or password')
  }
}

export const purchase = async (list, userId) => {
  const connection = createConnection()

  let qp = ''
  let qq = ''
  for (let i in list) {
    const products = `MATCH (pr${i}:PRODUCT {code: '${list[i].productCode}'})`
    qp = qp + `\n` + products

    const quantities = `CREATE (p)-[:CONTAINS {quantity: ${list[i].quantity}}]->(pr${i})`
    qq = qq + '\n' + quantities
  }

  const query = `MATCH (u:USER) \nWHERE elementId(u) = '${userId}' ${qp} \nCREATE (p:PURCHASE {id: randomUUID(), date: date(), totalPrice: 0.0}) \nCREATE (u)-[r:MADE]->(p)${qq} \nWITH (p) \nMATCH (p)-[c]->(pr:PRODUCT) \nWITH p, SUM(c.quantity * pr.unitPrice) AS total \nSET p.totalPrice = total \nRETURN p.id`

  const res = await connection.run(query)
  await connection.close()

  return res.records[0]._fields[0]
}

export const consult1 = async () => {
  const connection = createConnection()

  const query = `MATCH (n:USER)-[r:MADE]-(p:PURCHASE) WITH n, COUNT(r) AS total_orders RETURN n.id as client_id, n.name as client_name, total_orders`

  const res = await connection.run(query)
  await connection.close()

  const records = await res.records

  let users = []
  for (let i in records) {
    let user = {
      clientId: records[i]._fields[0],
      clientName: records[i]._fields[1],
      totalPurchases: records[i]._fields[2].low
    }
    users.push(user)
  }

  return users
}

export const consult2 = async () => {
  const connection = createConnection()

  const query = `MATCH (n:USER) WHERE NOT EXISTS { (n)-[r:MADE]->(p:PURCHASE) } RETURN n.id as client_id, n.name as client_name`

  const res = await connection.run(query)
  await connection.close()

  const records = await res.records

  let users = []
  for (let i in records) {
    let user = {
      clientId: records[i]._fields[0],
      clientName: records[i]._fields[1],
    }

    if (!user.clientId) continue
    users.push(user)
  }

  return users
}

export const consult3 = async () => {
  const connection = createConnection()

  const query = `MATCH (u:USER)-[m:MADE]-(p:PURCHASE)-[c:CONTAINS]->(pr:PRODUCT), (pr)<-[prv:PROVIDE]-(s:SUPPLIER) RETURN u.name as client_name, pr.name as product_name, c.quantity as quantity, pr.unitPrice, pr.unitPrice * c.quantity AS subTotal, s.name as supplier_name`

  const res = await connection.run(query)
  await connection.close()

  const records = await res.records

  let users = []
  for (let i in records) {
    let user = {
      clientName: records[i]._fields[0],
      productName: records[i]._fields[1],
      quantity: records[i]._fields[2].low,
      unitPrice: records[i]._fields[3],
      subTotal: records[i]._fields[4],
      supplierName: records[i]._fields[5],
    }

    users.push(user)
  }

  return users
}

export const consult4 = async () => {
  const connection = createConnection()

  const query = `MATCH (pr)<-[prv:PROVIDE]-(s:SUPPLIER) RETURN pr.code as product_code, pr.name as product_name, s.name as supplier_name, s.nit as supplier_nit`

  const res = await connection.run(query)
  await connection.close()

  const records = await res.records

  let users = []
  for (let i in records) {
    let user = {
      productCode: records[i]._fields[0],
      productName: records[i]._fields[1],
      supplierName: records[i]._fields[2],
      supplierNit: records[i]._fields[3],
    }

    users.push(user)
  }

  return users
}

export const purchases = async () => {
  const connection = createConnection()

  const query = `MATCH (u:USER)-[r]-(p) RETURN u.id as client_id, u.name as client_name, p.id as purchase_id`

  const res = await connection.run(query)
  await connection.close()

  const records = await res.records

  let users = []
  for (let i in records) {
    let user = {
      userId: records[i]._fields[0],
      userName: records[i]._fields[1],
      purchaseId: records[i]._fields[2],
    }

    users.push(user)
  }

  return users
}

export const supplies = async () => {
  const connection = createConnection()

  const query = `MATCH (s:SUPPLIER)-[r]-(p) RETURN s.nit as supplierNit, s.name as supplierName, p.name as productName, p.code as productCode`

  const res = await connection.run(query)
  await connection.close()

  const records = await res.records

  let supplies = []
  for (let i in records) {
    let supply = {
      supplierNit: records[i]._fields[0],
      supplierName: records[i]._fields[1],
      productName: records[i]._fields[2],
      productCode: records[i]._fields[3],
    }

    supplies.push(supply)
  }

  return supplies
}