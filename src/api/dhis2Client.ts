import config from '../config.json';

/**
 * Simple DHIS2 API client using basic auth from config.json
 * Only for browser usage with CORS enabled on DHIS2 side.
 * Cache disabled globally to avoid 304 and stale data.
 */

// "baseUrl": "http://192.168.120.233:8080",
// "baseUrl": "http://10.241.5.145:8089",

export interface Dhis2Pager {
  page?: number;
  pageSize?: number;
  total?: number;
  pageCount?: number;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// 根据dhis2.useUrlIs配置决定是否使用config.dhis2
// 当useUrlIs为true时，使用配置的baseUrl；为false时使用相对路径
const useUrlConfig = config.dhis2?.useUrlIs === true;
const { baseUrl, username, password } = useUrlConfig ? config.dhis2 : { 
  baseUrl: '',  // 将在请求时使用相对路径
  username: '',
  password: ''
};

const base = baseUrl.replace(/\/+$/, '');

function authHeader(): string {
  // 只有在useUrlIs模式下才使用basic auth
  if (useUrlConfig && username && password) {
    const token = btoa(`${username}:${password}`);
    return `Basic ${token}`;
  }
  return '';
}

async function rawFetch(url: string, options: RequestInit): Promise<Response> {
  // enforce no-cache headers
  const baseHeaders: HeadersInit = {
    'Accept': (options.headers as any)?.Accept || 'application/json',
    'Content-Type': (options.headers as any)?.['Content-Type'] || 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };

  // 只有在useUrlIs模式下才添加Authorization头
  if (useUrlConfig) {
    (baseHeaders as any).Authorization = authHeader();
  }

  // Remove validators to reduce 304 chance
  const finalOptions: RequestInit = {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options.headers || {}),
    },
    cache: 'no-store', // extra hint for browser
    credentials: 'include', // 添加credentials选项，类似于fetchWithAuth1
  };

  const resp = await fetch(url, finalOptions);
  if (resp.status === 304) {
    // Retry once with explicit no-cache headers (defensive, although already set)
    const retryHeaders: HeadersInit = {
      ...(finalOptions.headers as any),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };
    return fetch(url, { ...finalOptions, headers: retryHeaders });
  }
  return resp;
}

async function request<T>(path: string, method: HttpMethod = 'GET', body?: any, params?: Record<string, any>, signal?: AbortSignal): Promise<T> {
  // 在非useUrlIs模式下，使用相对路径
  const url = useUrlConfig ? new URL(`${base}${path}`) : new URL(path, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) {
        v.forEach((vv) => url.searchParams.append(k, String(vv)));
      } else {
        url.searchParams.set(k, String(v));
      }
    });
  }

  const headers: HeadersInit = {
    // auth & defaults are merged in rawFetch
  };

  const resp = await rawFetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await resp.text();
  const isJson = (resp.headers.get('content-type') || '').includes('application/json');
  const data = text && isJson ? JSON.parse(text) : (text as unknown as T);

  if (!resp.ok) {
    const msg = (data as any)?.message || resp.statusText;
    throw new Error(`DHIS2 ${method} ${url.pathname}: ${msg}`);
  }
  return data as T;
}

export const dhis2Client = {
  get: <T>(path: string, params?: Record<string, any>, signal?: AbortSignal) => request<T>(path, 'GET', undefined, params, signal),
  post: <T>(path: string, body?: any, params?: Record<string, any>, signal?: AbortSignal) => request<T>(path, 'POST', body, params, signal),
  delete: <T>(path: string, params?: Record<string, any>, signal?: AbortSignal) => request<T>(path, 'DELETE', undefined, params, signal),
};

export function buildFieldsParam(fields: string | string[]): string {
  if (Array.isArray(fields)) return fields.join(',');
  return fields;
}