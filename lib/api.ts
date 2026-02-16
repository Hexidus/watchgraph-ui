import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

async function getAuthHeaders() {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString();
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return {
      'Content-Type': 'application/json'
    };
  }
}

export async function getDashboardStats() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/dashboard/stats`, { headers });
  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json();
}

export async function getAISystems() {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/systems`, { headers });
  if (!response.ok) throw new Error('Failed to fetch AI systems');
  return response.json();
}

export async function getAISystem(systemId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/systems/${systemId}`, { headers });
  if (!response.ok) throw new Error('Failed to fetch AI system');
  return response.json();
}

export async function getSystemCompliance(systemId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/systems/${systemId}/compliance`, { headers });
  if (!response.ok) throw new Error('Failed to fetch system compliance');
  return response.json();
}

export async function createAISystem(data: {
  name: string;
  description?: string;
  risk_category: string;
  organization?: string;
  department?: string;
  owner_email?: string;
}) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/systems`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create AI system');
  return response.json();
}

export async function getSystemRequirements(systemId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/systems/${systemId}/requirements`, { headers });
  if (!response.ok) throw new Error('Failed to fetch system requirements');
  return response.json();
}

export async function updateRequirementStatus(mappingId: string, data: {
  status: string;
  notes?: string;
}) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/api/requirements/${mappingId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update requirement status');
  return response.json();
}

