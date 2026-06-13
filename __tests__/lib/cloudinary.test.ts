import { v2 as cloudinary } from 'cloudinary';
import { uploadImage, deleteImage } from '../../src/lib/cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('cloudinary helper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('assertConfigured', () => {
    it('debe lanzar un error si CLOUDINARY_CLOUD_NAME no está definido', async () => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
      process.env.CLOUDINARY_API_KEY = 'key';
      process.env.CLOUDINARY_API_SECRET = 'secret';

      await expect(uploadImage(Buffer.from([]), 'folder')).rejects.toThrow(
        'Cloudinary no está configurado. Verifica las variables de entorno'
      );
    });

    it('debe lanzar un error si CLOUDINARY_API_KEY no está definido', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'name';
      delete process.env.CLOUDINARY_API_KEY;
      process.env.CLOUDINARY_API_SECRET = 'secret';

      await expect(deleteImage('public_id')).rejects.toThrow(
        'Cloudinary no está configurado. Verifica las variables de entorno'
      );
    });

    it('debe lanzar un error si CLOUDINARY_API_SECRET no está definido', async () => {
      process.env.CLOUDINARY_CLOUD_NAME = 'name';
      process.env.CLOUDINARY_API_KEY = 'key';
      delete process.env.CLOUDINARY_API_SECRET;

      await expect(uploadImage(Buffer.from([]), 'folder')).rejects.toThrow(
        'Cloudinary no está configurado. Verifica las variables de entorno'
      );
    });
  });

  describe('uploadImage', () => {
    beforeEach(() => {
      process.env.CLOUDINARY_CLOUD_NAME = 'name';
      process.env.CLOUDINARY_API_KEY = 'key';
      process.env.CLOUDINARY_API_SECRET = 'secret';
    });

    it('debe subir la imagen exitosamente y retornar secure_url', async () => {
      const mockEnd = jest.fn();
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, { secure_url: 'https://res.cloudinary.com/test.jpg' });
          return { end: mockEnd };
        }
      );

      const buffer = Buffer.from('test-image-data');
      const url = await uploadImage(buffer, 'test-folder');

      expect(url).toBe('https://res.cloudinary.com/test.jpg');
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        { folder: 'test-folder', resource_type: 'image' },
        expect.any(Function)
      );
      expect(mockEnd).toHaveBeenCalledWith(buffer);
    });

    it('debe fallar si el servicio de upload retorna un error', async () => {
      const mockEnd = jest.fn();
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(new Error('Cloudinary error message'), null);
          return { end: mockEnd };
        }
      );

      const buffer = Buffer.from('test-image-data');
      await expect(uploadImage(buffer, 'test-folder')).rejects.toThrow(
        'Cloudinary error message'
      );
    });

    it('debe fallar con error genérico si no retorna resultado ni error', async () => {
      const mockEnd = jest.fn();
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, null);
          return { end: mockEnd };
        }
      );

      const buffer = Buffer.from('test-image-data');
      await expect(uploadImage(buffer, 'test-folder')).rejects.toThrow(
        'Error al subir la imagen a Cloudinary'
      );
    });
  });

  describe('deleteImage', () => {
    beforeEach(() => {
      process.env.CLOUDINARY_CLOUD_NAME = 'name';
      process.env.CLOUDINARY_API_KEY = 'key';
      process.env.CLOUDINARY_API_SECRET = 'secret';
    });

    it('debe eliminar la imagen llamando a destroy', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await deleteImage('test-public-id');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test-public-id');
    });
  });
});
