// test/unit.test.ts
import { AtpAgent, AtpSessionData } from '@atproto/api';
import http from 'http';
import * as sessionManager from '../sessionManager';

// Mock the '@atproto/api' module
jest.mock('@atproto/api');

// Create a mocked version of the AtpAgent class
const MockedAtpAgent = AtpAgent as jest.MockedClass<typeof AtpAgent>;

// Describe the unit test suite
describe('Unit Tests', () => {
  // Define mock session data to be used in tests
  const mockSessionData: AtpSessionData = {
    accessJwt: 'newAccessJwt',
    refreshJwt: 'newRefreshJwt',
    handle: 'newHandle',
    did: 'newDid',
    active: true,
    status: 'active',
  };

  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test for getTokens function
  test('getTokens', async () => {
    const mockLogin = jest.fn().mockResolvedValue({
      data: {
        accessJwt: 'mockAccessJwt',
        refreshJwt: 'mockRefreshJwt',
        handle: 'mockHandle',
        did: 'mockDid',
        active: true,
        status: 'mockStatus'
      },
    });
    MockedAtpAgent.prototype.login.mockImplementation(mockLogin);

    // Restore original getTokens implementation for this test
    jest.spyOn(sessionManager, 'getTokens').mockRestore();

    const result = await sessionManager.getTokens();

    expect(mockLogin).toHaveBeenCalled();
    expect(result).toEqual({
      accessJwt: 'mockAccessJwt',
      refreshJwt: 'mockRefreshJwt',
      handle: 'mockHandle',
      did: 'mockDid',
      active: true,
      status: 'mockStatus',
    });
  });

  // Test for ensureValidSession function with a valid session
  test('ensureValidSession - valid session', async () => {
    const mockResumeSession = jest.fn().mockResolvedValue(undefined);
    MockedAtpAgent.prototype.resumeSession.mockImplementation(mockResumeSession);
    MockedAtpAgent.prototype.session = {
      accessJwt: 'newAccessJwt',
      refreshJwt: 'newRefreshJwt',
      handle: 'mockHandle',
      did: 'mockDid',
      active: true,
      status: 'mockStatus',
    } as AtpSessionData;

    const initialSessionData: AtpSessionData = {
      accessJwt: 'oldAccessJwt',
      refreshJwt: 'oldRefreshJwt',
      handle: 'mockHandle',
      did: 'mockDid',
      active: true,
      status: 'mockStatus',
    };

    const result = await sessionManager.ensureValidSession(initialSessionData);

    expect(mockResumeSession).toHaveBeenCalledWith(initialSessionData);
    expect(result).toEqual({
      accessJwt: 'newAccessJwt',
      refreshJwt: 'newRefreshJwt',
      handle: 'mockHandle',
      did: 'mockDid',
      active: true,
      status: 'mockStatus',
    });
  });

  // Test for parseCookies function
  test('parseCookies', () => {
    const cookieHeader = 'accessJwt=abc; refreshJwt=def; handle=ghi; did=jkl; active=true; status=active';
    const result = sessionManager.parseCookies(cookieHeader);
    expect(result).toEqual({
      accessJwt: 'abc',
      refreshJwt: 'def',
      handle: 'ghi',
      did: 'jkl',
      active: 'true',
      status: 'active',
    });
  });

  // Test for setCookies function
  test('setCookies', () => {
    const mockResponse = {
      setHeader: jest.fn(),
    } as unknown as http.ServerResponse;

    const sessionData: AtpSessionData = {
      accessJwt: 'mockAccessJwt',
      refreshJwt: 'mockRefreshJwt',
      handle: 'mockHandle',
      did: 'mockDid',
      active: true,
      status: 'active',
    };

    sessionManager.setCookies(mockResponse, sessionData);

    expect(mockResponse.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.arrayContaining([
      expect.stringContaining('accessJwt=mockAccessJwt'),
      expect.stringContaining('refreshJwt=mockRefreshJwt'),
      expect.stringContaining('handle=mockHandle'),
      expect.stringContaining('did=mockDid'),
      expect.stringContaining('active=true'),
      expect.stringContaining('status=active'),
    ]));
  });

  // Test for initializeSessionData function without cookies
  test('initializeSessionData - without cookies', async () => {
    const mockResponse = {
      setHeader: jest.fn(),
    } as unknown as http.ServerResponse;

    jest.spyOn(sessionManager, 'getTokens').mockResolvedValue(mockSessionData);

    const result = await sessionManager.initializeSessionData(undefined, mockResponse);

    expect(result).toEqual({
      sessionData: {
        accessJwt: 'mockAccessJwt',
        refreshJwt: 'mockRefreshJwt',
        handle: 'mockHandle',
        did: 'mockDid',
        active: true,
        status: 'mockStatus',
      },
      tokensUpdated: true,
    });

    expect(mockResponse.setHeader).toHaveBeenCalled();
  });
});