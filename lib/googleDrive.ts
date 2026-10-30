import { GoogleAuth } from 'google-auth-library';

// Reuses the same service account as GA4 (GA4_CREDENTIALS, or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY).
// Drive folders must be shared with that service account's email to be readable.
const getCredentials = () => {
  if (process.env.GA4_CREDENTIALS) return JSON.parse(process.env.GA4_CREDENTIALS);
  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
    return {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey.replace(/\\n/g, '\n'),
      type: 'service_account',
    };
  }
  throw new Error('Google service account credentials not configured');
};

let auth: GoogleAuth | null = null;

export const getDriveToken = async (): Promise<string> => {
  if (!auth) {
    auth = new GoogleAuth({
      credentials: getCredentials(),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
  }
  const token = await auth.getAccessToken();
  if (!token) throw new Error('Could not get Google Drive access token');
  return token;
};

export const getServiceAccountEmail = (): string | null => {
  try {
    return getCredentials().client_email ?? null;
  } catch {
    return null;
  }
};

export const isValidDriveId = (id: string | null): id is string => !!id && /^[a-zA-Z0-9_-]{10,}$/.test(id);
