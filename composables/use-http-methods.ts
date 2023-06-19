export default function () {
  const runtimeConfig = useRuntimeConfig();

  async function get<T>(url: string) {
    const mlServiceUrl = runtimeConfig.public.mlServiceUrl || '';

    if (!url.startsWith('http')) {
      url = `${mlServiceUrl}${url}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const content = await response.json();
    if (typeof content === 'string') {
      try {
        return JSON.parse(content) as T;
      } catch (e) {
        return content as unknown as T;
      }
    }
    return content as T;
  }

  async function post<T>(url: string, data: Record<string, unknown>) {
    const mlServiceUrl = runtimeConfig.public.mlServiceUrl || '';

    if (!url.startsWith('http')) {
      url = `${mlServiceUrl}${url}`;
    }
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const content = await response.json();
    if (typeof content === 'string') {
      try {
        return JSON.parse(content) as T;
      } catch (e) {
        return content as unknown as T;
      }
    }
    return content as T;
  }
  return { get, post };
}
