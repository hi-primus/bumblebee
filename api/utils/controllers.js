export const findById = async (Schema, id) => {
  const found = await Schema.findById(id);
  if (!found) { throw new Error('Element not found in ', Schema) }
  return found
}

export const findOrCreate = async (Schema, query={name: ''}, value=undefined) => {

  let found = await Schema.findOne(query);

  if (!found) {
    found = new Schema()
    value = value || query || {}

    for (var property in value)
      found[property] = value[property]
    found.save(function (e) {
      console.log('New created ',e)
    })
  }


  return found
}
