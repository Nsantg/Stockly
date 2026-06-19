const mockServer = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn().mockReturnThis(),
  use: jest.fn(),
  on: jest.fn(),
  join: jest.fn(),
};

const MockServer = jest.fn().mockImplementation(() => mockServer);

module.exports = { Server: MockServer };
