// Jest setup file
// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn((key) => localStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => { localStorageMock.store[key] = value; }),
  removeItem: jest.fn((key) => { delete localStorageMock.store[key]; }),
  clear: jest.fn(() => { localStorageMock.store = {}; })
};
global.localStorage = localStorageMock;

// Mock window.scrollTo/scrollBy
global.scrollTo = jest.fn();
global.scrollBy = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});
