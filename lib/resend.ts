import { Resend } from 'resend';

// Initialize Resend client
// Will fail gracefully if API key is missing
let resend: Resend | null = null;

export function getResendClient(): Resend {
  if (resend) {
    return resend;
  }

  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'Missing required environment variable: RESEND_API_KEY. Please check your .env.local file.'
    );
  }

  resend = new Resend(apiKey);
  return resend;
}

// Get the "from" email address
export function getFromEmail(): string {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  return fromEmail;
}

