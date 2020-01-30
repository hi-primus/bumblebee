export const findById = async (Schema, id) => {
  const found = await Schema.findById(id);
  if (!found) { throw new Error('Element not found in ', Schema) }
  return found
}
