import tailwindConfig from '../tailwind.config';

export default function () {
  const colors = tailwindConfig?.theme?.colors as Record<string, string | Record<string, string>> | undefined;
  return colors || {};
}
