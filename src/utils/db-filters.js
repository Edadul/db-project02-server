export const filterByProperties = (list, filters) => {
  if (!filters || Object.keys(filters).length === 0) return list

  const fkeys = Object.keys(filters)

  return list.filter(
    item => {
      for (let key of fkeys) {
        //console.log(`key: ${key}, value: ${filters[key]}, type: ${typeof filters[key]} ---- item[key]: ${item[key]}, type: ${typeof item[key]}`)
        if (!item[key]) continue
        if (typeof item[key] === 'number'){
          //console.log(`------------- NUMBER ------------------`)
          if (item[key] !== Number(filters[key])) return false
        } else {
          //console.log(`------------- STRING ------------------`)
          if (String(item[key]).toLowerCase() !== String(filters[key]).toLowerCase()) return false
        }
      }
      //console.log(`------------- RETURNED ---------------------`)
      return true
    }
  )
}