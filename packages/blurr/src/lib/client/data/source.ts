import { generateUniqueVariableName } from '../../utils';

export function Source(name?: string, client?: Client) {
  if (!client) {
    return new Error('Source can only be initialized using a client');
  }
  if (!name) {
    name = generateUniqueVariableName('source');
  }
  return { name, client };
}
