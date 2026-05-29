import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../lib/api/client";
import type { ApiValidationError, LtvSegment } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { isStaticDemoMode } from "../../../lib/utils/env";
import { staticLtv } from "../static-data";

export function useLtvBySegment() {
  const staticMode = isStaticDemoMode();
  return useQuery<LtvSegment[]>({
    queryKey: queryKeys.customerAnalytics.ltv(),
    queryFn: ({ signal }) =>
      staticMode ? Promise.resolve(staticLtv) : apiFetch<LtvSegment[], ApiValidationError>("/api/customer-analytics/ltv", { signal }),
    staleTime: staticMode ? Infinity : 60_000,
  });
}
