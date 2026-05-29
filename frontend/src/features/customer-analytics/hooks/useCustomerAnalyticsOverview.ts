import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../lib/api/client";
import type { ApiValidationError, CustomerAnalyticsOverview } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { isStaticDemoMode } from "../../../lib/utils/env";
import { staticCustomerOverview } from "../static-data";

export function useCustomerAnalyticsOverview() {
  const staticMode = isStaticDemoMode();
  return useQuery<CustomerAnalyticsOverview>({
    queryKey: queryKeys.customerAnalytics.overview(),
    queryFn: ({ signal }) =>
      staticMode
        ? Promise.resolve(staticCustomerOverview)
        : apiFetch<CustomerAnalyticsOverview, ApiValidationError>("/api/customer-analytics/overview", { signal }),
    staleTime: staticMode ? Infinity : 60_000,
  });
}
