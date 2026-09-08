import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { renderWithQuery } from '@/test/renderWithQuery';
import { UsersPage } from '@/pages/UsersPage';
import { apiClient } from '@/lib/api-client';

describe('Create User Form & Modal Component Tests', () => {
  const mockUsers = [
    {
      id: 'usr-1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN' as const,
      createdAt: '2026-01-15T10:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, users: mockUsers },
    });
  });

  // ---------------------------------------------------------------------------
  // 1. Renders all fields and submit button
  // ---------------------------------------------------------------------------
  it('1. Renders all fields and submit button', async () => {
    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create new user/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^create user$/i })
    ).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 2. Validation: short name — shows error, doesn't call API
  // ---------------------------------------------------------------------------
  it('2. Validation: short name — shows error, doesn\'t call API', async () => {
    const postSpy = vi.spyOn(apiClient, 'post');
    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create new user/i }));

    // Fill short name (< 3 chars), valid email & password
    await user.type(screen.getByLabelText(/full name/i), 'Ed');
    await user.type(screen.getByLabelText(/email address/i), 'ed@example.com');
    await user.type(screen.getByLabelText(/password/i), 'ValidPass123!');

    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    expect(
      await screen.findByText(/name must be at least 3 characters/i)
    ).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 3. Validation: short password — shows error, doesn't call API
  // ---------------------------------------------------------------------------
  it('3. Validation: short password — shows error, doesn\'t call API', async () => {
    const postSpy = vi.spyOn(apiClient, 'post');
    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create new user/i }));

    // Fill valid name, valid email, short password (< 8 chars)
    await user.type(screen.getByLabelText(/full name/i), 'Sarah Connor');
    await user.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await user.type(screen.getByLabelText(/password/i), '1234');

    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    expect(
      await screen.findByText(/password must be at least 8 characters/i)
    ).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 4. Validation: missing email — shows error, doesn't call API
  // ---------------------------------------------------------------------------
  it('4. Validation: missing email — shows error, doesn\'t call API', async () => {
    const postSpy = vi.spyOn(apiClient, 'post');
    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create new user/i }));

    // Fill valid name & password, leave email empty
    await user.type(screen.getByLabelText(/full name/i), 'Sarah Connor');
    await user.type(screen.getByLabelText(/password/i), 'ValidPass123!');

    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 5. Sets aria-invalid on invalid fields
  // ---------------------------------------------------------------------------
  it('5. Sets aria-invalid on invalid fields', async () => {
    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create new user/i }));

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Initial state: not invalid
    expect(nameInput).toHaveAttribute('aria-invalid', 'false');
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    expect(passwordInput).toHaveAttribute('aria-invalid', 'false');

    // Submit empty form to trigger validation errors
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => {
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Calls POST /api/users with form data on valid submit
  // ---------------------------------------------------------------------------
  it('6. Calls POST /api/users with form data on valid submit', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        user: {
          id: 'usr-new',
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          role: 'AGENT',
          createdAt: new Date().toISOString(),
        },
      },
    });

    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create new user/i }));

    await user.type(screen.getByLabelText(/full name/i), 'Sarah Connor');
    await user.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/users', {
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        password: 'SecurePass123!',
        role: 'AGENT',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Calls onSuccess after successful creation
  // ---------------------------------------------------------------------------
  it('7. Calls onSuccess after successful creation', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        user: {
          id: 'usr-new',
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          role: 'AGENT',
          createdAt: new Date().toISOString(),
        },
      },
    });

    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create new user/i }));

    await user.type(screen.getByLabelText(/full name/i), 'Sarah Connor');
    await user.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    // Modal closes and success notification is displayed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(
      await screen.findByText(/user "sarah connor" was created successfully!/i)
    ).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 8. Resets the form after successful creation
  // ---------------------------------------------------------------------------
  it('8. Resets the form after successful creation', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        user: {
          id: 'usr-new',
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          role: 'AGENT',
          createdAt: new Date().toISOString(),
        },
      },
    });

    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    // 1. Open and submit valid user
    await user.click(screen.getByRole('button', { name: /create new user/i }));
    await user.type(screen.getByLabelText(/full name/i), 'Sarah Connor');
    await user.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // 2. Re-open modal to verify form was reset to initial values
    await user.click(screen.getByRole('button', { name: /create new user/i }));

    expect(screen.getByLabelText(/full name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('');
    expect(screen.getByLabelText(/password/i)).toHaveValue('');
    expect(screen.getByLabelText(/role/i)).toHaveValue('AGENT');
  });

  // ---------------------------------------------------------------------------
  // 9. Shows server error on 409 conflict ("Email already exists")
  // ---------------------------------------------------------------------------
  it('9. Shows server error on 409 conflict ("Email already exists")', async () => {
    const conflictError = new AxiosError(
      'Conflict',
      '409',
      undefined,
      undefined,
      {
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: {} as any,
        data: { message: 'A user with email sarah@example.com already exists.' },
      }
    );
    vi.spyOn(apiClient, 'post').mockRejectedValue(conflictError);

    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create new user/i }));
    await user.type(screen.getByLabelText(/full name/i), 'Sarah Connor');
    await user.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    expect(
      await screen.findByText(/a user with email sarah@example\.com already exists\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 10. Shows generic error for non-Axios errors
  // ---------------------------------------------------------------------------
  it('10. Shows generic error for non-Axios errors', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Network connection lost.'));

    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create new user/i }));
    await user.type(screen.getByLabelText(/full name/i), 'Sarah Connor');
    await user.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: /^create user$/i }));

    expect(
      await screen.findByText(/network connection lost\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 11. Shows "Creating..." and disables button while submitting
  // ---------------------------------------------------------------------------
  it('11. Shows "Creating..." and disables button while submitting', async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(apiClient, 'post').mockReturnValue(pendingPromise as any);

    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create new user/i }));
    await user.type(screen.getByLabelText(/full name/i), 'Sarah Connor');
    await user.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

    const submitButton = screen.getByRole('button', { name: /^create user$/i });
    await user.click(submitButton);

    // During pending submission: button shows "Creating..." and is disabled
    expect(await screen.findByRole('button', { name: /creating\.\.\./i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creating\.\.\./i })).toBeDisabled();

    // Resolve promise to clean up
    resolvePromise!({
      data: {
        success: true,
        user: { id: 'usr-1', name: 'Sarah', email: 'sarah@example.com' },
      },
    });
  });
});

