// Global API configuration
// This can be edited to point to where the server is hosted
// For production, update REACT_APP_API_URL in .env file

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5001';

export default API_URL;
export { WS_URL };

// Export API helper functions
export const api = {
  baseURL: API_URL,
  wsURL: WS_URL,
  
  // Helper to construct full URL
  url: (endpoint: string): string => {
    return `${API_URL}${endpoint}`;
  },
  
  // Helper for API calls with authentication
  request: async (endpoint: string, options?: RequestInit): Promise<any> => {
    const token = localStorage.getItem('token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `API request failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  // GET request
  get: async (endpoint: string): Promise<any> => {
    return api.request(endpoint, { method: 'GET' });
  },

  // POST request
  post: async (endpoint: string, data: any): Promise<any> => {
    return api.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT request
  put: async (endpoint: string, data: any): Promise<any> => {
    return api.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE request
  delete: async (endpoint: string): Promise<any> => {
    return api.request(endpoint, { method: 'DELETE' });
  },
};

