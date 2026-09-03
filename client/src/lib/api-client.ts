import axios from 'axios';

/**
 * Pre-configured Axios instance for Helpdesk API.
 * - withCredentials: true ensures session cookies (better-auth.session_token) are sent.
 * - baseURL: '/api' leverages the Vite proxy in development and production path.
 */
export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
