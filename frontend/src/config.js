// config.js
// Centralized configuration for frontend services and endpoints.

export const API_BASE_URL = 'https://dollop-spirits-chowder.ngrok-free.dev';

export async function safeFetch(url, options = {}) {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}
