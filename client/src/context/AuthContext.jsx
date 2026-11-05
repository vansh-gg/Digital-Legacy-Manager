import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [devTools, setDevTools] = useState(false);
  const [maxUploadMb, setMaxUploadMb] = useState(4);

  useEffect(() => {
    Promise.allSettled([api('/auth/me'), api('/config')]).then(([me, cfg]) => {
      if (me.status === 'fulfilled') setUser(me.value.user);
      if (cfg.status === 'fulfilled') {
        setDevTools(cfg.value.devTools);
        setMaxUploadMb(cfg.value.maxUploadMb);
      }
      setLoading(false);
    });
    const onUnauthorized = () => setUser(null);
    window.addEventListener('dlm:unauthorized', onUnauthorized);
    return () => window.removeEventListener('dlm:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const { user } = await api('/auth/login', { method: 'POST', body: { email, password } });
    setUser(user);
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const { user } = await api('/auth/register', { method: 'POST', body: data });
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, devTools, maxUploadMb }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
