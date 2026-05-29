import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../lib/api/client";
import type { ApiValidationError, SupportImpactRow } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { isStaticDemoMode } from "../../../lib/utils/env";

export function useSupportImpact() {
  const staticMode = isStaticDemoMode();
  return useQuery<SupportImpactRow[]>({
    queryKey: queryKeys.customerAnalytics.supportImpact(),
    queryFn: ({ signal }) =>
      staticMode
        ? Promise.resolve([])
        : apiFetch<SupportImpactRow[], ApiValidationError>("/api/customer-analytics/support-impact", { signal }),
    staleTime: staticMode ? Infinity : 60_000,
  });
}
