import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "../../../lib/api/client";
import type { ApiValidationError, BiExport } from "../../../lib/api/types";
import { queryKeys } from "../../../lib/constants/queryKeys";
import { isStaticDemoMode } from "../../../lib/utils/env";
import { staticBiExports } from "../static-data";

export function useBiExports() {
  const staticMode = isStaticDemoMode();
  return useQuery<BiExport[]>({
    queryKey: queryKeys.customerAnalytics.biExports(),
    queryFn: ({ signal }) =>
      staticMode ? Promise.resolve(staticBiExports) : apiFetch<BiExport[], ApiValidationError>("/api/customer-analytics/bi-exports", { signal }),
    staleTime: staticMode ? Infinity : 60_000,
  });
}
