import { dhis2Client, buildFieldsParam } from './dhis2Client';
import type { Dhis2OptionsResponse, Dhis2Option, PageParams } from '../types/dhis2';

export type ListOptionsParams = PageParams & {
  optionSetId: string;
};

export async function listOptions(params: ListOptionsParams): Promise<Dhis2OptionsResponse> {
  const { optionSetId, page = 1, pageSize = 50, search, order = 'sortOrder:asc' } = params;
  const fields = buildFieldsParam([
    ':all',
    'attributeValues[:owner,value,attribute[id,name,displayName]]',
  ]);
  const query: Record<string, any> = {
    fields,
    paging: true,
    page,
    pageSize,
    order,
    filter: [`optionSet.id:eq:${optionSetId}`],
  };
  if (search && search.trim()) {
    query.filter.push(`identifiable:token:${encodeURIComponent(search.trim())}`);
  }
  return dhis2Client.get<Dhis2OptionsResponse>(`/api/29/options`, query);
}

export async function createOption(payload: Omit<Dhis2Option, 'id'>): Promise<any> {
  return dhis2Client.post<any>(`/api/29/options`, payload);
}

export async function updateOption(optionId: string, payload: Dhis2Option): Promise<any> {
  return dhis2Client.post<any>(`/api/29/options/${optionId}`, payload, { mergeMode: 'REPLACE' });
}

export async function deleteOptionFromSet(optionSetId: string, optionId: string): Promise<any> {
  return dhis2Client.delete<any>(`/api/29/optionSets/${optionSetId}/options/${optionId}`);
}

export async function deleteOption(optionId: string): Promise<any> {
  return dhis2Client.delete<any>(`/api/29/options/${optionId}`);
}