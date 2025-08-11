// src/data-provider/useGetSubscriptions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { QueryKeys } from 'librechat-data-provider';

export type TSubscription = {
  _id: string;
  title: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  feature: string[];
  created_at: string;
  updated_at: string;
};

export function useGetSubscription(options = {}) {
  return useQuery<TSubscription>({
    queryKey: [QueryKeys.subscription],
    queryFn: async () => {
      const res = await fetch('/api/subscription');
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      return res.json();
    },
    ...options,
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await axios.put(`/api/subscription/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      // Refresh data setelah update
      queryClient.invalidateQueries({ queryKey: [QueryKeys.subscription] });
    },
  });
}