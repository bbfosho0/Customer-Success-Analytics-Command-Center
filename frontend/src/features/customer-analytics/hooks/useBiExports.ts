import { useQuery } from "@tanstack/react-query";

import type { BiExport } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { buildCustomerAnalyticsQuery } from "../query";
import { staticBiExports } from "../static-data";

export function useBiExports() {
  const query = buildCustomerAnalyticsQuery<BiExport[]>(
    "/api/customer-analytics/bi-exports",
    staticBiExports,
  );

  return useQuery<BiExport[]>({
    queryKey: queryKeys.customerAnalytics.biExports(),
    queryFn: query.queryFn,
    staleTime: query.staleTime,
  });
}
