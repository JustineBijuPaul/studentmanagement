import { getAllStudents } from '@/lib/db/queries';
import { StudentTable } from './components/StudentTable';
import { Student } from '@/lib/db/types';

export default async function Home() {
  let students: Student[] = [];
  let error: string | null = null;

  try {
    students = await getAllStudents();
  } catch (err) {
    console.error('Error loading students:', err);
    error = 'Failed to load students. Please check database connection.';
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Database Connection Error
            </h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <p className="text-sm text-red-500 dark:text-red-400 mt-4">
              Make sure your database is running and environment variables are configured correctly.
            </p>
          </div>
        ) : (
          <StudentTable initialStudents={students} />
        )}
      </div>
    </div>
  );
}
