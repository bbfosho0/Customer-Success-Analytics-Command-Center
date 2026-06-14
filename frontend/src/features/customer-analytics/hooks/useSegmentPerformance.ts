import { useQuery } from "@tanstack/react-query";

import type { SegmentPerformance } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { buildCustomerAnalyticsQuery } from "../query";
import { staticSegments } from "../static-data";

export function useSegmentPerformance() {
  const query = buildCustomerAnalyticsQuery<SegmentPerformance[]>(
    "/api/customer-analytics/segments",
    staticSegments,
  );

  return useQuery<SegmentPerformance[]>({
    queryKey: queryKeys.customerAnalytics.segments(),
    queryFn: query.queryFn,
    staleTime: query.staleTime,
  });
}
