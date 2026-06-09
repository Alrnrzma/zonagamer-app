// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";

// cache local (recomendado)
import {
  setCurrentUser,
  getCurrentUser,
  logout as localLogout,
  ensureDemoUsers,
} from "../services/auth.local";

// Tu tipo local
import { User } from "../types";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;

  // ✅ para que Login/Register actualicen el contexto inmediatamente
  signIn: (user: User) => Promise<void>;

  // ✅ cierra sesión Firebase + local
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Fuente de verdad: Firebase Auth
  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        // Crea usuarios demo locales si no existen
        await ensureDemoUsers();

        // Carga la sesión guardada localmente
        const localUser = await getCurrentUser();

        if (mounted) {
          setUser(localUser);
          setIsLoading(false);
        }
      } catch (e) {
        console.log("Error cargando sesión local:", e);

        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Útil cuando Login/Register ya obtuvieron el usuario y quieres evitar “parpadeos”
  const signIn = async (newUser: User) => {
    setUser(newUser);
    await setCurrentUser(newUser);
  };

  const signOut = async () => {
    await localLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
