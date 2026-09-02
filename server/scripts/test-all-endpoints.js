async function testAllEndpoints() {
  const BASE_URL = 'http://localhost:5000';
  const ORIGIN = 'http://localhost:5173';

  const adminCredentials = {
    email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'password123',
  };

  const agentCredentials = {
    email: process.env.SEED_AGENT_EMAIL || 'agent@example.com',
    password: process.env.SEED_AGENT_PASSWORD || 'password123',
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
  console.log('🚀 RUNNING COMPREHENSIVE SECURITY & ENDPOINT TEST SUITE');
  console.log('===============================================================\n');

  // 1. Root Endpoint
  await check('GET / (Root API Status)', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const data = await res.json();
    if (res.status !== 200 || data.status !== 'online') throw new Error('Invalid root response');
    return { status: res.status, detail: `Status: ${data.status}` };
  });

  // 2. Security Headers Check
  await check('Security Headers Check (Helmet)', async () => {
    const res = await fetch(`${BASE_URL}/`);
    const xfo = res.headers.get('x-frame-options');
    const xcto = res.headers.get('x-content-type-options');
    if (xfo !== 'SAMEORIGIN' || xcto !== 'nosniff') {
      throw new Error(`Missing expected security headers (XFO: ${xfo}, XCTO: ${xcto})`);
    }
    return { status: res.status, detail: 'Helmet security headers verified' };
  });

  // 3. Health Endpoint
  await check('GET /health (Server & DB Health)', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.status !== 200 || data.status !== 'ok') throw new Error('Health check failed');
    return { status: res.status, detail: `Status: ${data.status}` };
  });

  // 4. Unauthenticated /api/db-status (Expect 401 Unauthorized)
  await check('GET /api/db-status (Unauthenticated - Expect 401)', async () => {
    const res = await fetch(`${BASE_URL}/api/db-status`, {
      headers: { Origin: ORIGIN },
    });
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
    return { status: res.status, detail: 'Correctly blocked unauthenticated DB status request' };
  });

  // 5. API Welcome Endpoint
  await check('GET /api (API Welcome)', async () => {
    const res = await fetch(`${BASE_URL}/api`);
    const data = await res.json();
    if (res.status !== 200) throw new Error('API welcome failed');
    return { status: res.status, detail: data.message };
  });

  // 6. Unauthenticated /api/me (Expect 401 Unauthorized)
  await check('GET /api/me (Unauthenticated - Expect 401)', async () => {
    const res = await fetch(`${BASE_URL}/api/me`, {
      headers: { Origin: ORIGIN },
    });
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
    return { status: res.status, detail: 'Correctly blocked unauthenticated profile request' };
  });

  // 7. Public Registration Attempt (Disabled - Expect 400)
  await check('POST /api/auth/sign-up/email (Public Sign-Up Disabled - Expect 400)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN,
      },
      body: JSON.stringify({
        email: `unauthorized.${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Unauthorized User',
      }),
    });
    const data = await res.json();
    if (res.status !== 400 || data.code !== 'EMAIL_PASSWORD_SIGN_UP_DISABLED') {
      throw new Error(`Expected 400 EMAIL_PASSWORD_SIGN_UP_DISABLED but got ${res.status} ${JSON.stringify(data)}`);
    }
    return { status: res.status, detail: 'Public sign-up is securely disabled' };
  });

  // 8. Sign-In Invalid Password (Expect 401)
  await check('POST /api/auth/sign-in/email (Invalid Password - Expect 401)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN,
      },
      body: JSON.stringify({
        email: adminCredentials.email,
        password: 'WrongPassword!',
      }),
    });
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
    return { status: res.status, detail: 'Correctly rejected invalid password' };
  });

  // 9. Sign-In Admin Credentials
  let adminCookie = '';
  await check('POST /api/auth/sign-in/email (Valid Admin Credentials)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN,
      },
      body: JSON.stringify(adminCredentials),
    });
    const cookie = res.headers.get('set-cookie');
    const data = await res.json();
    if (res.status !== 200 || !data.token) throw new Error(`Admin sign-in failed with status ${res.status}`);
    if (cookie) adminCookie = cookie.split(';')[0];
    return { status: res.status, detail: `User: ${data.user?.email} (${data.user?.role})` };
  });

  // 10. Authenticated Admin /api/me
  await check('GET /api/me (Admin Profile)', async () => {
    const res = await fetch(`${BASE_URL}/api/me`, {
      headers: {
        Origin: ORIGIN,
        Cookie: adminCookie,
      },
    });
    const data = await res.json();
    if (res.status !== 200 || data.user?.role !== 'ADMIN') throw new Error('Authenticated /api/me failed or role not ADMIN');
    return { status: res.status, detail: `Authenticated as: ${data.user.email} [${data.user.role}]` };
  });

  // 11. Authenticated Admin /api/db-status (Allowed - Expect 200)
  await check('GET /api/db-status (Admin RBAC Allowed - Expect 200)', async () => {
    const res = await fetch(`${BASE_URL}/api/db-status`, {
      headers: {
        Origin: ORIGIN,
        Cookie: adminCookie,
      },
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success) throw new Error(`Admin DB status failed with ${res.status}`);
    return { status: res.status, detail: 'Sanitized DB status accessible to ADMIN' };
  });

  // 12. Sign-In Agent Credentials
  let agentCookie = '';
  await check('POST /api/auth/sign-in/email (Valid Agent Credentials)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: ORIGIN,
      },
      body: JSON.stringify(agentCredentials),
    });
    const cookie = res.headers.get('set-cookie');
    const data = await res.json();
    if (res.status !== 200 || !data.token) throw new Error(`Agent sign-in failed with status ${res.status}`);
    if (cookie) agentCookie = cookie.split(';')[0];
    return { status: res.status, detail: `User: ${data.user?.email} (${data.user?.role})` };
  });

  // 13. Authenticated Agent /api/db-status (Forbidden - Expect 403)
  await check('GET /api/db-status (Agent RBAC Blocked - Expect 403)', async () => {
    const res = await fetch(`${BASE_URL}/api/db-status`, {
      headers: {
        Origin: ORIGIN,
        Cookie: agentCookie,
      },
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden for Agent on admin route but got ${res.status}`);
    return { status: res.status, detail: 'Agent correctly forbidden from ADMIN endpoint' };
  });

  // 14. Sign-Out Endpoint
  await check('POST /api/auth/sign-out (Revoke Session)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/sign-out`, {
      method: 'POST',
      headers: {
        Origin: ORIGIN,
        Cookie: adminCookie,
      },
    });
    if (res.status !== 200) throw new Error('Sign out failed');
    return { status: res.status, detail: 'Session revoked' };
  });

  // 15. Verify /api/me is Blocked Post-Signout
  await check('GET /api/me (Post-Signout - Expect 401)', async () => {
    const res = await fetch(`${BASE_URL}/api/me`, {
      headers: {
        Origin: ORIGIN,
        Cookie: adminCookie,
      },
    });
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
    return { status: res.status, detail: 'Protected route correctly blocked after signout' };
  });

  console.log('\n===============================================================');
  const allPassed = results.every(r => r.status === 'PASS');
  if (allPassed) {
    console.log(`🎉 ALL ${results.length} ENDPOINTS TESTED AND PASSED 100%!`);
  } else {
    console.log(`⚠️ Some tests failed. Total: ${results.length}, Passed: ${results.filter(r => r.status === 'PASS').length}`);
    process.exit(1);
  }
  console.log('===============================================================');
}

testAllEndpoints().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
