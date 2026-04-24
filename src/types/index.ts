// src/types/index.ts
/**
 * Archivo central para todos los tipos TypeScript de la aplicación.
 * Mantén este archivo pequeño y cohesivo.
 */

// ==========================================
// TIPOS BÁSICOS
// ==========================================
export type ID = number;

// ==========================================
// AUTENTICACIÓN Y PERMISOS
// ==========================================
export type Role = "admin" | "user" | "associated";

export type AppAction =
  | "venue:create" | "venue:update" | "venue:delete"
  | "game:create"  | "game:update"  | "game:delete"
  | "tourn:create" | "tourn:update" | "tourn:delete"
  | "event:create" | "event:update" | "event:delete";

/** Info mínima del usuario guardada en sesión local (AsyncStorage) */
export type User = {
  id: ID;
  nombre: string;
  email: string;
  telefono?: string;
  role: Role;                      // admin | user | associated
  status: "active" | "disabled";
  createdAt: string;               // ISO string
};

// ==========================================
// FORMULARIOS
// ==========================================
/** Form de Login (lo usa LoginScreen) */
export interface LoginFormData {
  username: string;   // en tu Login lo usas como email
  password: string;
}

// ==========================================
// UI TOKENS (THEME)
// ==========================================
export const COLORS = {
  primary: "#a535c0",     
  background: "#AAC2CA",
  surface: "#dddddd8a",
  text: "#000000",
  textSecondary: "#4e4e4eff",
};

export const FONT_SIZES = {
  small: 14,
  medium: 16,
  large: 18,
  xxlarge: 24,          
};
