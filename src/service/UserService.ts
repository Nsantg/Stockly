import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { userRepository } from '../repository/UserRepository';
import { User } from '../entity/User';
import { UserRole } from '../entity/UserRole';
import { BusinessError } from '../lib/errors';

const createUserSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  apellido: z.string().min(1, 'El apellido es requerido').max(100),
  email: z.string().email('Email inválido').max(254),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(128),
  rol: z.nativeEnum(UserRole).optional(),
});

const updateUserSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100).optional(),
  apellido: z.string().min(1, 'El apellido es requerido').max(100).optional(),
  email: z.string().email('Email inválido').max(254).optional(),
  rol: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

class UserService {
  async createUser(data: CreateUserDto): Promise<User> {
    const validated = createUserSchema.parse(data);

    const exists = await userRepository.emailExists(validated.email);
    if (exists) {
      throw new BusinessError('El email ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(validated.password, 12);

    const user = await userRepository.create({
      ...validated,
      password: hashedPassword,
    });

    return userRepository.save(user);
  }

  getUserByEmail(email: string): Promise<User | null> {
    return userRepository.findByEmail(email);
  }

  listUsers(): Promise<User[]> {
    return userRepository.findAllActive();
  }

  getAllUsers(): Promise<User[]> {
    return userRepository.findAll();
  }

  async getUserById(id: string): Promise<User> {
    const user = await userRepository.findById(id);
    if (!user) throw new BusinessError('Usuario no encontrado');
    return user;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.getUserById(id);
    const validated = updateUserSchema.parse(data);

    if (validated.email && validated.email !== user.email) {
      const taken = await userRepository.emailExists(validated.email, id);
      if (taken) throw new BusinessError('El email ya está en uso');
    }

    Object.assign(user, validated);
    return userRepository.save(user);
  }

  async deactivateUser(id: string): Promise<void> {
    await this.getUserById(id);
    await userRepository.deactivate(id);
  }
}

export const userService = new UserService();
