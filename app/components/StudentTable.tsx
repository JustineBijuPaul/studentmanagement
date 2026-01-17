'use client';

import { Student } from '@/lib/db/types';
import { useState } from 'react';
import { StudentForm } from '@/app/components/StudentForm';
import { DeleteConfirmation } from '@/app/components/DeleteConfirmation';

interface StudentTableProps {
  initialStudents: Student[];
}

export function StudentTable({ initialStudents }: StudentTableProps) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error refreshing students:', error);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await refreshStudents();
        setDeletingStudent(null);
      } else {
        alert('Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error deleting student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSuccess = async () => {
    await refreshStudents();
    setEditingStudent(null);
    setIsAddingStudent(false);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      graduated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          statusColors[status as keyof typeof statusColors] || statusColors.inactive
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Student Records Management</h1>
        <button
          onClick={() => setIsAddingStudent(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Student
        </button>
      </div>

      {students.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No students found</p>
          <button
            onClick={() => setIsAddingStudent(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first student
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Major
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Enrollment Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </div>
                      {student.phone && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {student.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {student.major}
                      </div>
                      {student.graduationYear && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Class of {student.graduationYear}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(student.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(student.enrollmentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingStudent(student)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(isAddingStudent || editingStudent) && (
        <StudentForm
          student={editingStudent}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsAddingStudent(false);
            setEditingStudent(null);
          }}
        />
      )}

      {deletingStudent && (
        <DeleteConfirmation
          studentName={`${deletingStudent.firstName} ${deletingStudent.lastName}`}
          onConfirm={() => deletingStudent.id && handleDelete(deletingStudent.id)}
          onCancel={() => setDeletingStudent(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
