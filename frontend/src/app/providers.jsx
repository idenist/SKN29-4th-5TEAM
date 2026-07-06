import { AuthProvider } from '../hooks/useAuth.js';

export function AppProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
