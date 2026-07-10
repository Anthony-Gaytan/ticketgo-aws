const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5226';

export const apiClient = {
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : null,
    });
  },

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : null,
    });
  },

  async patch(endpoint, body = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : null,
    });
  },

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Append JWT token if it exists in local storage
    const token = localStorage.getItem('ticketgo_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        localStorage.removeItem('ticketgo_token');
        // Optional: window.location.href = '/login' can be done in contexts, let's just throw or clear token.
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // If No Content (204) or empty response body
      if (response.status === 204) return null;
      
      return await response.json().catch(() => null);
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }
};
