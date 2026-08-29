async function runAuthFlowTest() {
  const BASE_URL = 'http://localhost:5000';
  const ORIGIN = 'http://localhost:5173';
  const timestamp = Date.now();
  const testUser = {
    name: `Test Agent ${timestamp}`,
    email: `agent.${timestamp}@institution.edu`,
    password: 'SuperSecurePassword123!',
  };

  console.log('====================================================');
  console.log('🧪 STARTING BETTER AUTH END-TO-END FLOW TEST');
  console.log('====================================================\n');

  // Step 1: Health / Auth OK Check
  console.log('➡️ [Step 1] Checking Auth OK endpoint...');
  const okRes = await fetch(`${BASE_URL}/api/auth/ok`, {
    headers: { Origin: ORIGIN },
  });
  const okData = await okRes.json();
  console.log(`   Status: ${okRes.status} | Response:`, okData);
  if (!okRes.ok) throw new Error('Auth OK endpoint failed');
  console.log('   ✅ Auth OK passed!\n');

  // Step 2: Sign Up with Email/Password
  console.log(`➡️ [Step 2] Signing up new user: ${testUser.email}...`);
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
  console.log(`   Set-Cookie: ${signUpCookie ? 'Present (Session Created)' : 'None'}`);
  console.log(`   User ID: ${signUpData.user?.id} | Name: ${signUpData.user?.name}`);
  if (!signUpRes.ok) throw new Error('Sign up failed');
  console.log('   ✅ Sign up passed!\n');

  // Step 3: Sign In with Email/Password
  console.log(`➡️ [Step 3] Signing in with user credentials...`);
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
  console.log(`   Cookie Header: ${sessionCookie}`);
  if (!signInRes.ok || !sessionCookie) throw new Error('Sign in failed or no cookie returned');
  console.log('   ✅ Sign in passed!\n');

  // Extract the raw cookie for subsequent authenticated requests
  const cookieValue = sessionCookie.split(';')[0];

  // Step 4: Get Active Session using the Cookie
  console.log('➡️ [Step 4] Validating database session with Cookie (/api/auth/get-session)...');
  const getSessionRes = await fetch(`${BASE_URL}/api/auth/get-session`, {
    headers: {
      Origin: ORIGIN,
      Cookie: cookieValue,
    },
  });
  const sessionData = await getSessionRes.json();
  console.log(`   Status: ${getSessionRes.status}`);
  console.log(`   Session ID: ${sessionData.session?.id}`);
  console.log(`   Session User ID: ${sessionData.session?.userId}`);
  console.log(`   Session Expires At: ${sessionData.session?.expiresAt}`);
  console.log(`   Authenticated User: ${sessionData.user?.email} (${sessionData.user?.name})`);
  if (!sessionData?.session?.id) throw new Error('Failed to retrieve active database session');
  console.log('   ✅ Database session validation passed!\n');

  // Step 5: Sign Out
  console.log('➡️ [Step 5] Signing out (/api/auth/sign-out)...');
  const signOutRes = await fetch(`${BASE_URL}/api/auth/sign-out`, {
    method: 'POST',
    headers: {
      Origin: ORIGIN,
      Cookie: cookieValue,
    },
  });
  console.log(`   Status: ${signOutRes.status}`);
  if (!signOutRes.ok) throw new Error('Sign out failed');
  console.log('   ✅ Sign out request passed!\n');

  // Step 6: Verify Session is Revoked in Database
  console.log('➡️ [Step 6] Verifying session revocation from Database...');
  const verifyRevokedRes = await fetch(`${BASE_URL}/api/auth/get-session`, {
    headers: {
      Origin: ORIGIN,
      Cookie: cookieValue,
    },
  });
  const verifyData = await verifyRevokedRes.json();
  console.log(`   Status: ${verifyRevokedRes.status} | Session Data:`, verifyData);
  if (verifyData !== null && verifyData?.session) {
    throw new Error('Session was NOT revoked!');
  }
  console.log('   ✅ Session successfully revoked in database!\n');

  console.log('====================================================');
  console.log('🎉 ALL BETTER AUTH FLOW TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

runAuthFlowTest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});

