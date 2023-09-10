import type { Log } from 'crawlee';
import type { PrivacyMask } from 'crawlee-one';
import { Portadom, cheerioPortadom } from 'portadom';
import type { Response as GotResponse } from 'got-scraping';
import type { IncomingMessage } from 'http';

import {
  ResourceType,
  ORG_RESOURCE,
  RES_RESOURCE,
  PRJ_RESOURCE,
  DetailedSkCrisOrgItem,
  DetailedSkCrisResItem,
  DetailedSkCrisPrjItem,
  HandlerContext,
} from './types';
import { SkCrisListingPageContext, listingPageActions } from './pageActions/listing';
import { CookieRef, createCookie } from './api/skcris';
import { SkCrisDetailPageContext, detailDOMActions, detailPageActions } from './pageActions/detail';
import { regionFilterNames } from './constants';
import type { ActorInput } from './config';
import {
  skcrisLabel,
  skcrisLabelEnum,
  skcrisRoute,
  skcrisRouteHandler,
} from './__generated__/crawler';

interface RouteData {
  listingLabel: skcrisLabelEnum;
  detailLabel: skcrisLabelEnum;
  path: string;
  domExtractor: (input: { dom: Portadom<any, any>; log: Log }) => object;
  linkedResourceFetcher: (args: SkCrisDetailPageContext) => Promise<Record<string, unknown>>;
  privacyMask: PrivacyMask<any>;
}

const routeDataByType = {
  // Example https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_organisationSearchResult_WAR_cvtiappweb_javax.portlet.action=organizationgodetail&guid=cfOrg_4328&lang=sk_SK
  org: {
    listingLabel: skcrisLabelEnum.orgListing,
    detailLabel: skcrisLabelEnum.orgDetail,
    path: '/register-organizations',
    domExtractor: detailDOMActions.extractOrgDetail,
    linkedResourceFetcher: (ctx) =>
      detailPageActions.fetchLinkedResourcesForResourceType('org', ORG_RESOURCE, ctx),
    privacyMask: {
      email: () => true,
      phone: () => true,
      researchers: () => true,
    } satisfies PrivacyMask<DetailedSkCrisOrgItem>,
  },
  // Example https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_researcherSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfPers_669&lang=sk
  res: {
    listingLabel: skcrisLabelEnum.resListing,
    detailLabel: skcrisLabelEnum.resDetail,
    path: '/register-researchers',
    domExtractor: detailDOMActions.extractResDetail,
    linkedResourceFetcher: (ctx) =>
      detailPageActions.fetchLinkedResourcesForResourceType('res', RES_RESOURCE, ctx),
    privacyMask: {
      guid: () => true,
      url: () => true,
      fullName: () => true,
      email: () => true,
    } satisfies PrivacyMask<DetailedSkCrisResItem>,
  },
  // Example https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_javax.portlet.action=projectgodetail&guid=cfProj_20239&lang=sk_SK
  prj: {
    listingLabel: skcrisLabelEnum.prjListing,
    detailLabel: skcrisLabelEnum.prjDetail,
    path: '/register-projects',
    domExtractor: detailDOMActions.extractPrjDetail,
    linkedResourceFetcher: (ctx) =>
      detailPageActions.fetchLinkedResourcesForResourceType('prj', PRJ_RESOURCE, ctx),
    privacyMask: {
      researchers: () => true,
    } satisfies PrivacyMask<DetailedSkCrisPrjItem>,
  },
} satisfies Record<ResourceType, RouteData>;

const getSessionCookieHeader = (res: GotResponse | IncomingMessage) => {
  // eg "JSESSIONID=860f4331294630b929871b06d5c6; Path=/portal; Secure"
  const jsessionSetCookie = res.headers['set-cookie']?.filter((cookie) => cookie.startsWith('JSESSIONID='))[0]; // prettier-ignore
  const jsessionId = jsessionSetCookie?.split(';')[0];
  return jsessionId;
};

// Abstract away REST interaction with the server + cookie mgmt
const createFetchFn = (ctx: HandlerContext, cookie: CookieRef) => {
  const { log, sendRequest } = ctx;

  const fetchFn: SkCrisListingPageContext['onFetchReq'] = async (
    req,
    { saveCookie, json = true } = {}
  ) => {
    log.debug(`Fetching URL ${req.url}`);
    const res = await sendRequest(req);
    log.debug(`Done fetching URL ${req.url}`);

    const data = json ? JSON.parse(res.body) : res.body;
    const jsessionId = getSessionCookieHeader(res);
    log.debug(`jsessionId from response: ${jsessionId}`);

    if (saveCookie && jsessionId) {
      log.debug(`Setting cookie to ${jsessionId}`);
      cookie.set(jsessionId ?? null);
    }
    return data;
  };
  return fetchFn;
};

// All resource types use the same listing handler
const createListingHandler = (resourceType: ResourceType, detailLabel: skcrisLabel) => {
  const handler: skcrisRouteHandler<ActorInput> = async (ctx) => {
    const { actor, log, request, response, pushRequests } = ctx;
    const url = request.loadedUrl || request.url;

    const {
      listingFilterRegion,
      listingFilterFirstLetter,
      outputMaxEntries,
      listingCountOnly,
      listingItemsPerPage,
    } = actor.input ?? {};

    // Use the session ID we were given in response to be within the correct context
    // while we set filters.
    const cookie = createCookie();
    const jsessionId = getSessionCookieHeader(response) ?? null;
    log.debug(`Setting cookie to ${jsessionId}`);
    cookie.set(jsessionId);

    await listingPageActions.scrapeUrls({
      resourceType: resourceType as ResourceType,
      cookie,
      url,
      log,
      perPage: listingItemsPerPage,
      listingCountOnly,
      onFetchReq: createFetchFn(ctx, cookie),
      optionFilter: {
        region: listingFilterRegion ? ((reg) => reg.name === regionFilterNames[listingFilterRegion]) : undefined, // prettier-ignore
        letter: listingFilterFirstLetter ? ((letter) => letter.toLocaleLowerCase() === listingFilterFirstLetter.toLocaleLowerCase()) : undefined, // prettier-ignore
      },
      onEntries: async ({ context, abort }, entries) => {
        // Schedule the entry URLs for scraping
        const reqs = entries.map((url) => ({ url, label: detailLabel }));
        log.info(`Scheduling ${reqs.length} entry URLs for scraping`);
        await pushRequests(reqs);
        log.debug(`Done scheduling ${reqs.length} entry URLs for scraping`);

        // Do not go to next page if we've reached the max count
        if (outputMaxEntries != null) {
          const entriesTotal = context.page * context.perPage;
          if (entriesTotal >= outputMaxEntries) {
            log.info(`Reached the max limit of entries (${outputMaxEntries}). Stopping listing scraping`); // prettier-ignore
            abort();
          }
        }
      },
    });
  };
  return handler;
};

// All resource types use the same detail handler
const createDetailHandler = (
  resourceType: ResourceType,
  {
    domExtractor,
    linkedResourceFetcher,
    privacyMask,
  }: Pick<RouteData, 'domExtractor' | 'linkedResourceFetcher' | 'privacyMask'>
) => {
  const handler: skcrisRouteHandler<ActorInput> = async (ctx) => {
    const { log, request, response, $, actor, pushData } = ctx;
    const { entryIncludeLinkedResources } = actor.input ?? {};

    const url = request.loadedUrl || request.url;
    const rootEl = $.root();
    const dom = cheerioPortadom(rootEl, url);
    const entryFromPage = await domExtractor({ dom, log });

    // Use the session ID we were given in response to be within the correct context
    // while we fetch linked resources.
    const cookie = createCookie();
    const jsessionId = getSessionCookieHeader(response) ?? null;
    log.debug(`Setting cookie to ${jsessionId}`);
    cookie.set(jsessionId);

    let linkedResources = {};
    if (entryIncludeLinkedResources) {
      log.info(`Fetching linked resources`);
      linkedResources = await linkedResourceFetcher({
        resourceType,
        cookie,
        page: 1,
        perPage: 500,
        log,
        onFetchReq: createFetchFn(ctx, cookie),
      });
      log.info(`Done fetching linked resources`);
    }

    const entry = { ...entryFromPage, ...linkedResources };
    await pushData(entry, {
      includeMetadata: true,
      privacyMask: privacyMask as PrivacyMask<any>,
    });
  };
  return handler;
};

export const routes = Object.entries(routeDataByType).reduce<Record<skcrisLabel, skcrisRoute>>(
  (agg, [key, config]) => {
    const { detailLabel, listingLabel, path } = config;

    // Eg https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_researcherSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfPers_43861
    agg[detailLabel] = {
      match: (url) => url.includes(path) && url.includes('godetail'),
      handler: createDetailHandler(key as ResourceType, config),
    };
    agg[listingLabel] = {
      // Eg https://www.skcris.sk/portal/web/guest/register-researchers
      match: (url) => url.includes(path) && !url.includes('godetail'),
      handler: createListingHandler(key as ResourceType, detailLabel),
    };
    return agg;
  },
  {} as any
);
