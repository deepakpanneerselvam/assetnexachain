import { useMemo } from 'react';

/**
 * Custom hook to safely parse search/query parameters from window.location
 * Ensures that external tracking parameters (e.g. ?utm_source=chatgpt.com)
 * or deep links (e.g. ?tab=marketplace&asset=TXSOL1) never cause routing errors.
 */
export function useQueryParams() {
  return useMemo(() => {
    try {
      if (typeof window === 'undefined') {
        return {
          tab: null,
          assetId: null,
          utmSource: null,
          get: () => null,
          raw: {},
        };
      }

      const searchParams = new URLSearchParams(window.location.search);
      const raw: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        raw[key] = value;
      });

      return {
        tab: searchParams.get('tab'),
        assetId: searchParams.get('asset') || searchParams.get('id'),
        utmSource: searchParams.get('utm_source'),
        get: (param: string) => searchParams.get(param),
        raw,
      };
    } catch {
      return {
        tab: null,
        assetId: null,
        utmSource: null,
        get: () => null,
        raw: {},
      };
    }
  }, []);
}
