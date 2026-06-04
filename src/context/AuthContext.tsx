// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../services/firebase";

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
        // ✅ Crea usuarios demo locales si no existen
        await ensureDemoUsers();

        // ✅ Primero intenta cargar sesión local
        const localUser = await getCurrentUser();

        if (localUser && mounted) {
          setUser(localUser);
        }

        // ✅ Luego escucha Firebase si hay sesión online
        const unsub = onAuthStateChanged(auth, async (fbUser) => {
          try {
            if (!fbUser) {
              // Si ya hay usuario local, NO lo borramos.
              // Esto permite abrir la app sin internet.
              if (!localUser && mounted) {
                setUser(null);
              }
              return;
            }

            const snap = await getDoc(doc(db, "users", fbUser.uid));

            if (!snap.exists()) {
              if (!localUser && mounted) {
                setUser(null);
              }
              return;
            }

            const profile = snap.data() as any;

            const mapped: User = {
              id: 0,
              nombre: profile.nombre ?? "Usuario",
              email: profile.email ?? fbUser.email ?? "",
              role: profile.role ?? "user",
              status: profile.status ?? "active",
            } as any;

            if (mounted) {
              setUser(mapped);
            }

            // ✅ Guarda copia local para uso offline
            await setCurrentUser(mapped);
          } catch (e) {
            // Si Firebase falla pero hay usuario local, mantenemos sesión local
            if (!localUser && mounted) {
              setUser(null);
            }
          } finally {
            if (mounted) {
              setIsLoading(false);
            }
          }
        });

        return unsub;
      } catch (e) {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    let unsub: undefined | (() => void);

    boot().then((u) => {
      unsub = u;
    });

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, []);

  // ✅ Útil cuando Login/Register ya obtuvieron el usuario y quieres evitar “parpadeos”
  const signIn = async (newUser: User) => {
    setUser(newUser);
    await setCurrentUser(newUser);
  };

  const signOut = async () => {
    try {
      const { logoutFirebase } = await import("../services/auth.firebase");
      await logoutFirebase();
    } catch (e) {
      console.log("No se pudo cerrar Firebase, cerrando local:", e);
    }

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
