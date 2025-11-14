import { buildFieldsParam } from '../../api/dhis2Client';

// CSV 导出直接使用 fetch 以 Accept:text/csv，避免全局 JSON 解析
export async function exportUnknownCasesCsv(params: {
  ouId: string;
  caseNoLike?: string;
  patientNameLike?: string;
  reportDateEq?: string; // YYYY-MM-DD - 新增：报告日期精确匹配
}) {
  const query: Record<string, any> = {
    program: 'PrgUnknown1',
    orgUnits: params.ouId,
    orgUnitMode: 'DESCENDANTS',
    paging: 'false',
  };
  const filters: string[] = [];
  if (params.caseNoLike) filters.push(`AtrUnkNo001:ilike:${params.caseNoLike}`);
  if (params.patientNameLike) filters.push(`AtrFullNm01:ilike:${params.patientNameLike}`);
  if (params.reportDateEq) filters.push(`AtrRptDt001:eq:${params.reportDateEq}`); // 新增：报告日期精确匹配
  filters.forEach((f) => {
    query['filter'] = (query['filter'] || []).concat(f);
  });

  const { default: cfg } = await import('../../config.json');
  const baseUrl = cfg.dhis2.baseUrl.replace(/\/+$/, '');
  const token = btoa(`${cfg.dhis2.username}:${cfg.dhis2.password}`);
  const fullUrl = new URL(`${baseUrl}/api/tracker/trackedEntities`);
  Object.entries(query).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((vv) => fullUrl.searchParams.append(k, String(vv)));
    else if (v !== undefined && v !== null && v !== '') fullUrl.searchParams.set(k, String(v));
  });

  const res = await fetch(fullUrl.toString(), {
    method: 'GET',
    headers: {
      Accept: 'text/csv',
      Authorization: `Basic ${token}`,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return await res.blob();
}