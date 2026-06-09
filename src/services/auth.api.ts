import { User, Role } from "../types";

const API_BASE_URL = "https://zonagamer-app.onrender.com";

type ApiUser = {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  role: Role;
  status: "active" | "disabled" | string;
  createdAt?: number;
  updatedAt?: number;
};

function mapApiUser(apiUser: ApiUser): User {
  return {
    id: 0,
    nombre: apiUser.nombre,
    email: apiUser.email,
    role: apiUser.role,
    status: apiUser.status ?? "active",
  } as User;
}

export async function loginApi(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "No se pudo iniciar sesión");
  }

  const json = await res.json();
  return mapApiUser(json.user);
}

export async function registerApi(input: {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  role: Role;
}): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nombre: input.nombre.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      telefono: input.telefono?.trim() || undefined,
      role: input.role,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "No se pudo registrar");
  }

  const json = await res.json();
  return mapApiUser(json.user);
}