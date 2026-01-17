'use client';

interface DeleteConfirmationProps {
  studentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function DeleteConfirmation({
  studentName,
  onConfirm,
  onCancel,
  isLoading,
}: DeleteConfirmationProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Confirm Deletion
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Are you sure you want to delete the student record for{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{studentName}</span>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
