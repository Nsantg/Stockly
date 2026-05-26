import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { userRepository } from '../repository/UserRepository';
import { User } from '../entity/User';
import { UserRole } from '../entity/UserRole';

const createUserSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.nativeEnum(UserRole).optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

class UserService {
  async createUser(data: CreateUserDto): Promise<User> {
    const validated = createUserSchema.parse(data);

    const exists = await userRepository.emailExists(validated.email);
    if (exists) {
      throw new Error('El email ya está en uso');
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
}

export const userService = new UserService();
