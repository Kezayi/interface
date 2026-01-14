import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabaseShim as supabase } from '../lib/supabaseShim';
import { Admin } from '../lib/backoffice-types';

interface AdminAuthContextType {
  admin: Admin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  logAction: (
    actionType: string,
    entityType: string,
    entityId: string,
    actionDetails: Record<string, any>,
    justification: string
  ) => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          await loadAdminProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error checking admin session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        console.log('[AdminAuth] Auth state change:', event, session ? 'has session' : 'no session');
        if (!mounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            console.log('[AdminAuth] Loading profile from auth state change');
            await loadAdminProfile(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AdminAuth] Signing out');
          setAdmin((prev) => prev === null ? prev : null);
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadAdminProfile = async (userId: string): Promise<Admin | null> => {
    try {
      console.log('[AdminAuth] Loading admin profile for user:', userId);
      const { data, error } = await supabase.rpc('get_current_admin_profile');

      if (error) {
        console.error('[AdminAuth] RPC error:', error);
        setAdmin((prev) => prev);
        return null;
      }

      console.log('[AdminAuth] RPC response:', data);

      if (data && data.length > 0) {
        console.log('[AdminAuth] Admin profile loaded:', data[0]);
        const newAdmin = data[0];
        setAdmin((prev) => {
          if (prev?.id === newAdmin.id) {
            return prev;
          }
          return newAdmin;
        });
        await supabase
          .from('admin_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', userId);
        return newAdmin;
      } else {
        console.log('[AdminAuth] No admin profile found');
        setAdmin((prev) => prev === null ? prev : null);
        return null;
      }
    } catch (error) {
      console.error('[AdminAuth] Error loading admin profile:', error);
      setAdmin((prev) => prev);
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[AdminAuth] Signing in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[AdminAuth] signInWithPassword response:', { data, error });

      if (error) throw error;

      if (data?.user) {
        console.log('[AdminAuth] User signed in:', data.user.id);
        const adminProfile = await loadAdminProfile(data.user.id);

        if (!adminProfile) {
          await supabase.auth.signOut();
          throw new Error('Compte administrateur introuvable ou inactif');
        }

        console.log('[AdminAuth] Admin sign in successful');
      } else {
        throw new Error('Aucune donnée utilisateur retournée');
      }
    } catch (error: any) {
      console.error('[AdminAuth] Sign in error:', error);
      throw new Error(error.message || 'Échec de la connexion');
    }
  };

  const signOut = async () => {
    try {
      if (admin) {
        await logAction(
          'ADMIN_LOGOUT',
          'session',
          admin.id,
          {},
          'Déconnexion administrateur'
        );
      }

      await supabase.auth.signOut();
      setAdmin(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Échec de la déconnexion');
    }
  };

  const logAction = async (
    actionType: string,
    entityType: string,
    entityId: string,
    actionDetails: Record<string, any> = {},
    justification: string = ''
  ) => {
    if (!admin) return;

    try {
      const { error } = await supabase.rpc('log_admin_action', {
        p_admin_id: admin.id,
        p_action_type: actionType,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_action_details: actionDetails,
        p_justification: justification,
        p_ip_address: null,
      });

      if (error) {
        console.error('Error logging admin action:', error);
      }
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        signIn,
        signOut,
        logAction,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
