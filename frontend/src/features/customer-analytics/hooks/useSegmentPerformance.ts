import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../lib/api/client";
import type { ApiValidationError, SegmentPerformance } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { isStaticDemoMode } from "../../../lib/utils/env";
import { staticSegments } from "../static-data";

export function useSegmentPerformance() {
  const staticMode = isStaticDemoMode();
  return useQuery<SegmentPerformance[]>({
    queryKey: queryKeys.customerAnalytics.segments(),
    queryFn: ({ signal }) =>
      staticMode
        ? Promise.resolve(staticSegments)
        : apiFetch<SegmentPerformance[], ApiValidationError>("/api/customer-analytics/segments", { signal }),
    staleTime: staticMode ? Infinity : 60_000,
  });
}
