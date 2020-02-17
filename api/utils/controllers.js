export const findById = async (Schema, id) => {
  const found = await Schema.findById(id);
  if (!found) { throw new Error('Element not found in ', Schema) }
  return found
}

export const findOneOrCreate = async (Schema, condition={name: ''}, value=undefined) => {

  let found = await Schema.findOne(condition);

  if (!found) {

    var _value = value || condition || {}

    console.log('creating')

    return await Schema.create(_value)

    return await found.save(function (e) {
      console.log('New created errors?',e)
    })
  }

  console.log('found')

  return found

}
