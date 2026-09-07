import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient } from '@/lib/api-client';
import {
  createUserSchema,
  type CreateUserFormData,
  type CreateUserInput,
} from '@ticket-desk/core';

export interface UseUserFormOptions {
  onSuccess?: (createdUser: CreateUserInput & { id?: string; name: string }) => void;
  onError?: (errorMessage: string) => void;
}

export interface UseUserFormReturn {
  form: UseFormReturn<CreateUserFormData>;
  register: UseFormReturn<CreateUserFormData>['register'];
  handleSubmit: UseFormReturn<CreateUserFormData>['handleSubmit'];
  reset: UseFormReturn<CreateUserFormData>['reset'];
  errors: UseFormReturn<CreateUserFormData>['formState']['errors'];
  submitError: string | null;
  setSubmitError: (error: string | null) => void;
  isSubmitting: boolean;
  onSubmit: (data: CreateUserFormData) => void;
  createUserMutation: UseMutationResult<any, Error, CreateUserFormData>;
}

export const useUserForm = (options?: UseUserFormOptions): UseUserFormReturn => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'AGENT',
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (formData: CreateUserFormData) => {
      const res = await apiClient.post('/users', formData);
      return res.data;
    },
    onSuccess: (data, variables) => {
      form.reset();
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      options?.onSuccess?.(data?.user || variables);
    },
    onError: (error: any) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error.message || 'An unexpected error occurred.';
      setSubmitError(message);
      options?.onError?.(message);
    },
  });

  const onSubmit = (data: CreateUserFormData) => {
    setSubmitError(null);
    createUserMutation.mutate(data);
  };

  return {
    form,
    register: form.register,
    handleSubmit: form.handleSubmit,
    reset: form.reset,
    errors: form.formState.errors,
    submitError,
    setSubmitError,
    isSubmitting: createUserMutation.isPending,
    onSubmit,
    createUserMutation,
  };
};

export default useUserForm;
