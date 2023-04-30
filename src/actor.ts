import { Actor } from 'apify';
import {
  CheerioCrawler,
  CheerioCrawlerOptions,
  CheerioCrawlingContext,
  ProxyConfiguration,
  RouterHandler,
  createCheerioRouter,
} from 'crawlee';
import {
  captureError,
  createApifyActor,
  logLevelHandlerWrapper,
  setupSentry,
} from 'apify-actor-utils';
import { omitBy } from 'lodash';
import * as Sentry from '@sentry/node';

import { ActorInput, pickCrawlerInputFields } from './config';
import type { RouteLabel } from './types';
import { stats } from './lib/stats';
import { createHandlers, routes } from './router';
import { datasetTypeToUrl } from './constants';
import { validateInput } from './validation';
import { getPackageJsonInfo } from './utils/package';

/**
 * # SKCRIS Basic Info
 *
 * ## Navigation
 * Home - https://www.skcris.sk/portal/
 * Researchers listing - https://www.skcris.sk/portal/web/guest/register-researchers?rstart=ano
 * Researcher page example - https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_researcherSearchResult_WAR_cvtiappweb_action=goorgdetail&zmaz=res&id=4328
 * Outputs listing - https://www.skcris.sk/portal/web/guest/register-results?rstart=ano
 * Output page example - https://www.skcris.sk/portal/register-results?p_p_id=vysledkySearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_vysledkySearchResult_WAR_cvtiappweb_javax.portlet.action=vysledkygodetail&guid=cfPub_6420&lang=sk_SK&type=RES_PUB
 * Organisations listing - https://www.skcris.sk/portal/web/guest/register-organizations?rstart=ano
 * Organisation page example - https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_organisationSearchResult_WAR_cvtiappweb_javax.portlet.action=organizationgodetail&guid=cfOrg_4328&lang=sk_SK
 * Projects listing - https://www.skcris.sk/portal/web/guest/register-projects?rstart=ano
 * Project page example - https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_javax.portlet.action=projectgodetail&guid=cfProj_20239&lang=sk_SK
 *
 * ## Data models
 * - Organisation
 * - Project
 * - Output
 *    - Product
 *    - Patent
 *    - Publication
 *    - Inovation
 * - Resarcher
 * - Infrastructure
 *    - Equipment
 *    - Labs
 *    - Services
 *
 * ## Relationships
 * Each of
 * Org, Project, Output, Resarcher
 * has 0-to-many relationship with ALL other data models.
 *
 * Org has relationship to itself, eg membership in other orgs
 *
 * Example:
 * Org <-(0..*)-----(0..*)-> Org
 * Org <-(0..*)-----(0..*)-> Project
 * Org <-(0..*)-----(0..*)-> Output
 * Org <-(0..*)-----(0..*)-> Researcher
 * ...
 */

// Currently outputs out of scope, but here are examples
// Additionally, all of these have links to Orgs & Projects, sometimes Researchers.
// So once we have the these three, we can derive links to the below from them.
// - Output - Product - https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_action=linkedvysledky&zmaz=proj&id=63&type=product
// - Output - Patent - https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_action=linkedvysledky&zmaz=proj&id=534&type=patent
// - Output - Innovation - https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_action=linkedvysledky&zmaz=proj&id=43&type=innovation
// - Output - Publication - https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_action=linkedvysledky&zmaz=proj&id=466560&type=publication
// - Infra - Equipment - https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_action=projlinkedinfrastr&zmaz=proj&id=4426&type=equip
// - Infra - Facility (eg Lab) - https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_action=projlinkedinfrastr&zmaz=proj&id=270&type=facil
// - Infra - Service - https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_action=projlinkedinfrastr&zmaz=proj&id=294&type=serv
// - Document - https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=downloadDocument&p_p_cacheability=cacheLevelPage&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_action=downloadDocument&_projectSearchResult_WAR_cvtiappweb_implicitModel=true&documentId=3407035

export const run = async (crawlerConfig?: CheerioCrawlerOptions): Promise<void> => {
  const pkgJson = getPackageJsonInfo(module, ['name']);
  setupSentry({ sentryOptions: { serverName: pkgJson.name } });

  // See docs:
  // - https://docs.apify.com/sdk/js/
  // - https://docs.apify.com/academy/deploying-your-code/inputs-outputs#accepting-input-with-the-apify-sdk
  // - https://docs.apify.com/sdk/js/docs/upgrading/upgrading-to-v3#apify-sdk
  await Actor.main(
    async () => {
      const actor = await createApifyActor<CheerioCrawlingContext, RouteLabel, ActorInput>({
        validateInput,
        router: createCheerioRouter(),
        routes,
        routeHandlers: ({ input }) => createHandlers(input!),
        handlerWrappers: ({ input }) => [
          logLevelHandlerWrapper<CheerioCrawlingContext<any, any>>(input?.logLevel ?? 'info'),
        ],
        createCrawler: ({ router, input, proxy }) =>
          createCrawler({ router, input, proxy, crawlerConfig }),
      });

      const startUrls: string[] = [];
      if (actor.input?.startUrls) startUrls.push(...actor.input?.startUrls);
      else if (actor.input?.datasetType) startUrls.push(datasetTypeToUrl[actor.input?.datasetType]);

      await actor.crawler.run(startUrls);
    },
    { statusMessage: 'Crawling finished!' }
  );
};

// prettier-ignore
const createCrawler = async ({ router, input, proxy, crawlerConfig }: {
  input: ActorInput | null;
  router: RouterHandler<CheerioCrawlingContext>;
  proxy?: ProxyConfiguration;
  crawlerConfig?: CheerioCrawlerOptions;
}) => {
  return new CheerioCrawler({
    // ----- 1. DEFAULTS -----
    maxRequestsPerMinute: 120,
    // NOTE: 4-hour timeout. We need high timeout for the linked resources.
    // Some organisations can have up to 40k outputs. In best case scenario,
    // this can take about 30 mins. From my experience, some entries may be
    // can take 30-60 mins.
    requestHandlerTimeoutSecs: 60 * 60 * 4,
    // headless: true,
    // maxRequestsPerCrawl: 20,
    
    // SHOULD I USE THESE?
    // See https://docs.apify.com/academy/expert-scraping-with-apify/solutions/rotating-proxies
    // useSessionPool: true,
    // sessionPoolOptions: {},

    // ----- 2. CONFIG FROM INPUT -----
    ...omitBy(pickCrawlerInputFields(input ?? {}), (field) => field === undefined),
    
    // ----- 3. CONFIG THAT USER CANNOT CHANGE -----
    proxyConfiguration: proxy,
    requestHandler: router,
    // Capture errors as a separate Apify/Actor dataset and pass errors to Sentry
    failedRequestHandler: async ({ error, request, log }) => {
      stats.addError(request.url, (error as Error)?.message);
      const url = request.loadedUrl || request.url;
      captureError({
        error: error as Error,
        url,
        log,
        reportingDatasetId: 'REPORTING',
        allowScreenshot: true,
        onErrorCapture: ({ error, report }) => {
          Sentry.captureException(error, { extra: report as any });
        },
      });
    },

    // ----- 4. OVERRIDES - E.G. TEST CONFIG -----
    ...omitBy(crawlerConfig ?? {}, (field) => field === undefined),
  });
};
