import { useQuery } from "@tanstack/react-query";

import type { SupportImpactRow } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { buildCustomerAnalyticsQuery } from "../query";
import { staticSupportImpact } from "../static-data";

export function useSupportImpact() {
  const query = buildCustomerAnalyticsQuery<SupportImpactRow[]>(
    "/api/customer-analytics/support-impact",
    staticSupportImpact,
  );

  return useQuery<SupportImpactRow[]>({
    queryKey: queryKeys.customerAnalytics.supportImpact(),
    queryFn: query.queryFn,
    staleTime: query.staleTime,
  });
}
