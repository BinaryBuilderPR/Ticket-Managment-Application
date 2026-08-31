async function testAllEndpoints() {
  const BASE_URL = 'http://localhost:5000';
  const ORIGIN = 'http://localhost:5173';
  const timestamp = Date.now();
  const testUser = {
    name: `API Test User ${timestamp}`,
    email: `apitest.${timestamp}@institution.edu`,
    password: 'TestPassword123!',
  };

  const results = [];

  async function check(name, fn) {
    const start = Date.now();
    try {
      const res = await fn();
      const duration = Date.now() - start;
      results.push({ name, status: 'PASS', code: res.status, duration, detail: res.detail });
      console.log(`✅ [PASS] (${duration}ms) [${res.status}] ${name}`);
    } catch (err) {
      const duration = Date.now() - start;
      results.push({ name, status: 'FAIL', code: err.status || 'ERR', duration, error: err.message });
      console.error(`❌ [FAIL] (${duration}ms) ${name} - Error: ${err.message}`);
    }
  }

  console.log('===============================================================');
  console.log('🚀 RUNNING COMPREHENSIVE ENDPOINT TEST SUITE FOR SERVER API');
  console.log('===============================================================\n');

  // 1. Root Endpoint
  await check('GET / (Root API Info)', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const data = await res.json();
    if (res.status !== 200 || !data.service) throw new Error('Invalid root response');
    return { status: res.status, detail: data.service };
  });

  // 2. Health Endpoint
  await check('GET /health (Server & DB Health)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.status !== 200 || data.database !== 'connected (helpdesk)') throw new Error('Health check failed');
    return { status: res.status, detail: data.database };
  });

  // 3. Database Status Endpoint
  await check('GET /api/db-status (PostgreSQL Info)', async () => {
    const res = await fetch(`${BASE_URL}/api/db-status`);
    const data = await res.json();
    if (res.status !== 200 || !data.success) throw new Error('DB status check failed');
    return { status: res.status, detail: `Connected to DB: ${data.databaseInfo?.current_database}` };
  });

  // 4. API Welcome Endpoint
  await check('GET /api (API Welcome)', async () => {
    const res = await fetch(`${BASE_URL}/api`);
    const data = await res.json();
    if (res.status !== 200) throw new Error('API welcome failed');
    return { status: res.status, detail: data.message };
  });

  // 5. Unauthenticated /api/me (Should be 401 Unauthorized)
  await check('GET /api/me (Unauthenticated - Expect 401)', async () => {
    const res = await fetch(`${BASE_URL}/api/me`, {
      headers: { Origin: ORIGIN },
    });
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
    return { status: res.status, detail: 'Correctly blocked unauthenticated request' };
  });

  // 6. Sign-Up Endpoint (Should be disabled - Expect 400)
  await check('POST /api/auth/sign-up/email (Public Registration - Disabled: Expect 400)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN,
      },
      body: JSON.stringify(testUser),
    });
    const data = await res.json();
    if (res.status !== 400 || data.code !== 'EMAIL_PASSWORD_SIGN_UP_DISABLED') {
      throw new Error(`Expected 400 EMAIL_PASSWORD_SIGN_UP_DISABLED but got ${res.status} ${JSON.stringify(data)}`);
    }
    return { status: res.status, detail: 'Public sign-up is securely disabled' };
  });

  // 7. Sign-In Endpoint (Invalid Password - Expect 401)
  await check('POST /api/auth/sign-in/email (Invalid Credentials - Expect 401)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN,
      },
      body: JSON.stringify({
        email: 'student.demo2@institution.edu',
        password: 'WrongPassword!',
      }),
    });
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
    return { status: res.status, detail: 'Correctly rejected invalid password' };
  });

  // 8. Sign-In Endpoint (Valid Password)
  let sessionCookie = '';
  await check('POST /api/auth/sign-in/email (Valid Credentials)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN,
      },
      body: JSON.stringify({
        email: 'student.demo2@institution.edu',
        password: 'Password123!',
      }),
    });
    const cookie = res.headers.get('set-cookie');
    const data = await res.json();
    if (res.status !== 200 || !data.token) throw new Error('Sign-in failed');
    if (cookie) sessionCookie = cookie.split(';')[0];
    return { status: res.status, detail: `Session token: ${data.token.substring(0, 10)}...` };
  });

  // 9. Get-Session Endpoint
  await check('GET /api/auth/get-session (Active Session)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/get-session`, {
      headers: {
        Origin: ORIGIN,
        Cookie: sessionCookie,
      },
    });
    const data = await res.json();
    if (res.status !== 200 || !data?.session?.id) throw new Error('Get-session failed');
    return { status: res.status, detail: `Session ID: ${data.session.id}` };
  });

  // 10. Authenticated /api/me via requireAuth Middleware
  await check('GET /api/me (Authenticated Profile)', async () => {
    const res = await fetch(`${BASE_URL}/api/me`, {
      headers: {
        Origin: ORIGIN,
        Cookie: sessionCookie,
      },
    });
    const data = await res.json();
    if (res.status !== 200 || data.user?.email !== 'student.demo2@institution.edu') throw new Error('Authenticated /api/me failed');
    return { status: res.status, detail: `Authenticated as: ${data.user.email}` };
  });

  // 11. Sign-Out Endpoint
  await check('POST /api/auth/sign-out (Revoke Session)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/sign-out`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: sessionCookie,
      },
    });
    if (res.status !== 200) throw new Error('Sign out failed');
    return { status: res.status, detail: 'Session revoked' };
  });

  // 12. Verify Session Revocation
  await check('GET /api/auth/get-session (Post-Signout - Expect Null)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/get-session`, {
      headers: {
        Origin: ORIGIN,
        Cookie: sessionCookie,
      },
    });
    const data = await res.json();
    if (data !== null && data?.session) throw new Error('Session still active');
    return { status: res.status, detail: 'Session is confirmed null' };
  });

  // 13. Verify /api/me is Blocked Post-Signout
  await check('GET /api/me (Post-Signout - Expect 401)', async () => {
    const res = await fetch(`${BASE_URL}/api/me`, {
      headers: {
        Origin: ORIGIN,
        Cookie: sessionCookie,
      },
    });
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
    return { status: res.status, detail: 'Protected route correctly blocked' };
  });

  console.log('\n===============================================================');
  const allPassed = results.every(r => r.status === 'PASS');
  if (allPassed) {
    console.log(`🎉 ALL ${results.length} ENDPOINTS TESTED AND PASSED 100%!`);
  } else {
    console.log(`⚠️ Some tests failed. Total: ${results.length}, Passed: ${results.filter(r => r.status === 'PASS').length}`);
  }
  console.log('===============================================================');
}

testAllEndpoints().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

