import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../lib/api/client";
import type { ApiValidationError, ExpansionOpportunity } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { isStaticDemoMode } from "../../../lib/utils/env";

export function useExpansionOpportunities() {
  const staticMode = isStaticDemoMode();
  return useQuery<ExpansionOpportunity[]>({
    queryKey: queryKeys.customerAnalytics.expansion(),
    queryFn: ({ signal }) =>
      staticMode
        ? Promise.resolve([])
        : apiFetch<ExpansionOpportunity[], ApiValidationError>("/api/customer-analytics/expansion-opportunities", { signal }),
    staleTime: staticMode ? Infinity : 60_000,
  });
}
