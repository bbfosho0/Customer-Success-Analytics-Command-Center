import { useQuery } from "@tanstack/react-query";

import type { ExpansionOpportunity } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { buildCustomerAnalyticsQuery } from "../query";
import { staticExpansionOpportunities } from "../static-data";

export function useExpansionOpportunities() {
  const query = buildCustomerAnalyticsQuery<ExpansionOpportunity[]>(
    "/api/customer-analytics/expansion-opportunities",
    staticExpansionOpportunities,
  );

  return useQuery<ExpansionOpportunity[]>({
    queryKey: queryKeys.customerAnalytics.expansion(),
    queryFn: query.queryFn,
    staleTime: query.staleTime,
  });
}
