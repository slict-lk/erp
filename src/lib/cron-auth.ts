import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth-config';

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export async function isSessionOrCronAuthorized(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return true;
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || !authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const providedSecret = authHeader.slice('Bearer '.length);
  return safeEqual(providedSecret, cronSecret);
}
