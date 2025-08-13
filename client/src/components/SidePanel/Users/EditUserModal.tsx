import { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import { Button } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { useUpdateUser } from '~/data-provider';
import { User as UserType } from './UserTable';

interface EditUserModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
}

const EditUserModal = ({ user, isOpen, onClose }: EditUserModalProps) => {
  const localize = useLocalize();

  const [formData, setFormData] = useState({
    name: '',
    subscriptionStatus: '',
    subscriptionType: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        subscriptionStatus: user.subscription?.status || '',
        subscriptionType: user.subscription?.type || '',
      });
    }
  }, [user]);

  const updateUserMutation = useUpdateUser({
    onSuccess: () => {
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate({
      userId: user._id,
      updates: {
        name: formData.name,
        subscription: {
          status: formData.subscriptionStatus,
          type: formData.subscriptionType,
        },
      },
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">
              {localize('com_ui_edit_user')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {localize('com_ui_name')} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Subscription Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {localize('com_ui_subscription_status')}
            </label>
            <select
              name="subscriptionStatus"
              value={formData.subscriptionStatus}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{localize('com_ui_select')}</option>
              <option value="pro">
                {localize('com_ui_subscription_status_pro')}
              </option>
              <option value="free">
                {localize('com_ui_subscription_status_free')}
              </option>
            </select>
          </div>

          {/* Subscription Type */}
          {formData.subscriptionStatus !== 'free' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {localize('com_ui_subscription_type')}
              </label>
              <select
                name="subscriptionType"
                value={formData.subscriptionType}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">{localize('com_ui_select')}</option>
                <option value="monthly">
                  {localize('com_ui_subscription_type_monthly')}
                </option>
                <option value="yearly">
                  {localize('com_ui_subscription_type_yearly')}
                </option>
              </select>
            </div>
          )}

          {updateUserMutation.error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">
                {updateUserMutation.error.message}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {localize('com_ui_cancel')}
            </Button>
            <Button
              type="submit"
              disabled={updateUserMutation.isLoading}
              className="flex-1"
            >
              {updateUserMutation.isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  {localize('com_ui_updating')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {localize('com_ui_update')}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
