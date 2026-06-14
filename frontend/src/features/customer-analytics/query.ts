import { apiFetch, type QueryParams } from "../../lib/api/client";
import type { ApiValidationError } from "../../lib/api/types";
import { isStaticDemoMode } from "../../lib/utils/env";

type QueryArgs = {
  signal: AbortSignal;
};

type CustomerAnalyticsQueryConfig<TResponse> = {
  queryFn: (args: QueryArgs) => Promise<TResponse>;
  staleTime: number;
};

export function buildCustomerAnalyticsQuery<TResponse>(
  path: string,
  staticValue: TResponse,
  query?: QueryParams,
): CustomerAnalyticsQueryConfig<TResponse> {
  const staticMode = isStaticDemoMode();

  return {
    queryFn: ({ signal }: QueryArgs) =>
      staticMode
        ? Promise.resolve(staticValue)
        : apiFetch<TResponse, ApiValidationError>(path, { query, signal }),
    staleTime: staticMode ? Infinity : 60_000,
  };
}
