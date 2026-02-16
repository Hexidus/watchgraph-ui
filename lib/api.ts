import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

async function getAuthHeaders() {
  try {
    const session = await fetchAuthSession();
    console.log('Auth session:', session);
    console.log('Tokens:', session.tokens);
    
    const token = session.tokens?.accessToken?.toString();
    console.log('Access token exists:', !!token);
    
    if (!token) {
      console.warn('No access token found in session');
    }
    
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
  console.log('Request headers:', headers);
  
  const response = await fetch(`${API_URL}/api/dashboard/stats`, {
    headers
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  
  return response.json();
}

export async function getAISystems() {
  const headers = await getAuthHeaders();
  console.log('Request headers:', headers);
  
  const response = await fetch(`${API_URL}/api/systems`, {
    headers
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch AI systems');
  }
  
  return response.json();
}