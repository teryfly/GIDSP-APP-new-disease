import { dhis2Client, buildFieldsParam } from '../../api/dhis2Client';
import type { MeResponse } from './types';

export async function getMe(): Promise<MeResponse> {
  const fields = buildFieldsParam(['id,username,organisationUnits[id,name,path]']);
  return dhis2Client.get<MeResponse>('/api/me', { fields });
}