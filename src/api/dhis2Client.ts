import config from '../config.json';

/**
 * Simple DHIS2 API client using basic auth from config.json
 * Auto-detects if running inside DHIS2 app environment
 */

export interface Dhis2Pager {
  page?: number;
  pageSize?: number;
  total?: number;
  pageCount?: number;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// 检测是否在DHIS2应用环境中运行
const isDhis2AppEnvironment = (): boolean => {
  const path = window.location.pathname;
  return path.includes('/api/apps/') || path.includes('/dhis-web-apps/');
};

// 根据环境决定配置
const inDhis2 = isDhis2AppEnvironment();
const useUrlConfig = !inDhis2 && config.dhis2?.useUrlIs === true;

const { baseUrl, username, password } = useUrlConfig ? config.dhis2 : { 
  baseUrl: inDhis2 ? '../..' : '',  // DHIS2环境中使用相对路径
  username: '',
  password: ''
};

const base = baseUrl.replace(/\/+$/, '');

function authHeader(): string {
  // 只有在useUrlIs模式下才使用basic auth
  // DHIS2环境会自动使用session认证
  if (useUrlConfig && username && password) {
    const token = btoa(`${username}:${password}`);
    return `Basic ${token}`;
  }
  return '';
}

async function rawFetch(url: string, options: RequestInit): Promise<Response> {
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

  const finalOptions: RequestInit = {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options.headers || {}),
    },
    cache: 'no-store',
    credentials: 'include', // 重要：使用DHIS2的session认证
  };

  const resp = await fetch(url, finalOptions);
  if (resp.status === 304) {
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
  // 构建完整的API路径
  let fullPath = path;
  if (inDhis2) {
    // 在DHIS2环境中，确保API路径正确
    fullPath = path.startsWith('/api') ? path : `/api${path}`;
  }
  
  const url = useUrlConfig ? new URL(`${base}${fullPath}`) : new URL(fullPath, window.location.origin);

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

  const headers: HeadersInit = {};

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
  put: <T>(path: string, body?: any, params?: Record<string, any>, signal?: AbortSignal) => request<T>(path, 'PUT', body, params, signal),
  delete: <T>(path: string, params?: Record<string, any>, signal?: AbortSignal) => request<T>(path, 'DELETE', undefined, params, signal),
};

export function buildFieldsParam(fields: string | string[]): string {
  if (Array.isArray(fields)) return fields.join(',');
  return fields;
}