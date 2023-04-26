import type { OptionsInit, Headers } from 'got-scraping';

import type { OrgResourceId, PrjResourceId, ResResourceId, ResourceType } from '../types';

export interface ResultEntry {
  guid: string;
  name_en: string;
  name_sk: string;
  type: string;
}

export type LinkedResourceId<T extends ResourceType> = T extends 'res'
  ? ResResourceId
  : T extends 'org'
  ? OrgResourceId
  : T extends 'prj'
  ? PrjResourceId
  : never;

export interface CookieRef {
  get: () => string | null;
  set: (newVal: string | null) => void;
}

export const createCookie = (): CookieRef => {
  let cookieVal: string | null;

  return {
    get: () => cookieVal,
    set: (newVal: string | null) => {
      cookieVal = newVal;
    },
  };
};

// prettier-ignore
const searchResourceTypeData: Record<ResourceType, { pathId: string; paramId: string; resetParamId: string }> = {
  org: { pathId: 'organizations', paramId: 'organisationSearchResult', resetParamId: 'verticalOrganisationSearch' },
  prj: { pathId: 'projects', paramId: 'projectSearchResult', resetParamId: 'verticalProjectSearch' },
  res: { pathId: 'researchers', paramId: 'researcherSearchResult', resetParamId: 'verticalResearcherSearch' },
};

const createDefaultHeaders = (cookie?: string | null) => {
  const header: Headers = {
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.9,sk;q=0.8,cs;q=0.7,de;q=0.6,ko;q=0.5',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    Pragma: 'no-cache',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36', // prettier-ignore
    Cookie: cookie ?? '',
  };
  return header;
};

const makeSkCrisListingRequest = ({
  pathId,
  paramId,
  resourceId,
  searchParams,
  cookie,
}: {
  pathId: string;
  paramId: string;
  resourceId: string;
  searchParams?: Record<string, string | number>;
  cookie?: string | null;
}) => {
  // Make a request like so:
  // curl 'https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=${resourceId}' \
  // -H 'Accept: application/json, text/javascript, */*; q=0.01' \
  // -H 'Accept-Language: en-US,en;q=0.9,sk;q=0.8,cs;q=0.7,de;q=0.6,ko;q=0.5' \
  // -H 'Cache-Control: no-cache' \
  // -H 'Connection: keep-alive' \
  // -H 'Pragma: no-cache' \
  // -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36' \
  const url = new URL(`https://www.skcris.sk/portal/register-${pathId}?p_p_id=${paramId}_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=${resourceId}`); // prettier-ignore
  Object.entries(searchParams || {}).forEach(([key, val]) =>
    url.searchParams.set(key, val.toString())
  );
  const req: OptionsInit = {
    url: url.href,
    headers: createDefaultHeaders(cookie),
  };
  return req;
};

export const makeListingCountGetRequest = ({
  resourceType,
  cookie,
}: {
  resourceType: ResourceType;
  cookie: string | null;
}) => {
  const { pathId, paramId } = searchResourceTypeData[resourceType];
  // Make request to 'https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=readSearchCount'
  return makeSkCrisListingRequest({ pathId, paramId, resourceId: 'readSearchCount', cookie }); // prettier-ignore
};

export const makeListingFilterRegionGetOptionsRequest = ({
  resourceType,
}: {
  resourceType: ResourceType;
}) => {
  const { pathId } = searchResourceTypeData[resourceType];
  // Make request to 'https://www.skcris.sk/portal/register-researchers?p_p_id=fazetSelectTreeSearch_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=selectKrajAjax'
  return makeSkCrisListingRequest({ pathId, paramId: 'fazetSelectTreeSearch', resourceId: 'selectKrajAjax' }); // prettier-ignore
};

export const makeListingFilterRegionSelectRequest = ({
  resourceType,
  cookie,
  regionId,
}: {
  resourceType: ResourceType;
  cookie: string | null;
  regionId: number;
}) => {
  const { pathId } = searchResourceTypeData[resourceType];
  // Make request to 'https://www.skcris.sk/portal/register-researchers?p_p_id=fazetSelectTreeSearch_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=selectOkresAjax&id=${krajId}'
  return makeSkCrisListingRequest({
    pathId,
    paramId: 'fazetSelectTreeSearch',
    resourceId: 'selectOkresAjax',
    cookie,
    searchParams: { id: regionId },
  });
};

export const makeListingFilterLetterSelectRequest = ({
  resourceType,
  cookie,
  char,
}: {
  resourceType: ResourceType;
  cookie: string | null;
  char: string;
}) => {
  const { pathId, paramId } = searchResourceTypeData[resourceType];
  const normChar = char.toLocaleLowerCase().slice(0, 1);
  if (!normChar) throw Error('Cannot make LetterSelect request - no char selected');

  // Make request to 'https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=selectNamestartAjax&ch=${char}'
  return makeSkCrisListingRequest({ pathId, paramId, resourceId: 'selectNamestartAjax', cookie, searchParams: { ch: normChar } }); // prettier-ignore
};

export const makeListingFilterResetRequest = ({
  resourceType,
  cookie,
}: {
  resourceType: ResourceType;
  cookie: string | null;
}) => {
  const { pathId, resetParamId } = searchResourceTypeData[resourceType];
  // Make request to 'https://www.skcris.sk/portal/register-researchers?p_p_id=verticalResearcherSearch_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_verticalResearcherSearch_WAR_cvtiappweb_javax.portlet.action=reseta'
  const url = new URL(`https://www.skcris.sk/portal/register-${pathId}?p_p_id=${resetParamId}_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_${resetParamId}_WAR_cvtiappweb_javax.portlet.action=reseta`); // prettier-ignore
  const req: OptionsInit = {
    url: url.href,
    headers: createDefaultHeaders(cookie),
  };
  return req;
};

export const makeListingResultsGetRequest = ({
  resourceType,
  cookie,
  page,
  perPage = 500,
}: {
  resourceType: ResourceType;
  cookie: string | null;
  page: number;
  perPage?: number;
}) => {
  const { pathId, paramId } = searchResourceTypeData[resourceType];
  // Make request to 'https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=readSearchResult&page=1&perPage=500'
  //   -   10 entries take about 4s
  //   -  500 entries take about 15s (13x faster) and payload has 105kb.
  //   - 1000 entries take about 25s (16x faster) and payload has 210kb.
  //   - See this for measuring curl requests https://stackoverflow.com/questions/18215389
  return makeSkCrisListingRequest({ pathId, paramId, resourceId: 'readSearchResult', cookie, searchParams: { page, perPage } }); // prettier-ignore
};

export const makeDetailLinkedResourceGetRequest = <T extends ResourceType>({
  resourceType,
  resourceId,
  cookie,
  page,
  perPage = 500,
}: {
  resourceType: T;
  resourceId: LinkedResourceId<T>;
  cookie: string | null;
  page: number;
  perPage?: number;
}) => {
  const { pathId, paramId } = searchResourceTypeData[resourceType];
  // Make request to 'https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=goresprojectlist&page=1&perPage=10'
  return makeSkCrisListingRequest({ pathId, paramId, resourceId, cookie, searchParams: { page, perPage } }); // prettier-ignore
};

export const makeSkCrisDetailRequest = ({
  resourceType,
  guid,
}: {
  resourceType: ResourceType;
  guid: string;
}) => {
  const { pathId, paramId } = searchResourceTypeData[resourceType];
  // Project entries use diffrent command
  const detailCmd = resourceType === 'prj' ? 'projectgodetail' : 'godetail';
  // Make a request like so:
  // 'https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_researcherSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfPers_33185'
  const url = new URL(`https://www.skcris.sk/portal/register-${pathId}?p_p_id=${paramId}_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_${paramId}_WAR_cvtiappweb_javax.portlet.action=${detailCmd}&guid=${guid}`); // prettier-ignore
  return url.href;
};

export const makeSkCrisLinkedAddressRequest = ({
  resourceType,
  cookie,
}: {
  resourceType: ResourceType;
  cookie: string | null;
}) => {
  const { pathId, paramId } = searchResourceTypeData[resourceType];
  // Make a request like so:
  // 'https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=goorgaddresses&p_p_cacheability=cacheLevelPage&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_organisationSearchResult_WAR_cvtiappweb_implicitModel=true&page=1&perPage=1&_=1682507924661'
  const url = new URL(`https://www.skcris.sk/portal/register-${pathId}?p_p_id=${paramId}_WAR_cvtiappweb&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=goorgaddresses&p_p_cacheability=cacheLevelPage&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_${paramId}_WAR_cvtiappweb_implicitModel=true&page=1&perPage=1`); // prettier-ignore
  const req: OptionsInit = {
    url: url.href,
    headers: createDefaultHeaders(cookie),
  };
  return req;
};
