import type { CheerioCrawlerOptions } from 'crawlee';
import { createAndRunCrawleeOne, CrawlerUrl } from 'crawlee-one';

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

/** Crawler options that **may** be overriden by user input */
const crawlerConfigDefaults: CheerioCrawlerOptions = {
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
};

export const run = async (crawlerConfigOverrides?: CheerioCrawlerOptions): Promise<void> => {
  const pkgJson = getPackageJsonInfo(module, ['name']);

  await createAndRunCrawleeOne({
    actorType: 'cheerio',
    actorName: pkgJson.name,
    actorConfig: {
      validateInput,
      routes,
      routeHandlers: ({ input }) => createHandlers(input!),
    },
    crawlerConfigDefaults,
    crawlerConfigOverrides,
    onActorReady: async (actor) => {
      const startUrls: CrawlerUrl[] = [];
      if (!actor.startUrls?.length && actor.input?.datasetType) {
        startUrls.push(datasetTypeToUrl[actor.input?.datasetType]);
      }

      await actor.runCrawler(startUrls);
    },
  });
};
