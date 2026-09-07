import { z } from 'zod';

export const userRoleEnum = z.enum(['ADMIN', 'AGENT']);
export type UserRole = z.infer<typeof userRoleEnum>;

export const createUserSchema = z.object({
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
    .trim()
    .min(8, 'Password must be at least 8 characters'),
  role: userRoleEnum.default('AGENT'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateUserFormData = CreateUserInput;

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string | Date;
  emailVerified?: boolean;
}

