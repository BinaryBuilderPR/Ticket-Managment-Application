import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { renderWithQuery } from '@/test/renderWithQuery';
import { UsersPage } from '../UsersPage';
import { apiClient } from '@/lib/api-client';

describe('UsersPage Component', () => {
  const mockUsers = [
    {
      id: 'usr-1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN' as const,
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'usr-2',
      name: 'Agent User',
      email: 'agent@example.com',
      role: 'AGENT' as const,
      createdAt: '2026-02-20T14:30:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Loading State
  // ---------------------------------------------------------------------------
  it('should render table skeleton rows while fetching users', () => {
    // Return a never-resolving promise to hold loading state
    vi.spyOn(apiClient, 'get').mockReturnValue(new Promise(() => {}));

    const { container } = renderWithQuery(<UsersPage />);

    expect(screen.getByRole('heading', { name: /user management/i })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Skeletons should be rendered inside table
    const skeletonElements = container.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // 2. Data Rendering
  // ---------------------------------------------------------------------------
  it('should render user list table with correct headers, user rows, and role badges', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, users: mockUsers },
    });

    renderWithQuery(<UsersPage />);

    // Wait for user row to render
    expect(await screen.findByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();

    expect(screen.getByText('Agent User')).toBeInTheDocument();
    expect(screen.getByText('agent@example.com')).toBeInTheDocument();
    expect(screen.getByText('AGENT')).toBeInTheDocument();

    // Column headers
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /role/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /created/i })).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 3. Empty State
  // ---------------------------------------------------------------------------
  it('should render empty state card when no users are returned', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, users: [] },
    });

    renderWithQuery(<UsersPage />);

    expect(await screen.findByText(/no users found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/get started by creating the first support agent user/i)
    ).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 4. Error State & Retry
  // ---------------------------------------------------------------------------
  it('should render error banner and allow retrying on fetch failure', async () => {
    const customError = new AxiosError(
      'Server unavailable',
      '500',
      undefined,
      undefined,
      {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
        data: { message: 'Server unavailable. Failed to fetch users.' },
      }
    );

    const getSpy = vi
      .spyOn(apiClient, 'get')
      .mockRejectedValueOnce(customError)
      .mockResolvedValueOnce({
        data: { success: true, users: mockUsers },
      });

    renderWithQuery(<UsersPage />);

    expect(
      await screen.findByText(/server unavailable\. failed to fetch users\./i)
    ).toBeInTheDocument();

    // Click "Try Again"
    const user = userEvent.setup();
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    await user.click(tryAgainButton);

    // Should successfully reload users
    expect(await screen.findByText('Admin User')).toBeInTheDocument();
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  // ---------------------------------------------------------------------------
  // 5. Modal Open / Close Lifecycle
  // ---------------------------------------------------------------------------
  it('should open and close the Create New User modal dialog', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, users: mockUsers },
    });

    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    // Modal dialog is not initially visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click "Create New User" button
    const createButton = screen.getByRole('button', { name: /create new user/i });
    await user.click(createButton);

    // Modal should be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /create new user/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toHaveValue('AGENT');

    // Click "Cancel" to close
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Form Client-Side Validation
  // ---------------------------------------------------------------------------
  it('should display validation errors when submitting invalid form values', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, users: mockUsers },
    });

    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    await user.click(screen.getByRole('button', { name: /create new user/i }));

    // 1. Submit empty form
    const submitButton = screen.getByRole('button', { name: /^create user$/i });
    await user.click(submitButton);

    expect(await screen.findByText(/name must be at least 3 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();

    // 2. Type invalid email pattern and short password
    await user.type(screen.getByLabelText(/full name/i), 'Ed');
    await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
    await user.type(screen.getByLabelText(/password/i), '1234');
    await user.click(submitButton);

    expect(await screen.findByText(/name must be at least 3 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // 7. Successful User Creation Flow
  // ---------------------------------------------------------------------------
  it('should successfully submit form, close modal, display success message, and refetch user list', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, users: mockUsers },
    });
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        user: {
          id: 'usr-3',
          name: 'Sarah Connor',
          email: 'sarah@example.com',
          role: 'AGENT',
          createdAt: new Date().toISOString(),
        },
      },
    });

    const user = userEvent.setup();
    renderWithQuery(<UsersPage />);

    // Open modal
    await user.click(screen.getByRole('button', { name: /create new user/i }));

    // Fill in valid details
    await user.type(screen.getByLabelText(/full name/i), 'Sarah Connor');
    await user.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');

    // Submit
    const submitButton = screen.getByRole('button', { name: /^create user$/i });
    await user.click(submitButton);

    // Verify API called with payload
    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/users', {
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        password: 'SecurePass123!',
        role: 'AGENT',
      });
    });

    // Modal closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Success banner displayed
    expect(
      await screen.findByText(/user "sarah connor" was created successfully!/i)
    ).toBeInTheDocument();

    // Query invalidated & refetched
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  // ---------------------------------------------------------------------------
  // 8. Server Error Handling on Creation
  // ---------------------------------------------------------------------------
  it('should display server error message in modal when user creation fails', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: { success: true, users: mockUsers },
    });
    
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

    const submitButton = screen.getByRole('button', { name: /^create user$/i });
    await user.click(submitButton);

    // Modal should remain open and display the conflict error
    expect(
      await screen.findByText(/a user with email sarah@example\.com already exists\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
