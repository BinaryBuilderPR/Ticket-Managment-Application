import { useState, useEffect } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient } from '@/lib/api-client';
import {
  createUserSchema,
  updateUserSchema,
  type UpdateUserFormData,
  type UserItem,
} from '@ticket-desk/core';

export interface UseUserFormOptions {
  editingUser?: UserItem | null;
  onSuccess?: (user: { id?: string; name: string; email: string; role: 'ADMIN' | 'AGENT' }) => void;
  onError?: (errorMessage: string) => void;
}

export interface UseUserFormReturn {
  form: UseFormReturn<UpdateUserFormData>;
  register: UseFormReturn<UpdateUserFormData>['register'];
  handleSubmit: UseFormReturn<UpdateUserFormData>['handleSubmit'];
  reset: UseFormReturn<UpdateUserFormData>['reset'];
  setValue: UseFormReturn<UpdateUserFormData>['setValue'];
  errors: UseFormReturn<UpdateUserFormData>['formState']['errors'];
  submitError: string | null;
  setSubmitError: (error: string | null) => void;
  isSubmitting: boolean;
  isEditing: boolean;
  onSubmit: (data: UpdateUserFormData) => void;
  userMutation: UseMutationResult<any, Error, UpdateUserFormData>;
}

export const useUserForm = (options?: UseUserFormOptions): UseUserFormReturn => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditing = Boolean(options?.editingUser);

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema) as any,
    defaultValues: {
      name: options?.editingUser?.name || '',
      email: options?.editingUser?.email || '',
      password: '',
      role: options?.editingUser?.role || 'AGENT',
    },
  });

  // Keep form in sync when editingUser changes
  useEffect(() => {
    if (options?.editingUser) {
      form.reset({
        name: options.editingUser.name,
        email: options.editingUser.email,
        password: '',
        role: options.editingUser.role,
      });
    } else {
      form.reset({
        name: '',
        email: '',
        password: '',
        role: 'AGENT',
      });
    }
    setSubmitError(null);
  }, [options?.editingUser, form]);

  const userMutation = useMutation({
    mutationFn: async (formData: UpdateUserFormData) => {
      if (options?.editingUser) {
        const res = await apiClient.patch(`/users/${options.editingUser.id}`, formData);
        return res.data;
      }
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

  const onSubmit = (data: UpdateUserFormData) => {
    setSubmitError(null);
    userMutation.mutate(data);
  };

  return {
    form,
    register: form.register,
    handleSubmit: form.handleSubmit,
    reset: form.reset,
    setValue: form.setValue,
    errors: form.formState.errors,
    submitError,
    setSubmitError,
    isSubmitting: userMutation.isPending,
    isEditing,
    onSubmit,
    userMutation,
  };
};

export default useUserForm;

