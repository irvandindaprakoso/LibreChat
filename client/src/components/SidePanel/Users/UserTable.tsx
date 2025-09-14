import { useState } from 'react';
import { Edit, Trash2, UserCheck, UserX, Users as UsersIcon } from 'lucide-react';
import { Button } from '@librechat/client';
import { useLocalize } from '~/hooks';
import EditUserModal from './EditUserModal';
import DeleteUserModal from './DeleteUserModal';

export interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  emailVerified: boolean;
  password?: string;
  role?: string;
  subscription?: {
    status?: string;
    plan?: string;
    billingCycle?: string;
    startedAt?: string;
    expiresAt?: string;
    isTrial?: boolean;
    trialDays?: number;
  },
  createdAt?: string;
  updatedAt?: string;
}

interface UserTableProps {
  users: User[];
  isLoading: boolean;
}

const UserTable = ({ users, isLoading }: UserTableProps) => {
  const localize = useLocalize();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : '-';
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2"></div>
          <p className="text-gray-500">{localize('com_ui_loading')}</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="text-center">
          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">{localize('com_ui_no_users_found')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
              {localize('com_ui_name')}
            </th>
            <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
              {localize('com_ui_email')}
            </th>
            <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
              {localize('com_ui_subscription_status')}
            </th>
            <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
              {localize('com_ui_status')}
            </th>
            <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700">
              {localize('com_ui_created')}
            </th>
            <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-700">
              {localize('com_ui_actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="text-white">
              <td className="border border-gray-200 px-4 py-2 font-medium">{user.name}</td>
              <td className="border border-gray-200 px-4 py-2">{user.email}</td>
              <td className="border border-gray-200 px-4 py-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.subscription?.status === 'inactive'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  <UserCheck className="h-3 w-3 mr-1" />

                  {user.subscription?.status === 'inactive' ? (
                    user.subscription?.status?.toUpperCase()
                  ) : (
                    <>
                      {user.subscription?.status?.toUpperCase()} &nbsp;|&nbsp;
                      {user.subscription?.plan?.toUpperCase() ?? '-'} &nbsp;|&nbsp;
                      <div className="inline-flex flex-col items-start space-y-1">
                        <span>
                          Active: {user.subscription?.startedAt
                            ? new Date(user.subscription.startedAt).toLocaleDateString()
                            : '-'}
                          - {user.subscription?.expiresAt
                            ? new Date(user.subscription.expiresAt).toLocaleDateString()
                            : '-'}
                        </span>
                      </div>
                    </>
                  )}
                </span>
              </td>

              <td className="border border-gray-200 px-4 py-2">
                {user.emailVerified ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <UserCheck className="h-3 w-3 mr-1" />
                    {localize('com_ui_active')}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <UserX className="h-3 w-3 mr-1" />
                    {localize('com_ui_inactive')}
                  </span>
                )}
              </td>
              <td className="border border-gray-200 px-4 py-2">{formatDate(user.createdAt)}</td>
              <td className="border border-gray-200 px-4 py-2">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={() => setEditingUser(user)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {/* <Button
                    onClick={() => setDeletingUser(user)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button> */}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
        />
      )}
    </div>
  );
};

export default UserTable;
