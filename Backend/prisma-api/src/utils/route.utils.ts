export const readRouteParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : (value ?? '');
