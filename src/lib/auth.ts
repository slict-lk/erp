import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';
import { getOrCreateDefaultUser, formatUserForSession } from './get-tenant';

export { authOptions } from './auth-options';

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user) {
      console.log('✅ Session found:', {
        email: session.user.email,
        role: session.user.role,
        tenantId: session.user.tenantId
      });
      return session.user;
    }

    // Development mode: If no session, get or create default user
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ No session found, using development fallback user');

      try {
        const defaultUser = await getOrCreateDefaultUser();
        const formattedUser = formatUserForSession(defaultUser);

        console.log('✅ Development fallback user:', {
          email: formattedUser.email,
          role: formattedUser.role,
          tenantId: formattedUser.tenantId,
          isSuperAdmin: defaultUser.isSuperAdmin
        });

        return formattedUser;
      } catch (error) {
        console.error('❌ Failed to get/create default user:', error);
        return null;
      }
    }

    console.warn('⚠️ No user found and not in development mode');
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}
