'use client';

import { Student, CreateStudent } from '@/lib/db/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateStudentSchema } from '@/lib/db/types';
import { useState } from 'react';

interface StudentFormProps {
  student?: Student | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StudentForm({ student, onSuccess, onCancel }: StudentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateStudent>({
    resolver: zodResolver(CreateStudentSchema),
    defaultValues: student
      ? {
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          enrollmentDate: new Date(student.enrollmentDate).toISOString().split('T')[0],
          major: student.major,
          status: student.status,
          graduationYear: student.graduationYear,
        }
      : {
          status: 'active',
          enrollmentDate: new Date().toISOString().split('T')[0],
        },
  });

  const onSubmit = async (data: CreateStudent) => {
    setIsSubmitting(true);
    setError('');

    try {
      const url = student ? `/api/students/${student.id}` : '/api/students';
      const method = student ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to save student');
      }
    } catch (err) {
      setError('An error occurred while saving the student');
      console.error('Error saving student:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {student ? 'Edit Student' : 'Add New Student'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('firstName')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                {...register('phone')}
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Major <span className="text-red-500">*</span>
              </label>
              <input
                {...register('major')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              {errors.major && (
                <p className="text-red-500 text-sm mt-1">{errors.major.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Enrollment Date <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('enrollmentDate')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.enrollmentDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.enrollmentDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Graduation Year</label>
                <input
                  {...register('graduationYear', { valueAsNumber: true })}
                  type="number"
                  min="2000"
                  max="2100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.graduationYear && (
                  <p className="text-red-500 text-sm mt-1">{errors.graduationYear.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
                <option value="suspended">Suspended</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
