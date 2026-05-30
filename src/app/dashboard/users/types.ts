export type UserRole = 'Admin' | 'Almacenista' | 'Despachador' | 'Visualizador';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface UserFormData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: UserRole;
}
