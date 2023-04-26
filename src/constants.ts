import type { DatasetType, RegionType } from './types';

export const datasetTypeToUrl: Record<DatasetType, string> = {
  researchers: 'https://www.skcris.sk/portal/web/guest/register-researchers',
  projects: 'https://www.skcris.sk/portal/web/guest/register-projects',
  organisations: 'https://www.skcris.sk/portal/web/guest/register-organizations',
  // outputs: 'https://www.skcris.sk/portal/web/guest/register-results',
};

export const regionFilterNames: Record<RegionType, string> = {
  bratislava: 'Bratislavský kraj',
  trnava: 'Trnavský kraj',
  trencin: 'Trenčiansky kraj',
  nitra: 'Nitriansky kraj',
  zilina: 'Žilinský kraj',
  banskabystrica: 'Banskobystrický kraj',
  presov: 'Prešovský kraj',
  kosice: 'Košický kraj',
  zahranicie: 'Zahraničie',
};

export const alphabet = 'abcdefghijklmnopqrstuvwxyz';
