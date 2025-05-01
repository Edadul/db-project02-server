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

export const signUp = async (params) => {
  const connection = createConnection()

  const schema = ['name', 'lastName', 'id', 'birthDate', 'address', 'email', 'password']
  for (let key of schema) {
    if (!params[key]) params[key] = 'null'
  }

  const query = `CREATE (u:USER {name: $name, lastName: $lastName, id: $id, birthDate: $birthDate, address: $address, email: $email, password: $password, rol: "client"}) RETURN u`

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
    throw new Error('No found user')
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