// src/services/auth.firebase.ts
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "./firebase";
import { User, Role } from "../types";

// (opcional pero útil) cache local para que tu app conserve sesión/datos
import { setCurrentUser } from "./auth.local";

type RegisterInput = {
  nombre: string;
  email: string;
  password: string;
  role?: Role;          // "user" | "admin" (si lo manejas)
  telefono?: string;
};

function mapProfileToUser(profile: any): User {
  return {
    id: 0, // app usa id num local; aquí no es crítico
    nombre: profile?.nombre ?? "Usuario",
    email: profile?.email ?? "",
    role: profile?.role ?? "user",
    status: profile?.status ?? "active",
  } as any;
}

export async function registerFirebase(input: RegisterInput): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  // 1) Crear en Firebase Auth
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // 2) Crear perfil en Firestore users/{uid}
  const ref = doc(db, "users", cred.user.uid);
  const profile = {
    nombre: input.nombre.trim(),
    email,
    telefono: input.telefono?.trim() || null,
    role: input.role ?? "user",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, profile, { merge: true });

  // 3) Regresar User local (y cachear)
  const user = mapProfileToUser(profile);
  await setCurrentUser(user);

  return user;
}

export async function loginFirebase(email: string, password: string): Promise<User> {
  const e = email.trim().toLowerCase();

  // 1) Login Firebase Auth (si no existe o pass mal -> truena)
  const cred = await signInWithEmailAndPassword(auth, e, password);

  // 2) Traer perfil users/{uid} (si no existe -> NO autorizado)
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists()) {
    // importante: si no hay perfil, no lo dejamos pasar
    await signOut(auth);
    throw new Error("Tu cuenta no está autorizada (sin perfil en Firestore).");
  }

  const profile = snap.data();
  const user = mapProfileToUser(profile);

  // 3) cache local
  await setCurrentUser(user);

  return user;
}

export async function logoutFirebase() {
  await signOut(auth);
}
