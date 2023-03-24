export const isObject = (
  value: unknown
): value is Record<string | number | symbol, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};
