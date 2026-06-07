process.env.NODE_ENV = 'test';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.setTimeout(60_000);
