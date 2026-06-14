import { useQuery } from "@tanstack/react-query";

import type { ChurnRiskAccount, ChurnRiskQuery } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { buildCustomerAnalyticsQuery } from "../query";
import { staticChurnRisk } from "../static-data";

export function useChurnRiskAccounts(filters: ChurnRiskQuery = {}) {
  const query = buildCustomerAnalyticsQuery<ChurnRiskAccount[]>(
    "/api/customer-analytics/churn-risk",
    staticChurnRisk,
    filters,
  );

  return useQuery<ChurnRiskAccount[]>({
    queryKey: queryKeys.customerAnalytics.churnRisk(filters),
    queryFn: query.queryFn,
    staleTime: query.staleTime,
  });
}
