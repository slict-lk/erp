/**
 * Clear Session and Force Re-login
 * This will help you get a fresh JWT token with the correct role
 */

console.log('━'.repeat(70));
console.log('🔄 SESSION REFRESH GUIDE');
console.log('━'.repeat(70));

console.log('\n✅ Database Fixed: All admin users have role=ADMIN');
console.log('✅ Code Fixed: All auth files now use both isSuperAdmin and role');

console.log('\n⚠️  PROBLEM: Your current session has an OLD JWT token with wrong role');

console.log('\n📝 SOLUTION - Follow these steps IN ORDER:');
console.log('━'.repeat(70));

console.log('\n1️⃣  STOP your dev server (Ctrl+C if running)');

console.log('\n2️⃣  Clear Next.js cache:');
console.log('   rm -rf .next');
console.log('   (or manually delete the .next folder)');

console.log('\n3️⃣  Clear browser data:');
console.log('   - Open DevTools (F12)');
console.log('   - Go to Application tab');
console.log('   - Clear all cookies for localhost:3000');
console.log('   - Clear Local Storage');
console.log('   - Clear Session Storage');
console.log('   OR just use Incognito/Private mode');

console.log('\n4️⃣  Restart dev server:');
console.log('   npm run dev');

console.log('\n5️⃣  Log in again with:');
console.log('   Email: mubasshir@slict.lk');
console.log('   Password: Ms251985');

console.log('\n6️⃣  Check the console logs - should see:');
console.log('   "Session found: { role: \'ADMIN\' }"');

console.log('\n7️⃣  Try creating a user - should work! ✅');

console.log('\n━'.repeat(70));
console.log('🔍 DEBUG: If still not working, check browser console for:');
console.log('   - Session role value');
console.log('   - Any auth errors');
console.log('   - Network tab for API responses');
console.log('━'.repeat(70));

console.log('\n💡 Quick test to verify session role:');
console.log('   Add this to your page and check console:');
console.log('   ');
console.log('   import { useSession } from "next-auth/react";');
console.log('   const { data: session } = useSession();');
console.log('   console.log("Session role:", session?.user?.role);');
console.log('');

console.log('━'.repeat(70));
console.log('🎯 Expected result: role should be "ADMIN", not "USER"');
console.log('━'.repeat(70));
console.log('');

