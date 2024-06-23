// sessionManager.ts
import http from 'http';
import { AtpAgent, AtpSessionData, ComAtprotoServerCreateSession } from '@atproto/api';

// Initialize the agent for the 'https://bsky.social' service
const agent = new AtpAgent({
  service: 'https://bsky.social',
});

/**
 * Function to get tokens (login) from the service.
 * @returns {Promise<AtpSessionData>} The session data.
 */
export async function getTokens(): Promise<AtpSessionData> {
  // Log in and get session data
  const sessionData: ComAtprotoServerCreateSession.Response = await agent.login({
    identifier: process.env.IDENTIFIER!,
    password: process.env.PASSWORD!,
  });

  // Log the obtained tokens
  console.log('getTokens called, tokens:', '\n', sessionData, '\n');

  // Return the promised session data
  return {
    accessJwt: sessionData.data.accessJwt,
    refreshJwt: sessionData.data.refreshJwt,
    handle: sessionData.data.handle,
    did: sessionData.data.did,
    active: sessionData.data.active ?? true,
    status: sessionData.data.status ?? undefined,
  };
}

/**
 * Function to ensure the session is valid, otherwise refresh tokens.
 * @param {AtpSessionData} sessionData - The session data.
 * @returns {Promise<AtpSessionData>} The updated session data.
 */
export async function ensureValidSession(sessionData: AtpSessionData): Promise<AtpSessionData> {
  const currentAccessJwt = sessionData.accessJwt;
  const currentRefreshJwt = sessionData.refreshJwt;

  try {
    // Log the session data being validated
    console.log('ensureValidSession called, using sessionData:', sessionData, '\n');

    // Try to resume the session with existing data
    await agent.resumeSession(sessionData);
    console.log('Session resumed successfully', '\n');

    // Check if tokens were updated during session validation
    if (currentAccessJwt !== agent.session?.accessJwt || currentRefreshJwt !== agent.session?.refreshJwt) {
      console.log('Tokens were updated during session validation', '\n');
      sessionData = agent.session as AtpSessionData;
    }
  } catch (error: unknown) {
    // Log any error and get new tokens
    if (error instanceof Error) {
      console.error('Session resume failed:', error, '\n');
    } else {
      console.error('Unknown Error', error, '\n');
    }
    sessionData = await getTokens();
  }
  // Return the session data if the session was successfully resumed
  return sessionData;
}

/**
 * Function to initialize session data.
 * @param {string} [cookies] - The cookies from the request.
 * @param {http.ServerResponse} [response] - The server response object.
 * @returns {Promise<{ sessionData: AtpSessionData, tokensUpdated: boolean }>} An object containing the session data and a boolean indicating if tokens were updated.
 */
export async function initializeSessionData(cookies?: string, response?: http.ServerResponse): Promise<{ sessionData: AtpSessionData, tokensUpdated: boolean }> {
  let tokensUpdated = false;
  let sessionData: AtpSessionData;

  try {
    if (cookies) {
      const parsedCookies = parseCookies(cookies);
      console.log('Parsed cookies:', parsedCookies, '\n');

      // Check if all required fields are present in the cookies
      const requiredFields = ['accessJwt', 'refreshJwt', 'handle', 'did', 'active', 'status'];
      const allFieldsPresent = requiredFields.every(field => parsedCookies[field]);

      switch (true) {
        case allFieldsPresent:
          sessionData = {
            ...Object.fromEntries(
              requiredFields.map(field => [field, parsedCookies[field]])
            ),
            active: parsedCookies['active'] === 'true' // Convert string to boolean
          } as AtpSessionData;
          break;
        default:
          console.log('Invalid cookies, calling getTokens', '\n');
          sessionData = await getTokens();
          tokensUpdated = true;
          break;
      }
    } else {
      console.log('No cookies, calling getTokens', '\n');
      sessionData = await getTokens();
      tokensUpdated = true;
    }

    // Set new cookies in the response if tokens were created
    if (tokensUpdated && response) {
      setCookies(response, sessionData);
    }

    // Catch any error and throw them to main function
  } catch (error) {
    console.error('Error initializing session data:', error, '\n');
    throw error;
  }

  return { sessionData, tokensUpdated };
}

/**
 * Function to parse cookies from the request header.
 * @param {string} cookieHeader - The cookie header from the request.
 * @returns {Record<string, string>} An object containing the parsed cookies
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const cookie of cookieHeader.split(';')) {
    const [key, value] = cookie.split('=');
    cookies[key.trim()] = value ? value.trim() : '';
  }
  return cookies;
}

/**
 * Function to set cookies in the response.
 * @param {http.ServerResponse} response - The server response object.
 * @param {AtpSessionData} sessionData - The session data.
 */
export function setCookies(response: http.ServerResponse, sessionData: AtpSessionData): void {
  const cookieOptions = 'HttpOnly; Path=/; SameSite=Strict; Secure';

  // Set the session cookies with the specified options
  response.setHeader('Set-Cookie', [
    `accessJwt=${sessionData.accessJwt}; ${cookieOptions}`,
    `refreshJwt=${sessionData.refreshJwt}; ${cookieOptions}`,
    `handle=${sessionData.handle}; ${cookieOptions}`,
    `did=${sessionData.did}; ${cookieOptions}`,
    `active=${sessionData.active}; ${cookieOptions}`,
    `status=${sessionData.status}; ${cookieOptions}`
  ]);

  // Log that new cookies have been set
  console.log('New cookies set', '\n');
}
