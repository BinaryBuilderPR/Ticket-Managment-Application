import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Calendar,
  RefreshCw,
} from 'lucide-react';

import { apiClient } from '@/lib/api-client';
import axios from 'axios';

const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Name must be at least 3 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT';
  createdAt: string;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      setFetchError(null);
      const res = await apiClient.get('/users');
      setUsers(res.data.users || []);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch users. Please try again.';
      setFetchError(errorMsg);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = () => {
    reset();
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset();
    setSubmitError(null);
  };

  const onSubmit = async (data: CreateUserFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await apiClient.post('/users', data);

      // Success
      setIsModalOpen(false);
      reset();
      setSuccessMessage(`User "${data.name}" was created successfully!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      await fetchUsers();
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setSubmitError(error.response.data.message);
      } else {
        setSubmitError(error.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
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

        {/* Buttons above the user list */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoadingUsers}
            className="gap-2 text-xs"
            title="Refresh user list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleOpenModal}
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

      {/* Error Alert */}
      {fetchError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between gap-3 text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} className="text-xs">
            Try Again
          </Button>
        </div>
      )}

      {/* User List Table / States */}
      {isLoadingUsers ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <Card className="p-12 text-center space-y-4 border-dashed border-border/80">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">No users found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Get started by creating the first support agent user using the button above.
            </p>
          </div>
          <Button onClick={handleOpenModal} variant="outline" className="gap-2 text-xs">
            <UserPlus className="w-3.5 h-3.5" />
            Create User
          </Button>
        </Card>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xl">
          <Table>
            <TableHeader className="bg-secondary/40">
              <TableRow>
                <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">
                  Name
                </TableHead>
                <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">
                  Email
                </TableHead>
                <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">
                  Role
                </TableHead>
                <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">
                  Created
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell className="px-6 py-4 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-foreground font-semibold text-xs border border-border/80">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-foreground">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={u.role === 'ADMIN' ? 'admin' : 'agent'}
                      className="text-[10px] uppercase gap-1"
                    >
                      {u.role === 'ADMIN' && <ShieldCheck className="w-3 h-3" />}
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span>
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create User Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
              <UserPlus className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Create New User
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter user details to create a staff account in the database.
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
                  {...register('name')}
                  className={`pl-9 ${
                    errors.name ? 'border-destructive focus-visible:ring-destructive' : ''
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
                  {...register('email')}
                  className={`pl-9 ${
                    errors.email ? 'border-destructive focus-visible:ring-destructive' : ''
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

            {/* 3. Password Field (min 8 chars) */}
            <div className="space-y-1.5">
              <Label htmlFor="create-password">Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  data-lpignore="true"
                  {...register('password')}
                  className={`pl-9 ${
                    errors.password ? 'border-destructive focus-visible:ring-destructive' : ''
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

            <DialogFooter className="pt-3 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-semibold">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create User</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
