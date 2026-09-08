import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  UserPlus,
  Users,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Pencil,
  Trash2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { type UserItem } from '@ticket-desk/core';
import { useUserForm } from '@/hooks/useUserForm';
import { UsersTable } from '@/components/UsersTable';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // TanStack Query: Fetch Users
  // -------------------------------------------------------------------------
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isFetchError,
    error: fetchErrorObj,
    refetch: refetchUsers,
    isFetching,
  } = useQuery<UserItem[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data.users || [];
    },
  });

  const fetchErrorMessage = isFetchError
    ? axios.isAxiosError(fetchErrorObj) && fetchErrorObj.response?.data?.message
      ? fetchErrorObj.response.data.message
      : (fetchErrorObj as Error)?.message || 'Failed to fetch users. Please try again.'
    : null;

  // -------------------------------------------------------------------------
  // TanStack Query: Delete User Mutation
  // -------------------------------------------------------------------------
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.delete(`/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      const deletedName = userToDelete?.name || 'User';
      setUserToDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSuccessMessage(`User "${deletedName}" was deleted successfully.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (error: any) => {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : error.message || 'Failed to delete user. Please try again.';
      setDeleteError(message);
    },
  });

  const handleOpenDeleteModal = (user: UserItem) => {
    setUserToDelete(user);
    setDeleteError(null);
  };

  const handleCloseDeleteModal = () => {
    if (!deleteUserMutation.isPending) {
      setUserToDelete(null);
      setDeleteError(null);
    }
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      setDeleteError(null);
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  // -------------------------------------------------------------------------
  // Custom Hook: useUserForm
  // -------------------------------------------------------------------------
  const {
    register,
    handleSubmit,
    reset,
    errors,
    submitError,
    setSubmitError,
    isSubmitting,
    isEditing,
    onSubmit,
  } = useUserForm({
    editingUser,
    onSuccess: (user) => {
      setIsModalOpen(false);
      const action = editingUser ? 'updated' : 'created';
      setSuccessMessage(`User "${user.name}" was ${action} successfully!`);
      setEditingUser(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    },
  });

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    reset();
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    reset();
    setSubmitError(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="w-6 h-6 text-primary" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system administrators and support desk agents
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchUsers()}
            disabled={isFetching}
            className="gap-2 text-xs"
            title="Refresh user list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenCreateModal}
            className="gap-2 font-semibold shadow-lg shadow-primary/20 text-xs sm:text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Create New User
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-3 text-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Fetch Error Alert */}
      {fetchErrorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between gap-3 text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{fetchErrorMessage}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchUsers()}
            className="text-xs"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* User List Table / States */}
      <UsersTable
        users={users}
        isLoading={isLoadingUsers}
        onCreateUserClick={handleOpenCreateModal}
        onEditUser={handleOpenEditModal}
        onDeleteUser={handleOpenDeleteModal}
      />

      {/* Create / Edit User Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            handleCloseModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
              {isEditing ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {isEditing ? 'Edit User' : 'Create New User'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEditing
                ? 'Update user details or leave password blank to retain current password.'
                : 'Enter user details to create a staff account in the database.'}
            </DialogDescription>
          </DialogHeader>

          {/* Modal Error Alert */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2.5 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Modal Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
          >
            {/* 1. Name Field (min 3 chars) */}
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Full Name</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <UserIcon className="w-4 h-4" />
                </div>
                <Input
                  id="create-name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="off"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                  className={`pl-9 ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''
                    }`}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* 2. Email Field (valid email) */}
            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email Address</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="john.doe@example.com"
                  autoComplete="off"
                  data-lpignore="true"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                  className={`pl-9 ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''
                    }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* 3. Password Field (min 8 chars if provided / optional in edit) */}
            <div className="space-y-1.5">
              <Label htmlFor="create-password">
                {isEditing ? 'Password (leave blank to keep current)' : 'Password'}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="create-password"
                  type="password"
                  placeholder={
                    isEditing
                      ? 'Leave blank to keep current password'
                      : '••••••••••••'
                  }
                  autoComplete="new-password"
                  data-lpignore="true"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                  className={`pl-9 ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''
                    }`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* 4. Role Field (defaults to AGENT) */}
            <div className="space-y-1.5">
              <Label htmlFor="create-role">Role</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <select
                  id="create-role"
                  {...register('role')}
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="AGENT">Agent (Support Desk Staff)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                </select>
              </div>
              {errors.role && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.role.message}
                </p>
              )}
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>{isEditing ? 'Saving...' : 'Creating...'}</span>
                  </>
                ) : (
                  <span>{isEditing ? 'Save Changes' : 'Create User'}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Modal */}
      <Dialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDeleteModal();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-1">
              <Trash2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Delete User
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to deactivate and remove this user? This action performs a soft deletion.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-2.5 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          )}

          {userToDelete && (
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/70 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold text-foreground">{userToDelete.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-foreground">{userToDelete.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium uppercase text-muted-foreground">{userToDelete.role}</span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDeleteModal}
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteUserMutation.isPending}
              className="font-semibold gap-2"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete User</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;

