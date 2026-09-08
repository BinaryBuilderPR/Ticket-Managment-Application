import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { apiClient } from '@/lib/api-client';
import { createTestQueryClient } from '@/test/renderWithQuery';
import { useUserForm } from '../useUserForm';

describe('useUserForm Hook', () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default form values and idle state', () => {
    const { result } = renderHook(() => useUserForm(), {
      wrapper: createWrapper(),
    });

    expect(result.current.form.getValues()).toEqual({
      name: '',
      email: '',
      password: '',
      role: 'AGENT',
    });
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.submitError).toBeNull();
    expect(result.current.errors).toEqual({});
  });

  it('should validate and report errors for empty and invalid input values', async () => {
    const { result } = renderHook(() => useUserForm(), {
      wrapper: createWrapper(),
    });

    // Trigger validation by calling handleSubmit with dummy handler
    await act(async () => {
      await result.current.handleSubmit(() => { })();
    });

    expect(result.current.form.formState.errors.name?.message).toMatch(
      /name must be at least 3 characters/i
    );
    expect(result.current.form.formState.errors.email?.message).toMatch(
      /email is required/i
    );
    expect(result.current.form.formState.errors.password?.message).toMatch(
      /password must be at least 8 characters/i
    );
  });

  it('should successfully submit form data, trigger onSuccess, reset form, and invalidate query cache', async () => {
    const onSuccessMock = vi.fn();
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        success: true,
        user: {
          id: 'usr-10',
          name: 'Alex Vance',
          email: 'alex@example.com',
          role: 'AGENT',
        },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(
      () => useUserForm({ onSuccess: onSuccessMock }),
      { wrapper: createWrapper() }
    );

    const validData = {
      name: 'Alex Vance',
      email: 'alex@example.com',
      password: 'StrongPassword123!',
      role: 'AGENT' as const,
    };

    await act(async () => {
      result.current.onSubmit(validData);
    });

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/users', validData);
    });

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Alex Vance',
          email: 'alex@example.com',
        })
      );
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] });
    expect(result.current.submitError).toBeNull();
  });

  it('should handle backend error response and trigger onError callback', async () => {
    const onErrorMock = vi.fn();
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
        data: { message: 'A user with this email already exists.' },
      }
    );

    vi.spyOn(apiClient, 'post').mockRejectedValue(conflictError);

    const { result } = renderHook(
      () => useUserForm({ onError: onErrorMock }),
      { wrapper: createWrapper() }
    );

    const payload = {
      name: 'Alex Vance',
      email: 'alex@example.com',
      password: 'StrongPassword123!',
      role: 'AGENT' as const,
    };

    await act(async () => {
      result.current.onSubmit(payload);
    });

    await waitFor(() => {
      expect(result.current.submitError).toBe(
        'A user with this email already exists.'
      );
    });

    expect(onErrorMock).toHaveBeenCalledWith(
      'A user with this email already exists.'
    );
  });

  it('should allow clearing submit error manually', async () => {
    const { result } = renderHook(() => useUserForm(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSubmitError('Manual error');
    });

    expect(result.current.submitError).toBe('Manual error');

    act(() => {
      result.current.setSubmitError(null);
    });

    expect(result.current.submitError).toBeNull();
  });
});

