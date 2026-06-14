import { useQuery } from "@tanstack/react-query";

import type { CustomerHealthScore } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { buildCustomerAnalyticsQuery } from "../query";
import { staticCustomerHealth } from "../static-data";

export function useCustomerHealth() {
  const query = buildCustomerAnalyticsQuery<CustomerHealthScore[]>(
    "/api/customer-analytics/health",
    staticCustomerHealth,
  );

  return useQuery<CustomerHealthScore[]>({
    queryKey: queryKeys.customerAnalytics.health(),
    queryFn: query.queryFn,
    staleTime: query.staleTime,
  });
}
