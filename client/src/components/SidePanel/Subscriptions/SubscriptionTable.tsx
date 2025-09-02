import React, { useState, useEffect } from 'react';
import { Input, Button } from '@librechat/client';
import { useSubscriptionContext } from '~/Providers/SubscriptionContext';
import { useLocalize } from '~/hooks';
import { useUpdateSubscription } from '~/data-provider';

const SubscriptionTable = () => {
  const { subscription } = useSubscriptionContext();
  const localize = useLocalize();
  const { mutate: updateSubscription, isLoading } = useUpdateSubscription();

  const initialState = {
    title: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: '',
    stripePriceIdYearly: '',
    feature: [] as string[],
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (subscription) {
      setFormData({
        title: subscription.title || '',
        description: subscription.description || '',
        priceMonthly: subscription.priceMonthly ?? 0,
        priceYearly: subscription.priceYearly ?? 0,
        stripePriceIdMonthly: subscription.stripePriceIdMonthly || '',
        stripePriceIdYearly: subscription.stripePriceIdYearly || '',
        feature: Array.isArray(subscription.feature) ? subscription.feature : [],
      });
    }
  }, [subscription]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    idx?: number
  ) => {
    const { name, value } = e.target;

    if (name === 'feature' && typeof idx === 'number') {
      setFormData((prev) => {
        const updated = [...prev.feature];
        updated[idx] = value;
        return { ...prev, feature: updated };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: ['priceMonthly', 'priceYearly'].includes(name) ? Number(value) : value,
      }));
    }
  };

  const addFeature = () =>
    setFormData((prev) => ({ ...prev, feature: [...prev.feature, ''] }));

  const removeFeature = (idx: number) =>
    setFormData((prev) => ({
      ...prev,
      feature: prev.feature.filter((_, i) => i !== idx),
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription?._id) return console.error('Subscription ID missing');

    updateSubscription(
      { id: subscription._id, data: formData },
      {
        onSuccess: () => console.log('Update berhasil!'),
        onError: (err) => console.error('Gagal update:', err),
      }
    );
  };

  if (!subscription) {
    return (
      <div className="h-24 text-center text-sm text-text-secondary flex items-center justify-center">
        {localize('com_ui_no_subscriptions')}
      </div>
    );
  }

  return (
    <form
      className="rounded-lg border p-4 mb-4 bg-surface-secondary shadow space-y-3"
      onSubmit={handleSubmit}
    >
      <FormRow label="Title" name="title" value={formData.title} onChange={handleChange} />
      <FormRow label="Description" name="description" value={formData.description} onChange={handleChange} />

      <FormRow label="Price Monthly" name="priceMonthly" type="number" value={formData.priceMonthly} onChange={handleChange} />

      <FormRow label="Price Yearly" name="priceYearly" type="number" value={formData.priceYearly} onChange={handleChange} />

      <div className="text-sm font-medium mt-3">Features:</div>
      {formData.feature.map((feat, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input name="feature" value={feat} onChange={(e) => handleChange(e, i)} />
          <Button type="button" variant="destructive" onClick={() => removeFeature(i)}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={addFeature}>
        + Add Feature
      </Button>

      <Button type="submit" className="mt-4 w-full" disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Submit'}
      </Button>
    </form>
  );
};

const FormRow = ({ label, name, type = 'text', value, onChange }: any) => (
  <div>
    <label htmlFor={`input-${name}`} className="block mb-1">{label}</label>
    <Input id={`input-${name}`} name={name} type={type} value={value} onChange={onChange} />
  </div>
);

export default SubscriptionTable;
