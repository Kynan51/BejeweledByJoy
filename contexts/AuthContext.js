"use client"
import { createContext, useContext, useEffect, useState } from "react";
import supabase from "../utils/supabaseClient";

const AuthContext = createContext({
  session: null,
  isAdmin: false,
  isOwner: false,
  loading: true,
  refreshAuth: () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to get role/email from localStorage (with timestamp)
  const getRoleCache = () => {
    if (typeof window === 'undefined') return null;
    try {
      const cache = JSON.parse(localStorage.getItem('userRoleCache'));
      if (!cache) return null;
      // Check if cache is expired (older than 1 hour)
      if (!cache.timestamp || (Date.now() - cache.timestamp > 3600 * 1000)) {
        return null;
      }
      return cache;
    } catch {
      return null;
    }
  };

  // Helper to set role/email in localStorage (with timestamp)
  const setRoleCache = (email, role) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRoleCache', JSON.stringify({ email, role, timestamp: Date.now() }));
      // console.log('[AuthContext] setRoleCache:', { email, role });
    }
  };

  // Helper to clear role cache
  const clearRoleCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userRoleCache');
      // console.log('[AuthContext] Cleared role cache');
    }
  };

  // Helper to set role in state
  const setRole = (role) => {
    if (role === 'admin') {
      setIsAdmin(true);
      setIsOwner(false);
    } else if (role === 'owner') {
      setIsAdmin(true);
      setIsOwner(true);
    } else {
      setIsAdmin(false);
      setIsOwner(false);
    }
    // console.log('[AuthContext] setRole:', role);
  };

  // Helper to check admin/owner status (use cache if valid, else DB)
  const checkAdminOrOwner = async (user, forceDb = false) => {
    if (!user) {
      setRole('user');
      clearRoleCache();
      // console.log('[AuthContext] No user, cleared role');
      return 'user';
    }
    // Use cache if not forceDb and cache is valid
    const cache = getRoleCache();
    if (!forceDb && cache && cache.email === user.email && ['admin','owner','user'].includes(cache.role)) {
      setRole(cache.role);
      // console.log('[AuthContext] Used cached role:', cache.role);
      return cache.role;
    }
    // Otherwise, check DB
    let adminData = null;
    let error = null;
    try {
      const res = await supabase.from("admins").select("*").eq("email", user.email).single();
      adminData = res.data;
      error = res.error;
    } catch (e) {
      error = e;
    }
    // console.log('[AuthContext] Supabase adminData:', adminData);
    if (error) {
      // console.log('[AuthContext] Error fetching admin role from DB:', error);
    }
    if (adminData && !(Array.isArray(adminData) && adminData.length === 0)) {
      const adminObj = Array.isArray(adminData) ? adminData[0] : adminData;
      const role = adminObj?.is_owner ? 'owner' : 'admin';
      setRole(role);
      setRoleCache(user.email, role);
      // console.log('[AuthContext] DB role:', role);
      return role;
    } else {
      setRole('user');
      setRoleCache(user.email, 'user');
      // console.log('[AuthContext] DB role: user');
      return 'user';
    }
  };

  // Refresh session and roles
  const refreshAuth = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    setSession(sessionData?.session || null);
    // Always force DB check on login/session change
    const role = await checkAdminOrOwner(sessionData?.session?.user, true);
    setLoading(false);
    // console.log('[AuthContext] refreshAuth complete', {
    //   session: sessionData?.session,
    //   isAdmin,
    //   isOwner,
    //   loading: false,
    //   role
    // });
  };

  useEffect(() => {
    // console.log('[AuthContext] Initializing auth context');
    refreshAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // console.log('[AuthContext] Auth state changed:', { _event, session });
      setSession(session);
      if (!_event || _event === 'SIGNED_OUT') {
        clearRoleCache();
        setRole('user');
        setLoading(false);
        // console.log('[AuthContext] Signed out, cleared role');
      } else if (_event === 'SIGNED_IN') {
        await checkAdminOrOwner(session?.user, false); // Use cache on login
        setLoading(false);
        // console.log('[AuthContext] Listener set session/roles:', {
        //   session,
        //   isAdmin,
        //   isOwner,
        //   loading: false
        // });
      } else {
        setLoading(false);
      }
    });
    return () => {
      // console.log('[AuthContext] Cleaning up auth listener');
      authListener?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // console.log('[AuthContext] State:', { session, isAdmin, isOwner, loading });
  }, [session, isAdmin, isOwner, loading]);

  return (
    <AuthContext.Provider value={{ session, isAdmin, isOwner, loading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
