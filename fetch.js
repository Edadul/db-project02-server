// const res = await fetch('http://localhost:3000/users', {
//   method: 'GET'
// })

// const data = await res.json()
// console.log(data)

async function obtenerClientes() {
  try {
    const respuesta = await fetch('http://localhost:3000/');
    
    if (!respuesta.ok) {
      throw new Error('Failed to fetch');
    }
    
    const clientes = await respuesta.json();
    return clientes;
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return [];
  }
}

const clients = await obtenerClientes()
const fclients = clients.map(user => {
  return {
    name: user.name,
    rol: user.rol
  }
})

console.log(clients)