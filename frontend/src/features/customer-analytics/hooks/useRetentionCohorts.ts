import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../lib/api/client";
import type { ApiValidationError, RetentionCohortRow } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { isStaticDemoMode } from "../../../lib/utils/env";
import { staticRetention } from "../static-data";

export function useRetentionCohorts() {
  const staticMode = isStaticDemoMode();
  return useQuery<RetentionCohortRow[]>({
    queryKey: queryKeys.customerAnalytics.retention(),
    queryFn: ({ signal }) =>
      staticMode
        ? Promise.resolve(staticRetention)
        : apiFetch<RetentionCohortRow[], ApiValidationError>("/api/customer-analytics/retention-cohorts", { signal }),
    staleTime: staticMode ? Infinity : 60_000,
  });
}
