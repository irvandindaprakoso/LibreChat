import { useState, useEffect } from 'react';
import { X, Save, User, Calendar, CreditCard } from 'lucide-react';
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
    subscriptionPlan: '',
    subscriptionBillingCycle: '',
    subscriptionStartedAt: '',
    subscriptionExpiresAt: '',
    subscriptionIsTrial: false,
    subscriptionTrialDays: 0,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        subscriptionStatus: user.subscription?.status || '',
        subscriptionPlan: user.subscription?.plan || '',
        subscriptionBillingCycle: user.subscription?.billingCycle || '',
        subscriptionStartedAt: user.subscription?.startedAt 
          ? new Date(user.subscription.startedAt).toISOString().split('T')[0]
          : '',
        subscriptionExpiresAt: user.subscription?.expiresAt
          ? new Date(user.subscription.expiresAt).toISOString().split('T')[0]
          : '',
        subscriptionIsTrial: user.subscription?.isTrial || false,
        subscriptionTrialDays: user.subscription?.trialDays || 0,
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
    
    const updates: any = {
      name: formData.name,
    };

    // Only include subscription if any subscription fields are filled
    if (formData.subscriptionStatus || formData.subscriptionPlan || 
        formData.subscriptionBillingCycle || formData.subscriptionStartedAt || 
        formData.subscriptionExpiresAt) {
      
      updates.subscription = {};
      
      if (formData.subscriptionStatus) {
        updates.subscription.status = formData.subscriptionStatus;
      }
      if (formData.subscriptionPlan) {
        updates.subscription.plan = formData.subscriptionPlan;
      }
      if (formData.subscriptionBillingCycle) {
        updates.subscription.billingCycle = formData.subscriptionBillingCycle;
      }
      if (formData.subscriptionStartedAt) {
        updates.subscription.startedAt = new Date(formData.subscriptionStartedAt);
      }
      if (formData.subscriptionExpiresAt) {
        updates.subscription.expiresAt = new Date(formData.subscriptionExpiresAt);
      }
      if (formData.subscriptionIsTrial !== undefined) {
        updates.subscription.isTrial = formData.subscriptionIsTrial;
      }
      if (formData.subscriptionTrialDays !== undefined) {
        updates.subscription.trialDays = formData.subscriptionTrialDays;
      }
    }

    updateUserMutation.mutate({
      userId: user._id,
      updates,
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
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
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

          {/* Subscription Section */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <h3 className="text-md font-medium text-gray-700">
                Subscription Details
              </h3>
            </div>

            {/* Subscription Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="subscriptionStatus"
                  value={formData.subscriptionStatus}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Subscription Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan
                </label>
                <select
                  name="subscriptionPlan"
                  value={formData.subscriptionPlan}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Plan</option>
                  <option value="Free Plan">Free Plan</option>
                  <option value="Premium Plan">Premium Plan</option>
                </select>
              </div>
            </div>

            {/* Billing Cycle */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Cycle
              </label>
              <select
                name="subscriptionBillingCycle"
                value={formData.subscriptionBillingCycle}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select Billing Cycle</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="trial">Trial</option>
                <option value="none">None</option>
              </select>
            </div>

            {/* Trial Fields */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Is Trial
                </label>
                <select
                  name="subscriptionIsTrial"
                  value={formData.subscriptionIsTrial.toString()}
                  onChange={(e) => handleChange({
                    target: { name: 'subscriptionIsTrial', value: e.target.value === 'true' }
                  } as React.ChangeEvent<HTMLSelectElement>)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trial Days
                </label>
                <input
                  type="number"
                  name="subscriptionTrialDays"
                  value={formData.subscriptionTrialDays}
                  onChange={handleChange}
                  min="0"
                  max="365"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Subscription Dates */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Started Date
                  </div>
                </label>
                <input
                  type="date"
                  name="subscriptionStartedAt"
                  value={formData.subscriptionStartedAt}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Expires Date
                  </div>
                </label>
                <input
                  type="date"
                  name="subscriptionExpiresAt"
                  value={formData.subscriptionExpiresAt}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

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
              variant="outline"
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
