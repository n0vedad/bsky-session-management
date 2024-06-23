// test/integration.test.ts
import request from 'supertest';
import { startServer } from '../index';

// Mock the '@atproto/api' module
jest.mock('@atproto/api', () => ({
  // Mock the AtpAgent class implementation
  AtpAgent: jest.fn().mockImplementation(() => ({
    // Mock the login method to return mocked session data
    login: jest.fn().mockResolvedValue({
      data: {
        accessJwt: 'mocked_access_token',
        refreshJwt: 'mocked_refresh_token',
        handle: 'mocked_handle',
        did: 'mocked_did',
        active: true,
        status: 'active',
      },
    }),
    // Mock the resumeSession method to resolve without any value
    resumeSession: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Test suite for server integration tests
describe('Server Integration Test', () => {
  let server: ReturnType<typeof startServer>;

  // Set up the test environment before running the tests
  beforeAll(() => {
    // Set the required environment variables for testing
    process.env.IDENTIFIER = 'mocked_identifier';
    process.env.PASSWORD = 'abcd-efgh-ijkl-mnop';
    // Start the server
    server = startServer();
  });

  // Clean up the test environment after running the tests
  afterAll((done) => {
    // Close the server
    server.close(done);
    // Remove the mocked environment variables
    delete process.env.IDENTIFIER;
    delete process.env.PASSWORD;
  });

  // Test if the server responds with 'Hello World'
  it('should respond with Hello World', async () => {
    const response = await request(server).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello World!');
  });

  // Test if the server sets cookies on the first request
  it('should set cookies on first request', async () => {
    const response = await request(server).get('/');
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('accessJwt='),
        expect.stringContaining('refreshJwt='),
        expect.stringContaining('handle='),
        expect.stringContaining('did='),
        expect.stringContaining('active='),
        expect.stringContaining('status=')
      ])
    );
  });

  // Test if the server does not set cookies on subsequent requests with valid cookies
  it('should not set cookies on subsequent requests with valid cookies', async () => {
    const firstResponse = await request(server).get('/');
    const cookies = firstResponse.headers['set-cookie'];

    const secondResponse = await request(server)
      .get('/')
      .set('Cookie', cookies);

    expect(secondResponse.headers['set-cookie']).toBeUndefined();
  });
});