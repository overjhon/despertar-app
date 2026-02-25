import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, redirectTo?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, whatsapp?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event);

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Log token refresh for monitoring
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Auth token refreshed successfully');
        }

        // Handle token refresh errors - clear corrupted data
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.error('⚠️ Token refresh failed - clearing auth data');
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
          toast({
            title: "Sessão expirada",
            description: "Por favor, faça login novamente.",
            variant: "destructive",
          });
        }

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          localStorage.clear();
          setSession(null);
          setUser(null);
        }
      }
    );

    // THEN check for existing session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('❌ Error getting session:', error);
          // Clear potentially corrupted auth data
          localStorage.removeItem('supabase.auth.token');
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Critical error getting session:', err);
        localStorage.removeItem('supabase.auth.token');
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      // Check for pending purchases
      try {
        const { data } = await supabase.functions.invoke('claim-purchases');
        if (data?.claimed_count > 0) {
          toast({
            title: "🎉 Compras Resgatadas!",
            description: `${data.claimed_count} ebook(s) adicionado(s) à sua biblioteca`,
            duration: 4000,
          });
        }
      } catch (err) {
        console.error('Error claiming purchases:', err);
      }

      toast({
        title: "Bem-vindo de volta!",
        description: "Login realizado com sucesso.",
      });
      navigate(redirectTo || '/library');
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, whatsapp?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });

    if (!error && signUpData?.user && whatsapp) {
      // Salvar WhatsApp no perfil
      await supabase
        .from('profiles')
        .update({ whatsapp })
        .eq('id', signUpData.user.id);
    }

    if (!error) {
      // Check for pending purchases
      try {
        const { data } = await supabase.functions.invoke('claim-purchases');
        if (data?.claimed_count > 0) {
          toast({
            title: "🎉 Compras Resgatadas!",
            description: `${data.claimed_count} ebook(s) adicionado(s) à sua biblioteca`,
            duration: 4000,
          });
        }
      } catch (err) {
        console.error('Error claiming purchases:', err);
      }

      toast({
        title: "Conta criada!",
        description: "Bem-vindo à plataforma de ebooks.",
      });

      // Redireciona para a biblioteca após cadastro bem-sucedido
      navigate('/library');
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    toast({
      title: "Até logo!",
      description: "Você saiu da sua conta.",
    });
    navigate('/login');
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};