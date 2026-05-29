import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../lib/api/client";
import type { ApiValidationError, CustomerHealthScore } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { isStaticDemoMode } from "../../../lib/utils/env";

export function useCustomerHealth() {
  const staticMode = isStaticDemoMode();
  return useQuery<CustomerHealthScore[]>({
    queryKey: queryKeys.customerAnalytics.health(),
    queryFn: ({ signal }) =>
      staticMode ? Promise.resolve([]) : apiFetch<CustomerHealthScore[], ApiValidationError>("/api/customer-analytics/health", { signal }),
    staleTime: staticMode ? Infinity : 60_000,
  });
}
