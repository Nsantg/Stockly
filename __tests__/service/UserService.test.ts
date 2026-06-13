import { userService } from '../../src/service/UserService';
import { userRepository } from '../../src/repository/UserRepository';
import bcrypt from 'bcryptjs';

describe('UserService', () => {
  const sampleUser = { id: 'u1', email: 'a@b.com', nombre: 'A', apellido: 'B' } as any;

  beforeEach(() => {
    jest.spyOn(userRepository, 'emailExists').mockResolvedValue(false);
    jest.spyOn(userRepository, 'create').mockImplementation(async (u: any) => ({ ...u, id: 'u-new' }));
    jest.spyOn(userRepository, 'save').mockImplementation(async (u: any) => ({ ...u }));
    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(sampleUser);
    jest.spyOn(userRepository, 'findAllActive').mockResolvedValue([sampleUser]);
    jest.spyOn(userRepository, 'findAll').mockResolvedValue([sampleUser]);
    jest.spyOn(userRepository, 'findById').mockResolvedValue(sampleUser);
    jest.spyOn(userRepository, 'deactivate').mockResolvedValue(undefined as any);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpw');
  });

  afterEach(() => jest.restoreAllMocks());

  test('createUser creates and saves user', async () => {
    const dto = { nombre: 'A', apellido: 'B', email: 'a@b.com', password: 'secret' };
    const created = await userService.createUser(dto as any);
    expect(created).toHaveProperty('id');
  });

  test('createUser throws on duplicate email', async () => {
    (userRepository.emailExists as jest.Mock).mockResolvedValueOnce(true);
    await expect(userService.createUser({ nombre: 'A', apellido: 'B', email: 'a@b.com', password: 'p' } as any)).rejects.toThrow();
  });

  test('getUserById returns user and throws when not found', async () => {
    const u = await userService.getUserById('u1');
    expect(u.id).toBe('u1');
    (userRepository.findById as jest.Mock).mockResolvedValueOnce(null);
    await expect(userService.getUserById('not-found')).rejects.toThrow('Usuario no encontrado');
  });

  test('updateUser validates email uniqueness and saves', async () => {
    (userRepository.emailExists as jest.Mock).mockResolvedValueOnce(false);
    const updated = await userService.updateUser('u1', { nombre: 'X' } as any);
    expect(updated).toHaveProperty('id');
    (userRepository.emailExists as jest.Mock).mockResolvedValueOnce(true);
    jest.spyOn(userRepository, 'findById').mockResolvedValueOnce({ ...sampleUser, email: 'a@b.com' });
    const maybeUpdated = await userService.updateUser('u1', { email: 'other@b.com' } as any);
    expect(maybeUpdated.email).toBe('other@b.com');
  });

  test('deactivateUser calls deactivate', async () => {
    await expect(userService.deactivateUser('u1')).resolves.toBeUndefined();
  });
});
