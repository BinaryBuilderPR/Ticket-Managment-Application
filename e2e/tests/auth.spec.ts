import { test, expect } from '@playwright/test';

test.describe('Authentication System & RBAC E2E Tests', () => {
  const ADMIN_EMAIL = 'admin@example.com';
  const ADMIN_PASSWORD = 'password123';
  const AGENT_EMAIL = 'agent@example.com';
  const AGENT_PASSWORD = 'password123';

  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies();
  });

  // -------------------------------------------------------------------------
  // 1. Client-Side Validation & Edge Cases
  // -------------------------------------------------------------------------
  test.describe('Client-Side Form Validation', () => {
    test('displays validation errors when submitting empty form', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByText(/welcome to helpdesk/i)).toBeVisible();

      // Click sign in without filling any fields
      await page.getByRole('button', { name: /sign in/i }).click();

      // Expect validation error messages
      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
      expect(page.url()).toContain('/login');
    });

    test('displays validation error for invalid email format', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email address/i).fill('not-a-valid-email');
      await page.getByLabel(/^password/i).fill('password123');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/please enter a valid email address/i)).toBeVisible();
      expect(page.url()).toContain('/login');
    });

    test('displays validation error for password shorter than 8 characters', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email address/i).fill('admin@example.com');
      await page.getByLabel(/^password/i).fill('short');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
      expect(page.url()).toContain('/login');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Authentication Failure & Error Scenarios
  // -------------------------------------------------------------------------
  test.describe('Authentication Failure Scenarios', () => {
    test('displays error alert for wrong password', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill('WrongPassword999!');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Error banner should appear
      await expect(
        page.getByText(/invalid email or password/i)
      ).toBeVisible({ timeout: 5000 });
      expect(page.url()).toContain('/login');
    });

    test('displays error alert for non-existent user email', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email address/i).fill('nonexistent.user@example.com');
      await page.getByLabel(/^password/i).fill('password123');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Error banner should appear
      await expect(
        page.getByText(/invalid email or password/i)
      ).toBeVisible({ timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Successful Login & Role-Based Navigation
  // -------------------------------------------------------------------------
  test.describe('Successful Login & RBAC Navigation', () => {
    test('admin logs in successfully, sees ADMIN badge and Users navigation link', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should redirect to Dashboard (/)
      await page.waitForURL('**/');
      await expect(page.getByText(/welcome back/i)).toBeVisible();

      // Check header info
      const header = page.getByRole('banner');
      await expect(header.getByText(ADMIN_EMAIL)).toBeVisible();
      await expect(header.getByText('ADMIN', { exact: true })).toBeVisible();

      // Admin MUST see the Users navigation link
      await expect(header.getByRole('link', { name: /users/i })).toBeVisible();
    });

    test('agent logs in successfully, sees AGENT badge, but NOT the Users navigation link', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email address/i).fill(AGENT_EMAIL);
      await page.getByLabel(/^password/i).fill(AGENT_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();

      // Should redirect to Dashboard (/)
      await page.waitForURL('**/');
      await expect(page.getByText(/welcome back/i)).toBeVisible();

      // Check header info
      const header = page.getByRole('banner');
      await expect(header.getByText(AGENT_EMAIL)).toBeVisible();
      await expect(header.getByText('AGENT', { exact: true })).toBeVisible();

      // Agent MUST NOT see the Users navigation link
      await expect(header.getByRole('link', { name: /users/i })).not.toBeVisible();
    });

    test('already authenticated user visiting /login is redirected to /', async ({ page }) => {
      // 1. Log in as admin
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      // 2. Try to go back to /login
      await page.goto('/login');

      // Should auto-redirect to /
      await page.waitForURL('**/');
      expect(page.url()).not.toContain('/login');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Sign Out Flow
  // -------------------------------------------------------------------------
  test.describe('Sign Out Flow', () => {
    test('user signs out and cannot access protected routes', async ({ page }) => {
      // 1. Sign in
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/^password/i).fill(ADMIN_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      // 2. Click Sign Out
      await page.getByRole('button', { name: /sign out/i }).click();

      // Should redirect to /login
      await page.waitForURL('**/login');
      await expect(page.getByText(/welcome to helpdesk/i)).toBeVisible();

      // 3. Attempting to visit / directly must redirect back to /login
      await page.goto('/');
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
    });
  });

  // -------------------------------------------------------------------------
  // 5. Route Guards & Access Control
  // -------------------------------------------------------------------------
  test.describe('Route Guards & RBAC Enforcement', () => {
    test('unauthenticated visitor accessing / is redirected to /login', async ({ page }) => {
      await page.goto('/');
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
    });

    test('unauthenticated visitor accessing /users is redirected to /login', async ({ page }) => {
      await page.goto('/users');
      await page.waitForURL('**/login');
      expect(page.url()).toContain('/login');
    });

    test('agent cannot access /users and is redirected to /', async ({ page }) => {
      // 1. Sign in as agent
      await page.goto('/login');
      await page.getByLabel(/email address/i).fill(AGENT_EMAIL);
      await page.getByLabel(/^password/i).fill(AGENT_PASSWORD);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL('**/');

      // 2. Force navigate to /users
      await page.goto('/users');

      // Role check should redirect back to /
      await page.waitForURL('**/');
      expect(page.url()).not.toContain('/users');
    });
  });

  // -------------------------------------------------------------------------
  // 6. User Creation Modal & End-to-End User Lifecycle
  // -------------------------------------------------------------------------
  test.describe('Admin User Creation & Lifecycle', () => {
    test('admin creates a new user, and the new user can immediately log in', async ({ page }) => {
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

      // 4. Validate modal inputs validation
      // Fill invalid name (less than 3 chars)
      await page.getByLabel(/full name/i).fill('ab');
      await page.getByLabel(/^email address/i).fill(newUserEmail);
      await page.getByLabel(/^password/i).fill(newUserPassword);
      await page.getByRole('button', { name: /^create user$/i }).click();
      await expect(page.getByText(/name must be at least 3 characters/i)).toBeVisible();

      // Fix name and submit
      await page.getByLabel(/full name/i).fill(newUserName);
      await page.getByRole('button', { name: /^create user$/i }).click();

      // Modal should close and success banner should appear
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

      // Successfully redirected to dashboard as the new user!
      await page.waitForURL('**/');
      await expect(page.getByText(/welcome back/i)).toBeVisible();
      const header = page.getByRole('banner');
      await expect(header.getByText(newUserEmail)).toBeVisible();
      await expect(header.getByText('AGENT', { exact: true })).toBeVisible();
    });
  });
});
