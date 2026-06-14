import { useQuery } from "@tanstack/react-query";

import type { LtvSegment } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { buildCustomerAnalyticsQuery } from "../query";
import { staticLtv } from "../static-data";

export function useLtvBySegment() {
  const query = buildCustomerAnalyticsQuery<LtvSegment[]>(
    "/api/customer-analytics/ltv",
    staticLtv,
  );

  return useQuery<LtvSegment[]>({
    queryKey: queryKeys.customerAnalytics.ltv(),
    queryFn: query.queryFn,
    staleTime: query.staleTime,
  });
}
