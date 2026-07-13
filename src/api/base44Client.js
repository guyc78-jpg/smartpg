import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Authentication is enforced by protected routes and backend RLS; login routes still need an anonymous client.
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl,
  options: {
    onError: (error) => {
      if (typeof window !== 'undefined' && (error?.status === 401 || error?.response?.status === 401)) {
        window.localStorage.removeItem('base44_access_token');
        window.localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent('base44:unauthorized'));
      }
    },
  },
});
