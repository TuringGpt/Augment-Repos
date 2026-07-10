import { useQuery } from '@tanstack/react-query';
import { getAllForms } from '@/services/formService';
import type { AdminForm } from '@/services/formService';
import type { ApiError } from '@/lib/axios';
import { getUserFromToken } from '@/lib/jwt';
import { safeGetLocalStorage } from '@/lib/storage';

export const useAllForms = (options?: {
  enabled?: boolean;
}) => {
  const accessToken = safeGetLocalStorage('access_token');
  const user = getUserFromToken();
  const userId = typeof user?.sub === 'string' && user.sub.trim() !== ''
    ? user.sub.trim()
    : accessToken
      ? 'authenticated'
      : undefined;

  const isEnabled = options?.enabled !== false && !!accessToken;

  const queryResult = useQuery<AdminForm[], ApiError>({
    queryKey: ['allForms', userId],
    queryFn: ({ signal }) => getAllForms(signal),
    enabled: isEnabled,
  });

  return {
    ...queryResult,
    isUnauthenticated: !accessToken,
  };
};