import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { useDeleteUser } from '~/data-provider';
import { User } from './UserTable';

interface DeleteUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

const DeleteUserModal = ({ user, isOpen, onClose }: DeleteUserModalProps) => {
  const localize = useLocalize();
  const deleteUserMutation = useDeleteUser({
    onSuccess: () => {
      onClose();
    },
  });

  const handleDelete = () => {
    deleteUserMutation.mutate({ userId: user._id });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-600">
              {localize('com_ui_delete_user')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            {localize('com_ui_delete_user_warning')}
          </p>
          
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">
                {localize('com_ui_user_to_delete')}:
              </span>
            </div>
            <div className="text-sm text-red-700">
              <p><strong>{localize('com_ui_username')}:</strong> {user.username}</p>
              <p><strong>{localize('com_ui_email')}:</strong> {user.email}</p>
            </div>
          </div>
        </div>

        {deleteUserMutation.error && (
          <div className="rounded-md bg-red-50 p-3 mb-4">
            <p className="text-sm text-red-800">
              {deleteUserMutation.error.message}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {localize('com_ui_cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleteUserMutation.isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteUserMutation.isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {localize('com_ui_deleting')}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                {localize('com_ui_delete')}
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
