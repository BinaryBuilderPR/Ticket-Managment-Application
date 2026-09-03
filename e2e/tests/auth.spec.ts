import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const ADMIN_EMAIL = 'admin@example.com';
  const ADMIN_PASSWORD = 'password123';
  const AGENT_EMAIL = 'agent@example.com';
  const AGENT_PASSWORD = 'password123';

  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test for test isolation
    await page.context().clearCookies();
  });

  // -------------------------------------------------------------------------
  // 1. Login Page Suite
  // -------------------------------------------------------------------------
  test.describe('Login Page', () => {
    test('should display login form with all elements', async ({ page }) => {
      await page.goto('/login');

      // Check branding heading 'Welcome to Helpdesk'
      await expect(page.getByRole('heading', { name: /welcome to helpdesk/i })).toBeVisible();
      await expect(page.getByText(/sign in with your staff credentials to continue/i)).toBeVisible();

      // Check inputs and button
      await expect(page.getByLabel(/email address/i)).toBeVisible();
      await expect(page.getByLabel(/^password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should login successfully with valid admin credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should redirect to Dashboard (/)
      await page.waitForURL('**/');
      await expect(page.getByText(/welcome back/i)).toBeVisible();

      // Header verification
      const header = page.getByRole('banner');
      await expect(header.getByText(ADMIN_EMAIL)).toBeVisible();
      await expect(header.getByText('ADMIN', { exact: true })).toBeVisible();
      await expect(header.getByRole('link', { name: /users/i })).toBeVisible();
    });

    test('should show error with invalid email format', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email address/i).fill('invalid-email-format');
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/please enter a valid email address/i)).toBeVisible();
      expect(page.url()).toContain('/login');
    });

    test('should show error with empty email', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/email is required/i)).toBeVisible();
      expect(page.url()).toContain('/login');
    });

    test('should show error with empty password', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/password is required/i)).toBeVisible();
      expect(page.url()).toContain('/login');
    });

    test('should show error with empty email and password', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
      expect(page.url()).toContain('/login');
    });

    test('should show error with invalid email (non-existent user)', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email address/i).fill('nonexistent.user@example.com');
      await page.getByLabel(/^password/i).fill('password123');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 });
      expect(page.url()).toContain('/login');
    });

    test('should show error with incorrect password', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill('WrongPassword999!');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 });
      expect(page.url()).toContain('/login');
    });

    test('should show loading state during login', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);

      // Delay auth response to verify loading state deterministically
      await page.route('**/api/auth/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        await route.continue();
      });

      await page.getByRole('button', { name: /sign in/i }).click();

      // Verify button loading state and disabled status
      await expect(page.getByRole('button', { name: /signing in/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /signing in/i })).toBeDisabled();

      // Ensure login completes successfully
      await page.waitForURL('**/');
      await expect(page.getByText(/welcome back/i)).toBeVisible();
    });

    test('should redirect to home if already authenticated', async ({ page }) => {
      // 1. Log in
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      // 2. Direct navigate back to /login
      await page.goto('/login');

      // Should auto-redirect back to /
      await page.waitForURL('**/');
      expect(page.url()).not.toContain('/login');
    });

    test('should clear server error on new submission', async ({ page }) => {
      await page.goto('/login');

      // 1. Submit incorrect credentials
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill('WrongPassword999!');
      await page.getByRole('button', { name: /sign in/i }).click();

      const serverErrorAlert = page.getByText(/invalid email or password/i);
      await expect(serverErrorAlert).toBeVisible({ timeout: 5000 });

      // 2. Fix password and resubmit
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Error alert should be cleared and user redirected to dashboard
      await page.waitForURL('**/');
      await expect(page.getByText(/welcome back/i)).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Session Persistence Suite
  // -------------------------------------------------------------------------
  test.describe('Session Persistence', () => {
    test('should maintain session after page reload', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      const header = page.getByRole('banner');
      await expect(header.getByText(ADMIN_EMAIL)).toBeVisible();

      // Reload page
      await page.reload();

      // Still authenticated
      await expect(page.getByText(/welcome back/i)).toBeVisible();
      await expect(header.getByText(ADMIN_EMAIL)).toBeVisible();
      await expect(header.getByText('ADMIN', { exact: true })).toBeVisible();
    });

    test('should maintain session when navigating directly to protected route', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      // Direct navigation to /users
      await page.goto('/users');
      await page.waitForURL('**/users');
      await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
      const header = page.getByRole('banner');
      await expect(header.getByText(ADMIN_EMAIL)).toBeVisible();
    });

    test('should maintain session across multiple page navigations', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      const header = page.getByRole('banner');

      // 1. Navigate to /users via nav link
      await header.getByRole('link', { name: /users/i }).click();
      await page.waitForURL('**/users');
      await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();

      // 2. Navigate back to Dashboard via nav link
      await header.getByRole('link', { name: /dashboard/i }).click();
      await page.waitForURL('**/');
      await expect(page.getByText(/welcome back/i)).toBeVisible();

      // 3. Navigate directly to /users via URL
      await page.goto('/users');
      await page.waitForURL('**/users');
      await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();

      // 4. Reload on /users
      await page.reload();
      await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
      await expect(header.getByText(ADMIN_EMAIL)).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Logout Suite
  // -------------------------------------------------------------------------
  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      await page.getByRole('button', { name: /sign out/i }).click();
      await page.waitForURL('**/login');
      await expect(page.getByRole('heading', { name: /welcome to helpdesk/i })).toBeVisible();
    });

    test('should not be able to access protected routes after logout', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      await page.getByRole('button', { name: /sign out/i }).click();
      await page.waitForURL('**/login');

      // Try visiting root
      await page.goto('/');
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
    });

    test('should not be able to access admin routes after logout', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      await page.getByRole('button', { name: /sign out/i }).click();
      await page.waitForURL('**/login');

      // Try visiting /users
      await page.goto('/users');
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
    });

    test('should require login again after logout', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      // Logout
      await page.getByRole('button', { name: /sign out/i }).click();
      await page.waitForURL('**/login');

      // Direct visit to protected route redirects to login
      await page.goto('/');
      await page.waitForURL('**/login');
      await expect(page.getByRole('heading', { name: /welcome to helpdesk/i })).toBeVisible();

      // Log in again
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();

      await page.waitForURL('**/');
      await expect(page.getByText(/welcome back/i)).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Protected Routes Suite
  // -------------------------------------------------------------------------
  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated user to login when accessing root', async ({ page }) => {
      await page.goto('/');
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
      await expect(page.getByRole('heading', { name: /welcome to helpdesk/i })).toBeVisible();
    });

    test('should redirect unauthenticated user to login when accessing admin route (/users)', async ({ page }) => {
      await page.goto('/users');
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
      await expect(page.getByRole('heading', { name: /welcome to helpdesk/i })).toBeVisible();
    });

    test('should redirect unauthenticated user from home to login', async ({ page }) => {
      await page.goto('/');
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should allow access to protected route after login', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();

      await page.waitForURL('**/');
      await expect(page.getByText(/welcome back/i)).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Admin Route Protection Suite
  // -------------------------------------------------------------------------
  test.describe('Admin Route Protection', () => {
    test('should allow admin to access admin routes', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      await page.goto('/users');
      await page.waitForURL('**/users');
      await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /create new user/i })).toBeVisible();
    });

    test("should show 'Users' link in navigation for admin", async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      const header = page.getByRole('banner');
      await expect(header.getByRole('link', { name: /users/i })).toBeVisible();
    });

    test('should navigate to users page when clicking Users link', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      const header = page.getByRole('banner');
      await header.getByRole('link', { name: /users/i }).click();
      await page.waitForURL('**/users');
      await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();
    });

    test('should maintain access to home route while on admin route', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      await page.goto('/users');
      await page.waitForURL('**/users');

      const header = page.getByRole('banner');
      await header.getByRole('link', { name: /dashboard/i }).click();
      await page.waitForURL('**/');
      await expect(page.getByText(/welcome back/i)).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // 6. URL Handling Suite
  // -------------------------------------------------------------------------
  test.describe('URL Handling', () => {
    test('should redirect unknown routes to home for authenticated user', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      await page.goto('/non-existent-random-route');
      await page.waitForURL('**/');
      expect(page.url()).not.toContain('/non-existent-random-route');
      await expect(page.getByText(/welcome back/i)).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // 7. User Management Suite
  // -------------------------------------------------------------------------
  test.describe('User Management', () => {
    test('admin creates a new user, and new user can immediately log in', async ({ page }) => {
      const timestamp = Date.now();
      const newUserName = `Test Agent ${timestamp}`;
      const newUserEmail = `test.agent.${timestamp}@example.com`;
      const newUserPassword = 'NewAgentPassword123!';

      // 1. Log in as admin
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      // 2. Go to Users page
      await page.getByRole('link', { name: /users/i }).click();
      await page.waitForURL('**/users');
      await expect(page.getByRole('heading', { name: /user management/i })).toBeVisible();

      // 3. Open Create User Modal
      await page.getByRole('button', { name: /create new user/i }).click();
      await expect(page.getByRole('heading', { name: /create new user/i })).toBeVisible();

      // 4. Fill form inputs and submit
      await page.getByLabel(/full name/i).fill(newUserName);
      await page.getByLabel(/^email address/i).fill(newUserEmail);
      await page.getByLabel(/^password/i).fill(newUserPassword);
      await page.getByRole('button', { name: /^create user$/i }).click();

      // Modal should close and success notification should appear
      await expect(
        page.getByText(new RegExp(`User "${newUserName}" was created successfully!`, 'i'))
      ).toBeVisible({ timeout: 10000 });

      // The new user should appear in the table
      await expect(page.getByRole('table').getByText(newUserName)).toBeVisible();
      await expect(page.getByRole('table').getByText(newUserEmail)).toBeVisible();

      // 5. Sign out of Admin account
      await page.getByRole('button', { name: /sign out/i }).click();
      await page.waitForURL('**/login');

      // 6. Sign in with the newly created user credentials
      await page.getByLabel(/email address/i).fill(newUserEmail);
      await page.getByLabel(/^password/i).fill(newUserPassword);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Successfully redirected to dashboard as the new user
      await page.waitForURL('**/');
      await expect(page.getByText(/welcome back/i)).toBeVisible();
      const header = page.getByRole('banner');
      await expect(header.getByText(newUserEmail)).toBeVisible();
      await expect(header.getByText('AGENT', { exact: true })).toBeVisible();
    });
  });
});
