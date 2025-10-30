import config from '../config.json';

/**
 * Simple DHIS2 API client using basic auth from config.json
 * Only for browser usage with CORS enabled on DHIS2 side.
 */

export interface Dhis2Pager {
  page?: number;
  pageSize?: number;
  total?: number;
  pageCount?: number;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const { baseUrl, username, password } = config.dhis2;

const base = baseUrl.replace(/\/+$/, '');

function authHeader(): string {
  // Basic auth header constructed at runtime
  const token = btoa(`${username}:${password}`);
  return `Basic ${token}`;
}

async function request<T>(path: string, method: HttpMethod = 'GET', body?: any, params?: Record<string, any>, signal?: AbortSignal): Promise<T> {
  const url = new URL(`${base}${path}`);

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
    'Authorization': authHeader(),
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await res.text();
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = text && isJson ? JSON.parse(text) : (text as unknown as T);

  if (!res.ok) {
    const msg = (data as any)?.message || res.statusText;
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