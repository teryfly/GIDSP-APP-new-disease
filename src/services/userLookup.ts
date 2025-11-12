import { dhis2Client } from '../api/dhis2Client';

export interface CurrentUser {
  username: string;
  surname: string;
  firstName: string;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const me = await dhis2Client.get<CurrentUser>('/api/me', { fields: 'firstName,surname,username' });
  return me;
}

export async function searchUsers(query: string): Promise<{ users: Array<{ id: string; username: string; firstName: string; surname: string; displayName: string }> }> {
  const res = await dhis2Client.get<{ users: Array<{ id: string; username: string; firstName: string; surname: string; displayName: string }> }>(
    '/api/userLookup',
    { query }
  );
  return res;
}