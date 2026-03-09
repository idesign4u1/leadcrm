import { api } from './api';
import type { Lead, LeadRow } from '@leadcrm/types';

interface LeadsResponse {
  headers: string[];
  leads: Lead[];
}

interface LeadResponse {
  rowIndex: number;
  headers: string[];
  fields: LeadRow;
}

export async function fetchLeads(companyId: string): Promise<LeadsResponse> {
  return api.get<LeadsResponse>(`/api/sheets/${companyId}/leads`);
}

export async function fetchLead(companyId: string, rowIndex: number): Promise<LeadResponse> {
  return api.get<LeadResponse>(`/api/sheets/${companyId}/leads/${rowIndex}`);
}

export async function updateLead(
  companyId: string,
  rowIndex: number,
  fields: Partial<LeadRow>
): Promise<void> {
  await api.patch(`/api/sheets/${companyId}/leads/${rowIndex}`, { fields });
}

export async function createLead(companyId: string, fields: LeadRow): Promise<void> {
  await api.post(`/api/sheets/${companyId}/leads`, { fields });
}

export async function fetchHeaders(companyId: string): Promise<string[]> {
  const res = await api.get<{ headers: string[] }>(`/api/sheets/${companyId}/headers`);
  return res.headers;
}
