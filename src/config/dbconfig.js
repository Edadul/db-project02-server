import neo4j from 'neo4j-driver'

const url = 'neo4j+s://3784d8fb.databases.neo4j.io'
const user = 'neo4j'
const password = '610wZ9870oRe9FXqwFagZDJcDKnxTHKibzdugIulGAg'

const driver = neo4j.driver(url, neo4j.auth.basic(user, password))

export const createConnection = () => {
  return driver.session({ database: 'neo4j' })
}

//export const ALLOWED_LABELS = ['PRODUCT']