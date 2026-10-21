import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { authConfigured, supabase } from "./supabase";

interface AuthState {
  configured: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  /** Envia o link de entrada por e-mail. Lança erro com mensagem legível se falhar. */
  signInEmail(email: string): Promise<void>;
  signInGoogle(): Promise<void>;
  signOut(): Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(authConfigured);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      configured: authConfigured,
      loading,
      user: session?.user ?? null,
      session,
      async signInEmail(email) {
        if (!supabase) throw new Error("Contas não configuradas.");
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
        if (error) throw new Error(error.message);
      },
      async signInGoogle() {
        if (!supabase) throw new Error("Contas não configuradas.");
        const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
        if (error) throw new Error(error.message);
      },
      async signOut() {
        await supabase?.auth.signOut();
      },
    }),
    [session, loading],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth fora do provider");
  return v;
}
