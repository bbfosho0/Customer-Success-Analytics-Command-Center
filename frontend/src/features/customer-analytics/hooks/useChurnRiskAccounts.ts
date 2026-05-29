import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../lib/api/client";
import type { ApiValidationError, ChurnRiskAccount, ChurnRiskQuery } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { isStaticDemoMode } from "../../../lib/utils/env";
import { staticChurnRisk } from "../static-data";

export function useChurnRiskAccounts(filters: ChurnRiskQuery = {}) {
  const staticMode = isStaticDemoMode();
  return useQuery<ChurnRiskAccount[]>({
    queryKey: queryKeys.customerAnalytics.churnRisk(filters),
    queryFn: ({ signal }) =>
      staticMode
        ? Promise.resolve(staticChurnRisk)
        : apiFetch<ChurnRiskAccount[], ApiValidationError>("/api/customer-analytics/churn-risk", { query: filters, signal }),
    staleTime: staticMode ? Infinity : 60_000,
  });
}
