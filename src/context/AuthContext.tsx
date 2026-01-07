// src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../services/firebase";

// cache local (recomendado)
import { setCurrentUser, logout as localLogout } from "../services/auth.local";

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
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          setUser(null);
          return;
        }

        // ✅ Trae perfil desde Firestore: users/{uid}
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        if (!snap.exists()) {
          // Si no existe perfil, lo tratamos como no autorizado
          setUser(null);
          return;
        }

        const profile = snap.data() as any;

        // ✅ Mapea a tu tipo User local
        const mapped: User = {
          id: 0, // Firebase usa uid string; aquí no importa si tu app no usa id num
          nombre: profile.nombre ?? "Usuario",
          email: profile.email ?? fbUser.email ?? "",
          role: profile.role ?? "user",
          status: profile.status ?? "active",
        } as any;

        setUser(mapped);

        // ✅ Cache local
        await setCurrentUser(mapped);
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // ✅ Útil cuando Login/Register ya obtuvieron el usuario y quieres evitar “parpadeos”
  const signIn = async (newUser: User) => {
    setUser(newUser);
    await setCurrentUser(newUser);
  };

  const signOut = async () => {
    // 🔥 cierra sesión Firebase
    const { logoutFirebase } = await import("../services/auth.firebase");
    await logoutFirebase();

    // 🧹 limpia cache local
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
