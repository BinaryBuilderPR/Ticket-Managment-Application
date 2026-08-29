async function runAuthFlowTest() {
  const BASE_URL = 'http://localhost:5000';
  const ORIGIN = 'http://localhost:5173';
  const timestamp = Date.now();
  const testUser = {
    name: `Support Agent ${timestamp}`,
    email: `agent.${timestamp}@institution.edu`,
    password: 'SuperSecurePassword123!',
  };

  console.log('====================================================');
  console.log('🧪 STARTING BETTER AUTH END-TO-END FLOW TEST');
  console.log('====================================================\n');

  // Step 1: Health Check
  console.log('➡️ [Step 1] Checking server health (/health)...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log(`   Status: ${healthRes.status} | Response:`, healthData);
  if (!healthRes.ok) throw new Error('Health check endpoint failed');
  console.log('   ✅ Step 1 Passed: Server is online and DB connected.\n');

  // Step 2: Test Accessing Protected /api/me without Auth (Should fail with 401)
  console.log('➡️ [Step 2] Testing protected /api/me without cookie (Expect 401)...');
  const unauthMeRes = await fetch(`${BASE_URL}/api/me`, {
    headers: { Origin: ORIGIN },
  });
  console.log(`   Status: ${unauthMeRes.status} (Expected 401)`);
  if (unauthMeRes.status !== 401) throw new Error('Expected 401 Unauthorized for unauthenticated /api/me');
  console.log('   ✅ Step 2 Passed: Protected route blocked unauthenticated request.\n');

  // Step 3: Sign Up with Email/Password
  console.log(`➡️ [Step 3] Signing up new user: ${testUser.email}...`);
  const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
    },
    body: JSON.stringify(testUser),
  });
  const signUpCookie = signUpRes.headers.get('set-cookie');
  const signUpData = await signUpRes.json();
  console.log(`   Status: ${signUpRes.status}`);
  console.log(`   Set-Cookie: ${signUpCookie ? 'Present (Session Created in DB)' : 'None'}`);
  console.log(`   User ID: ${signUpData.user?.id} | Name: ${signUpData.user?.name}`);
  if (!signUpRes.ok) throw new Error('Sign up failed: ' + JSON.stringify(signUpData));
  console.log('   ✅ Step 3 Passed: User registered & persisted in PostgreSQL.\n');

  // Step 4: Sign In with Email/Password
  console.log(`➡️ [Step 4] Signing in with user credentials...`);
  const signInRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
    },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }),
  });
  const sessionCookie = signInRes.headers.get('set-cookie');
  const signInData = await signInRes.json();
  console.log(`   Status: ${signInRes.status}`);
  console.log(`   Session Token: ${signInData.token}`);
  console.log(`   Cookie Header: ${sessionCookie ? sessionCookie.substring(0, 50) + '...' : 'None'}`);
  if (!signInRes.ok || !sessionCookie) throw new Error('Sign in failed or no cookie returned');
  console.log('   ✅ Step 4 Passed: Authenticated and session cookie issued.\n');

  // Extract the raw cookie for authenticated requests
  const cookieValue = sessionCookie.split(';')[0];

  // Step 5: Test Accessing Protected /api/me WITH Auth Cookie via requireAuth middleware
  console.log('➡️ [Step 5] Calling protected /api/me with session cookie (requireAuth middleware)...');
  const authMeRes = await fetch(`${BASE_URL}/api/me`, {
    headers: {
      Origin: ORIGIN,
      Cookie: cookieValue,
    },
  });
  const authMeData = await authMeRes.json();
  console.log(`   Status: ${authMeRes.status}`);
  console.log(`   req.user from middleware: ${authMeData.user?.email} (${authMeData.user?.name})`);
  console.log(`   req.session from middleware: Session ID ${authMeData.session?.id}`);
  if (!authMeRes.ok || !authMeData.user?.id) throw new Error('Failed to access protected /api/me with requireAuth');
  console.log('   ✅ Step 5 Passed: requireAuth middleware verified session and injected req.user & req.session.\n');

  // Step 6: Sign Out
  console.log('➡️ [Step 6] Signing out (/api/auth/sign-out)...');
  const signOutRes = await fetch(`${BASE_URL}/api/auth/sign-out`, {
    method: 'POST',
    headers: {
      Origin: ORIGIN,
      Cookie: cookieValue,
    },
  });
  console.log(`   Status: ${signOutRes.status}`);
  if (!signOutRes.ok) throw new Error('Sign out failed');
  console.log('   ✅ Step 6 Passed: Sign out dispatched.\n');

  // Step 7: Verify Protected Route is Blocked After Sign Out
  console.log('➡️ [Step 7] Testing protected /api/me after sign out (Expect 401)...');
  const afterSignOutMeRes = await fetch(`${BASE_URL}/api/me`, {
    headers: {
      Origin: ORIGIN,
      Cookie: cookieValue,
    },
  });
  console.log(`   Status: ${afterSignOutMeRes.status} (Expected 401)`);
  if (afterSignOutMeRes.status !== 401) throw new Error('Expected 401 after session revocation');
  console.log('   ✅ Step 7 Passed: Revoked session successfully rejected by middleware!\n');

  console.log('====================================================');
  console.log('🎉 ALL BETTER AUTH & MIDDLEWARE TESTS PASSED 100%!');
  console.log('====================================================');
}

runAuthFlowTest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
