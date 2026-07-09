declare module 'geoip-country' {
  interface LookupResult {
    range: [number, number];
    country: string;
    region: string;
    eu: string;
    timezone: string;
    city?: string;
    ll: [number, number];
    metro: number;
    area: number;
  }

  export function lookup(ip: string): LookupResult | null;
  export function startUpdatingData(): void;
  export function stopUpdatingData(): void;
  const _default: { lookup: typeof lookup; startUpdatingData: typeof startUpdatingData; stopUpdatingData: typeof stopUpdatingData };
  export default _default;
}
