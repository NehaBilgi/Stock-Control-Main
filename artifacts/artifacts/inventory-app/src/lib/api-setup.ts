import { useEffect } from 'react';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';
import { useAuth } from './auth';

// Use standard API URL setup.
const API_URL = import.meta.env.VITE_API_URL || '';

export function initializeApi() {
  setBaseUrl(API_URL);
  setAuthTokenGetter(() => {
    return localStorage.getItem('inventory_token');
  });
}
