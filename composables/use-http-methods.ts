interface HttpMethodOptions {
  getJson?: boolean;
  throwError?: boolean;
}

const defaultOptions: HttpMethodOptions = { getJson: true, throwError: false };

function checkError(content: unknown) {
  if (
    isObject(content) &&
    'detail' in content &&
    typeof content.detail === 'string'
  ) {
    throw new Error(content.detail);
  }
}

export default function () {
  const runtimeConfig = useRuntimeConfig();

  async function get<T>(url: string, options: HttpMethodOptions = {}) {
    const { getJson, throwError } = Object.assign({}, defaultOptions, options);

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
    if (getJson) {
      const content = await response.json();
      if (typeof content === 'string') {
        try {
          return JSON.parse(content) as T;
        } catch (e) {
          return content as unknown as T;
        }
      }
      if (throwError) {
        checkError(content);
      }
      return content as T;
    } else {
      if (throwError) {
        checkError(response);
      }
      return response as T;
    }
  }

  async function post<T>(
    url: string,
    data: Record<string, unknown>,
    options: HttpMethodOptions = {}
  ) {
    const { getJson, throwError } = Object.assign({}, defaultOptions, options);

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

    if (getJson) {
      const content = await response.json();
      if (typeof content === 'string') {
        try {
          return JSON.parse(content) as T;
        } catch (e) {
          return content as unknown as T;
        }
      }
      if (throwError) {
        checkError(content);
      }
      return content as T;
    } else {
      if (throwError) {
        checkError(response);
      }
      return response as T;
    }
  }
  return { get, post };
}
