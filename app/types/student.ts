import { z } from 'zod';

// Student interface
export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  enrollmentDate: string;
  major: string;
  status: 'active' | 'inactive' | 'graduated';
  graduationYear?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Zod validation schema for creating a student
export const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number').max(20),
  enrollmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  major: z.string().min(1, 'Major is required').max(100),
  status: z.enum(['active', 'inactive', 'graduated']),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
});

// Zod validation schema for updating a student
export const updateStudentSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().regex(/^[\d\s\-\+\(\)]+$/).max(20).optional(),
  enrollmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  major: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'inactive', 'graduated']).optional(),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
});

// Type exports for form data
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
