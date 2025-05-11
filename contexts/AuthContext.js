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

  // Helper to get role/email from localStorage
  const getRoleCache = () => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem('userRoleCache'));
    } catch {
      return null;
    }
  };

  // Helper to set role/email in localStorage
  const setRoleCache = (email, role) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userRoleCache', JSON.stringify({ email, role }));
      console.log('[AuthContext] setRoleCache:', { email, role });
    }
  };

  // Helper to clear role cache
  const clearRoleCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userRoleCache');
      console.log('[AuthContext] Cleared role cache');
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
    console.log('[AuthContext] setRole:', role);
  };

  // Helper to check admin/owner status (always check DB on login/session change)
  const checkAdminOrOwner = async (user, forceDb = false) => {
    if (!user) {
      setRole('user');
      clearRoleCache();
      console.log('[AuthContext] No user, cleared role');
      return 'user';
    }
    // Always check DB on login/session change
    if (forceDb) {
      let adminData = null;
      let error = null;
      try {
        const res = await supabase.from("admins").select("*").eq("email", user.email).single();
        adminData = res.data;
        error = res.error;
      } catch (e) {
        error = e;
      }
      console.log('[AuthContext] Supabase adminData:', adminData);
      if (error) {
        console.log('[AuthContext] Error fetching admin role from DB:', error);
      }
      // Fix: Only set admin/owner if adminData is a valid object and not an empty array
      if (adminData && !(Array.isArray(adminData) && adminData.length === 0)) {
        const adminObj = Array.isArray(adminData) ? adminData[0] : adminData;
        const role = adminObj?.is_owner ? 'owner' : 'admin';
        setRole(role);
        setRoleCache(user.email, role);
        console.log('[AuthContext] DB role:', role);
        return role;
      } else {
        setRole('user');
        setRoleCache(user.email, 'user');
        console.log('[AuthContext] DB role: user');
        return 'user';
      }
    }
    // Otherwise, use cache if valid, but only if not forceDb
    const cache = getRoleCache();
    if (cache && cache.email === user.email && (cache.role === 'admin' || cache.role === 'owner')) {
      // Double-check with DB if cache says admin/owner, to avoid stale elevation
      return await checkAdminOrOwner(user, true);
    } else if (cache && cache.email === user.email && cache.role === 'user') {
      setRole('user');
      return 'user';
    }
    // Fallback to DB if cache is missing or invalid
    return await checkAdminOrOwner(user, true);
  };

  // Refresh session and roles
  const refreshAuth = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    setSession(sessionData?.session || null);
    // Always force DB check on login/session change
    const role = await checkAdminOrOwner(sessionData?.session?.user, true);
    setLoading(false);
    console.log('[AuthContext] refreshAuth complete', {
      session: sessionData?.session,
      isAdmin,
      isOwner,
      loading: false,
      role
    });
  };

  useEffect(() => {
    console.log('[AuthContext] Initializing auth context');
    refreshAuth();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AuthContext] Auth state changed:', { _event, session });
      setSession(session);
      if (!_event || _event === 'SIGNED_OUT') {
        clearRoleCache();
        setRole('user');
        setLoading(false);
        console.log('[AuthContext] Signed out, cleared role');
      } else if (_event === 'SIGNED_IN') {
        await checkAdminOrOwner(session?.user, true);
        setLoading(false);
        console.log('[AuthContext] Listener set session/roles:', {
          session,
          isAdmin,
          isOwner,
          loading: false
        });
      } else {
        // For other events, just update session and loading
        setLoading(false);
      }
    });
    return () => {
      console.log('[AuthContext] Cleaning up auth listener');
      authListener?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    console.log('[AuthContext] State:', { session, isAdmin, isOwner, loading });
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
