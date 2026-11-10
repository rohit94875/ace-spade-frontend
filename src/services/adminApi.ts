import axios from 'axios';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const api = axios.create({ baseURL: `${base}/api` });

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  admin: boolean;
  blocked: boolean;
  createdAt: string;
}

export interface RegistrationCodeResponse {
  code: string;
}

function authHeaders(accessToken: string) {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

export const getRegistrationCode = (accessToken: string): Promise<RegistrationCodeResponse> =>
  api.get('/admin/registration-code', authHeaders(accessToken)).then((r) => r.data);

export const listAdminUsers = (accessToken: string): Promise<AdminUser[]> =>
  api.get('/admin/users', authHeaders(accessToken)).then((r) => r.data);

export const blockUser = (accessToken: string, userId: number): Promise<AdminUser> =>
  api.post(`/admin/users/${userId}/block`, null, authHeaders(accessToken)).then((r) => r.data);

export const unblockUser = (accessToken: string, userId: number): Promise<AdminUser> =>
  api.post(`/admin/users/${userId}/unblock`, null, authHeaders(accessToken)).then((r) => r.data);
