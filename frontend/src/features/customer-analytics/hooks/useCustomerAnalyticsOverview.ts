import { useQuery } from "@tanstack/react-query";

import type { CustomerAnalyticsOverview } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { buildCustomerAnalyticsQuery } from "../query";
import { staticCustomerOverview } from "../static-data";

export function useCustomerAnalyticsOverview() {
  const query = buildCustomerAnalyticsQuery<CustomerAnalyticsOverview>(
    "/api/customer-analytics/overview",
    staticCustomerOverview,
  );

  return useQuery<CustomerAnalyticsOverview>({
    queryKey: queryKeys.customerAnalytics.overview(),
    queryFn: query.queryFn,
    staleTime: query.staleTime,
  });
}
