const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  id: 'mock-socket-id',
  connected: true,
};

const io = jest.fn().mockReturnValue(mockSocket);

module.exports = io;
module.exports.io = io;
