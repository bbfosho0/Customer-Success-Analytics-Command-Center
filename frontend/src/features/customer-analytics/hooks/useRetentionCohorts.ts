import { useQuery } from "@tanstack/react-query";

import type { RetentionCohortRow } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { buildCustomerAnalyticsQuery } from "../query";
import { staticRetention } from "../static-data";

export function useRetentionCohorts() {
  const query = buildCustomerAnalyticsQuery<RetentionCohortRow[]>(
    "/api/customer-analytics/retention-cohorts",
    staticRetention,
  );

  return useQuery<RetentionCohortRow[]>({
    queryKey: queryKeys.customerAnalytics.retention(),
    queryFn: query.queryFn,
    staleTime: query.staleTime,
  });
}
