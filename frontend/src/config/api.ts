// Global API configuration
// This can be edited to point to where the server is hosted

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default API_URL;

// Export API helper functions
export const api = {
  baseURL: API_URL,
  
  // Helper to construct full URL
  url: (endpoint: string) => {
    return `${API_URL}${endpoint}`;
  },
  
  // Helper for API calls
  request: async (endpoint: string, options?: RequestInit) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return response.json();
  },
};

