import { useState } from 'react';
import { useGetUsers } from '~/data-provider';
import { Search, Users as UsersIcon } from 'lucide-react';
import UserTable from './UserTable';
import DashBreadcrumb from '~/routes/Layouts/DashBreadcrumb';
import { useLocalize } from '~/hooks';

const ListUser = () => {
  const localize = useLocalize();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users, isLoading, error } = useGetUsers();

  const filteredUsers =
    users?.users?.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium">Error loading users</p>
          <p className="text-sm text-gray-500">
            {error && typeof error === 'object' && 'message' in error
              ? (error as { message: string }).message
              : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-surface-primary p-0 lg:p-2">
          <DashBreadcrumb />
          <div className="h-auto max-w-full overflow-x-auto p-4">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-white">
                <UsersIcon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">
                  {localize('com_sidepanel_user_management')}
                </h3>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={localize('com_ui_search_users')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-10 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
              <UserTable users={filteredUsers} isLoading={isLoading} />
            </div>
          </div>
    </div>
  );
};

export default ListUser;
