import React, { useState, useEffect } from 'react';
import { Input, Button } from '@librechat/client';
import { useSubscriptionContext } from '~/Providers/SubscriptionContext';
import { useLocalize } from '~/hooks';
import { useUpdateSubscription } from '~/data-provider';

const SubscriptionTable = () => {
  const { subscription } = useSubscriptionContext();
  const localize = useLocalize();
  const { mutate: updateSubscription, isLoading } = useUpdateSubscription();

  const [formData, setFormData] = useState({
    title: subscription?.title || '',
    price: subscription?.price ?? 0,
    description: subscription?.description || '',
    feature: Array.isArray(subscription?.feature) ? subscription.feature : [],
  });

  useEffect(() => {
    if (subscription) {
      setFormData({
        title: subscription.title || '',
        price: subscription.price ?? 0,
        description: subscription.description || '',
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
        const updatedFeatures = [...prev.feature];
        updatedFeatures[idx] = value;
        return { ...prev, feature: updatedFeatures };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'price' ? Number(value) : value,
      }));
    }
  };

  const addFeature = () => {
    setFormData((prev) => ({
      ...prev,
      feature: [...prev.feature, ''],
    }));
  };

  const removeFeature = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      feature: prev.feature.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subscription?._id) {
      console.error('Subscription ID is missing');
      return;
    }

    updateSubscription(
      {
        id: subscription._id,
        data: {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          feature: formData.feature,
        },
      },
      {
        onSuccess: () => {
          console.log('Update berhasil!');
        },
        onError: (error) => {
          console.error('Gagal update:', error);
        },
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
      className="rounded-lg border p-4 mb-4 bg-surface-secondary shadow space-y-2"
      onSubmit={handleSubmit}
    >
      <label htmlFor="input-title">Title</label>
      <Input
        name="title"
        value={formData.title}
        onChange={handleChange}
        id="input-title"
      />

      <label htmlFor="input-price">Price</label>
      <Input
        name="price"
        type="number"
        value={formData.price}
        onChange={handleChange}
        id="input-price"
      />

      <label htmlFor="input-description">Description</label>
      <Input
        name="description"
        value={formData.description}
        onChange={handleChange}
        id="input-description"
      />

      <div className="text-sm font-medium mt-3">Features:</div>
      {formData.feature.map((feat, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <Input
            name="feature"
            value={feat}
            onChange={(e) => handleChange(e, i)}
            id={`input-feature-${i}`}
          />
          <Button
            type="button"
            variant="destructive"
            onClick={() => removeFeature(i)}
          >
            Remove
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        onClick={addFeature}
        className="mt-2"
      >
        + Add Feature
      </Button>

      <Button
        type="submit"
        className="mt-4 w-full"
        disabled={isLoading }
      >
        {isLoading  ? 'Updating...' : 'Submit'}
      </Button>
    </form>
  );
};

export default SubscriptionTable;
