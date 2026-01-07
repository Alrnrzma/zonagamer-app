import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Role, User } from "../types";

const K = {
  users: "@zg_users",
  current: "@zg_current_user",
  seq: "@zg_users_seq",
};

async function nextId() {
  const raw = await AsyncStorage.getItem(K.seq);
  const n = raw ? Number(raw) : 0;
  const next = n + 1;
  await AsyncStorage.setItem(K.seq, String(next));
  return next;
}

/** Crea 2 usuarios demo si la lista está vacía */
export async function ensureDemoUsers() {
  const raw = await AsyncStorage.getItem(K.users);
  const arr: User[] = raw ? JSON.parse(raw) : [];
  if (arr.length) return;

  const now = new Date().toISOString();
  const demo: User[] = [
    {
      id: 1,
      nombre: "Admin Demo",
      email: "admin@zg.com",
      telefono: "5550000000",
      role: "admin",
      status: "active",
      createdAt: now,
      // @ts-ignore - solo para demo rápida
      password: "123456",
    },
    {
      id: 2,
      nombre: "Usuario Demo",
      email: "user@zg.com",
      telefono: "5551111111",
      role: "user",
      status: "active",
      createdAt: now,
      // @ts-ignore
      password: "123456",
    },
  ];
  await AsyncStorage.setItem(K.users, JSON.stringify(demo));
  await AsyncStorage.setItem(K.seq, "2");
}

/** Devuelve todos los usuarios (solo uso interno) */
export async function listUsers(): Promise<User[]> {
  const raw = await AsyncStorage.getItem(K.users);
  return raw ? JSON.parse(raw) : [];
}

/** Inserta/actualiza usuario (para Register) */
export async function upsertUser(data: {
  nombre: string;
  email: string;
  telefono?: string;
  role: Role;
  password: string; // local-only
  status?: "active" | "disabled";  
  createdAt?: string;               
}) {
  const users = await listUsers();

  // ¿ya existe por email?
  const i = users.findIndex(
    (u) => u.email.toLowerCase() === data.email.toLowerCase()
  );

  if (i !== -1) {
    throw new Error("Ese correo ya está registrado.");
  }

  const id = await nextId();
  const u: any = {
    id,
    nombre: data.nombre.trim(),
    email: data.email.trim(),
    telefono: data.telefono?.trim() || undefined,
    role: data.role,
    status: data.status ?? "active",                    
    createdAt: data.createdAt ?? new Date().toISOString(), 
    password: data.password, 
  };

  users.push(u);
  await AsyncStorage.setItem(K.users, JSON.stringify(users));
  return u as User;
}

/** Login local: valida email/contraseña y estado */
export async function login(email: string, password: string): Promise<User | null> {
  const e = (email ?? "").trim().toLowerCase();
  const p = String(password ?? "");

  if (!e || !p) return null; // 🔒 no permitir vacíos

  const users: any[] = await listUsers();

  // Normaliza también el email guardado (por si se guardó con espacios)
  const u = users.find((x) => {
    const storedEmail = String(x?.email ?? "").trim().toLowerCase();
    const storedPass = String(x?.password ?? "");
    return storedEmail === e && storedPass === p;
  });

  if (!u) return null;
  if (u.status !== "active") throw new Error("Tu cuenta está deshabilitada.");

  return u as User;
}

/** Sesión actual */
export async function setCurrentUser(u: User) {
  await AsyncStorage.setItem(K.current, JSON.stringify(u));
}
export async function getCurrentUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(K.current);
  return raw ? (JSON.parse(raw) as User) : null;
}
export async function logout() {
  await AsyncStorage.removeItem(K.current);
}
