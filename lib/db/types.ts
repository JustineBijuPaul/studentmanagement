import { z } from 'zod';

export const StudentSchema = z.object({
  id: z.number().int().positive().optional(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20).optional(),
  enrollmentDate: z.string().refine((val) => {
    // Accept both ISO datetime (2022-02-08T00:00:00.000Z) and date format (2022-02-08)
    return !isNaN(Date.parse(val));
  }, { message: 'Invalid date format' }).or(z.date()),
  major: z.string().min(1, 'Major is required').max(100),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended']),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
});

export const CreateStudentSchema = StudentSchema.omit({ id: true });
export const UpdateStudentSchema = StudentSchema.partial().required({ id: true });

export type Student = z.infer<typeof StudentSchema>;
export type CreateStudent = z.infer<typeof CreateStudentSchema>;
export type UpdateStudent = z.infer<typeof UpdateStudentSchema>;
