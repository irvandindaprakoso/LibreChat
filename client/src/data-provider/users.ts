import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'librechat-data-provider';
import type {
  UseQueryOptions,
  UseMutationResult,
  QueryObserverResult,
} from '@tanstack/react-query';
import type * as t from 'librechat-data-provider';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string;
  role: string;
  provider: string;
  plugins?: string[];
  twoFactorEnabled?: boolean;
  backupCodes?: Array<{
    codeHash: string;
    used: boolean;
    usedAt: Date | null;
  }>;
  personalization?: {
    memories?: boolean;
  };
  subscription?: {
    status?: string;
    type?: string;
    expiredAt?: Date | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  name?: string;
  role?: string;
  emailVerified?: boolean;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  name?: string;
  role?: string;
  emailVerified?: boolean;
  isActive?: boolean;
}

export interface UpdateUserVars {
  userId: string;
  updates: UpdateUserData;
}

export interface DeleteUserVars {
  userId: string;
}

export const useGetUsers = (
  config?: UseQueryOptions<User[]>,
): QueryObserverResult<User[]> => {
  return useQuery<User[]>([QueryKeys.users], () => dataService.getUsers(), {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    retry: false,
    ...config,
  });
};

export const useGetUser = (
  userId: string,
  config?: UseQueryOptions<User>,
): QueryObserverResult<User> => {
  return useQuery<User>([QueryKeys.users, userId], () => dataService.getUser(userId), {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    retry: false,
    enabled: !!userId,
    ...config,
  });
};

export const useUpdateUser = (
  options?: t.MutationOptions<User, t.TError | undefined, UpdateUserVars, unknown>,
): UseMutationResult<User, t.TError | undefined, UpdateUserVars, unknown> => {
  const queryClient = useQueryClient();
  const { onMutate, onSuccess, onError } = options ?? {};

  return useMutation(
    async (variables) => {
      // Pastikan payload sudah benar
      const payload = {
        ...variables.updates,
        ...(variables.updates.subscription && {
          subscription: {
            status: variables.updates.subscription.status ?? '',
            type: variables.updates.subscription.type ?? '',
            expiredAt: variables.updates.subscription.expiredAt ?? null,
          },
        }),
      };

      return dataService.updateUser({
        userId: variables.userId,
        updates: payload,
      });
    },
    {
      onMutate: async (variables) => {
        await queryClient.cancelQueries([QueryKeys.users]);

        const previousData = queryClient.getQueryData<{ users: User[]; pagination: any }>([QueryKeys.users]);

        if (previousData) {
          queryClient.setQueryData([QueryKeys.users], {
            ...previousData,
            users: previousData.users.map((u) =>
              u._id === variables.userId ? { ...u, ...variables.updates } : u
            ),
          });
        }

        if (onMutate) {
          onMutate(variables);
        }

        return { previousData };
      },
      onError: (error, variables, context) => {
        console.error('Failed to update user:', error);

        // Rollback
        if (context?.previousData) {
          queryClient.setQueryData([QueryKeys.users], context.previousData);
        }

        if (onError) {
          onError(error, variables, context);
        }
      },
    }
  );
};


export const useDeleteUser = (
  options?: t.MutationOptions<void, t.TError | undefined, DeleteUserVars, unknown>,
): UseMutationResult<void, t.TError | undefined, DeleteUserVars, unknown> => {
  const queryClient = useQueryClient();
  const { onMutate, onSuccess, onError } = options ?? {};

  return useMutation(
    (variables) => dataService.deleteUser(variables),
    {
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries([QueryKeys.users]);
        queryClient.removeQueries([QueryKeys.users, variables.userId]);
        if (onSuccess) {
          onSuccess(data, variables, context);
        }
      },
      onError: (...args) => {
        const error = args[0];
        if (error != null) {
          console.error('Failed to delete user:', error);
        }
        if (onError) {
          onError(...args);
        }
      },
      onMutate,
    },
  );
};
