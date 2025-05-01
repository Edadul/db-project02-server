const req = {
  list: [
  {productCode: 'P002', quantity: 3},
  {productCode: 'P004', quantity: 1}
  ],
  elementId: '4:469e1d14-453a-4acb-848e-f2ea9587efaa:15'
}

let qp = ''
let qq = ''
for (let i in req.list) {
  const products = `MATCH (pr${i}:PRODUCT {code: '${req.list[i].productCode}'})`
  qp = qp + `\n` + products

  const quantities = `CREATE (p)-[:CONTAINS {quantity: ${req.list[i].quantity}}]->(pr${i})`
  qq = qq + '\n' + quantities
}

const query = `MATCH (u:USER) \nWHERE elementId(u) = '${req.elementId}' ${qp} \nCREATE (p:PURCHASE {id: randomUUID(), date: date(), totalPrice: 0.0}) \nCREATE (u)-[r:MADE]->(p)${qq} \nWITH (p) \nMATCH (p)-[c]->(pr:PRODUCT) \nWITH p, SUM(c.quantity * pr.unitPrice) AS total \nSET p.totalPrice = total`

console.log(query)