import type { CheerioCrawlingContext, CrawlingContext, Log } from 'crawlee';
import {
  createCheerioRouteMatchers,
  cheerioDOMLib,
  RouteHandler,
  DOMLib,
  PrivacyMask,
  ActorRouterContext,
} from 'crawlee-one';
import type { Response as GotResponse } from 'got-scraping';
import type { IncomingMessage } from 'http';

import {
  RouteLabel,
  ResourceType,
  ORG_RESOURCE,
  RES_RESOURCE,
  PRJ_RESOURCE,
  DetailedSkCrisOrgItem,
  DetailedSkCrisResItem,
  DetailedSkCrisPrjItem,
} from './types';
import { SkCrisListingPageContext, listingPageActions } from './pageActions/listing';
import { CookieRef, createCookie } from './api/skcris';
import { SkCrisDetailPageContext, detailDOMActions, detailPageActions } from './pageActions/detail';
import { regionFilterNames } from './constants';
import type { ActorInput } from './config';

type SkCrisRouterContext = ActorRouterContext<
  CheerioCrawlingContext<any, any>,
  RouteLabel,
  ActorInput
>;

interface RouteData {
  listingLabel: RouteLabel;
  detailLabel: RouteLabel;
  path: string;
  domExtractor: (input: { domLib: DOMLib<any, any>; log: Log }) => object;
  linkedResourceFetcher: (
    context: Omit<SkCrisDetailPageContext, 'resourceType'> & { log: Log }
  ) => Promise<Record<string, unknown>>;
  privacyMask: PrivacyMask<any>;
}

const routeDataByType = {
  // Example https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_organisationSearchResult_WAR_cvtiappweb_javax.portlet.action=organizationgodetail&guid=cfOrg_4328&lang=sk_SK
  org: {
    listingLabel: 'ORG_LISTING',
    detailLabel: 'ORG_DETAIL',
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
    listingLabel: 'RES_LISTING',
    detailLabel: 'RES_DETAIL',
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
    listingLabel: 'PRJ_LISTING',
    detailLabel: 'PRJ_DETAIL',
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
const createFetchFn = (ctx: CrawlingContext, cookie: CookieRef) => {
  const fetchFn: SkCrisListingPageContext['onFetchReq'] = async (
    req,
    { saveCookie, json = true } = {}
  ) => {
    ctx.log.debug(`Fetching URL ${req.url}`);
    const res = await ctx.sendRequest(req);
    ctx.log.debug(`Done fetching URL ${req.url}`);

    const data = json ? JSON.parse(res.body) : res.body;
    const jsessionId = getSessionCookieHeader(res);
    ctx.log.debug(`jsessionId from response: ${jsessionId}`);
    if (saveCookie && jsessionId) {
      ctx.log.debug(`Setting cookie to ${jsessionId}`);
      cookie.set(jsessionId ?? null);
    }

    return data;
  };
  return fetchFn;
};

export const routes = Object.values(routeDataByType)
  .map(({ listingLabel, detailLabel, path }) =>
    createCheerioRouteMatchers<CheerioCrawlingContext, SkCrisRouterContext, RouteLabel>([
      {
        name: detailLabel,
        handlerLabel: detailLabel,
        // Eg https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_researcherSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfPers_43861
        match: (url) => url.includes(path) && url.includes('godetail'),
      },
      {
        name: listingLabel,
        handlerLabel: listingLabel,
        // Eg https://www.skcris.sk/portal/web/guest/register-researchers
        match: (url) => url.includes(path) && !url.includes('godetail'),
      },
    ])
  )
  .flat(1);

export const createHandlers = <Ctx extends CheerioCrawlingContext>(input: ActorInput) => {
  const {
    listingFilterRegion,
    listingFilterFirstLetter,
    entryIncludeLinkedResources,
    outputMaxEntries,
    listingCountOnly,
    listingItemsPerPage,
  } = input;

  return Object.entries(routeDataByType).reduce<
    Record<RouteLabel, RouteHandler<Ctx, SkCrisRouterContext>>
  >(
    (
      handlers,
      [resourceType, { listingLabel, detailLabel, domExtractor, linkedResourceFetcher, privacyMask }] // prettier-ignore
    ) => {
      // Configure listing handlers for all resource types
      handlers[listingLabel] = async (ctx) => {
        const url = ctx.request.loadedUrl || ctx.request.url;

        // Use the session ID we were given in response to be within the correct context
        // while we set filters.
        const cookie = createCookie();
        const jsessionId = getSessionCookieHeader(ctx.response) ?? null;
        ctx.log.debug(`Setting cookie to ${jsessionId}`);
        cookie.set(jsessionId);

        await listingPageActions.scrapeUrls({
          resourceType: resourceType as ResourceType,
          cookie,
          url,
          log: ctx.log,
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
            ctx.log.info(`Scheduling ${reqs.length} entry URLs for scraping`);
            await ctx.actor.pushRequests(reqs);
            ctx.log.debug(`Done scheduling ${reqs.length} entry URLs for scraping`);

            // Do not go to next page if we've reached the max count
            if (outputMaxEntries != null) {
              const entriesTotal = context.page * context.perPage;
              if (entriesTotal >= outputMaxEntries) {
                ctx.log.info(`Reached the max limit of entries (${outputMaxEntries}). Stopping listing scraping`); // prettier-ignore
                abort();
              }
            }
          },
        });
      };

      // Configure detail handlers for all resource types
      handlers[detailLabel] = async (ctx) => {
        const url = ctx.request.loadedUrl || ctx.request.url;
        const rootEl = ctx.$.root();
        const domLib = cheerioDOMLib(rootEl, url);
        const entryFromPage = await domExtractor({ domLib, log: ctx.log });

        // Use the session ID we were given in response to be within the correct context
        // while we fetch linked resources.
        const cookie = createCookie();
        const jsessionId = getSessionCookieHeader(ctx.response) ?? null;
        ctx.log.debug(`Setting cookie to ${jsessionId}`);
        cookie.set(jsessionId);

        let linkedResources = {};
        if (entryIncludeLinkedResources) {
          ctx.log.info(`Fetching linked resources`);
          linkedResources = await linkedResourceFetcher({
            cookie,
            page: 1,
            perPage: 500,
            log: ctx.log,
            onFetchReq: createFetchFn(ctx, cookie),
          });
          ctx.log.info(`Done fetching linked resources`);
        }

        const entry = { ...entryFromPage, ...linkedResources };
        await ctx.actor.pushData(entry, ctx, {
          includeMetadata: true,
          privacyMask: privacyMask as PrivacyMask<any>,
        });
      };

      return handlers;
    },
    {} as any
  );
};
