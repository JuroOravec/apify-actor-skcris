import type { OptionsInit } from 'got-scraping';
import type { Log } from 'apify';

import {
  ListingPageFilter,
  ListingPageScraperContext,
  scrapeListingEntries,
} from '../lib/scrapeListing';
import type { MaybePromise } from '../utils/types';
import type { ResourceType } from '../types';
import {
  CookieRef,
  ResultEntry,
  makeListingCountGetRequest,
  makeListingFilterLetterSelectRequest,
  makeListingFilterRegionGetOptionsRequest,
  makeListingFilterRegionSelectRequest,
  makeListingFilterResetRequest,
  makeListingResultsGetRequest,
  makeSkCrisDetailRequest,
} from '../api/skcris';
import { alphabet } from '../constants';

// 1. Get region filters - selectKrajAjax
// curl 'https://www.skcris.sk/portal/register-researchers?p_p_id=fazetSelectTreeSearch_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=selectKrajAjax' \
//   -H 'Accept: application/json, text/javascript, */*; q=0.01' \
//   -H 'Accept-Language: en-US,en;q=0.9,sk;q=0.8,cs;q=0.7,de;q=0.6,ko;q=0.5' \
//   -H 'Connection: keep-alive' \  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36' \
//   --compressed
//
// 2. Send request to set region filter
// curl 'https://www.skcris.sk/portal/register-researchers?p_p_id=fazetSelectTreeSearch_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=selectOkresAjax&id=${krajId}' \
//   -H 'Accept: application/json, text/javascript, */*; q=0.01' \
//   -H 'Accept-Language: en-US,en;q=0.9,sk;q=0.8,cs;q=0.7,de;q=0.6,ko;q=0.5' \
//   -H 'Connection: keep-alive' \
//   -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36' \
//   --compressed
//
// 3. Remember the JSESSIONID we get back
//   - eg header "Set-Cookie: JSESSIONID=2ad4caf780ccd7e51450b5d16973; Path=/portal; Secure"
//
// 4. Send request to set starting letter filter
// curl 'https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=selectNamestartAjax&ch=${lowercaseChar}' \
//   -H 'Accept: application/json, text/javascript, */*; q=0.01' \
//   -H 'Accept-Language: en-US,en;q=0.9,sk;q=0.8,cs;q=0.7,de;q=0.6,ko;q=0.5' \
//   -H 'Connection: keep-alive' \
//   -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36' \
//   --compressed
//
// 5. Remember the JSESSIONID we get back
//   - eg header "Set-Cookie: JSESSIONID=2ad4caf780ccd7e51450b5d16973; Path=/portal; Secure"
//
// 6. Fetch items using the JSESSIONID
// curl 'https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=readSearchResult&page=1&perPage=500' \
// -H 'Accept: application/json, text/javascript, */*; q=0.01' \
// -H 'Accept-Language: en-US,en;q=0.9,sk;q=0.8,cs;q=0.7,de;q=0.6,ko;q=0.5' \
// -H 'Connection: keep-alive' \
// -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36' \
// --compressed

export interface SkCrisListingPageContext {
  resourceType: ResourceType;
  cookie: CookieRef;
  /** Current page we want to extract */
  page: number;
  /** Num of entries to fetch per page */
  perPage: number;
  /** Remember the total count after we load filters */
  count: number;
  log: Log;
  onFetchReq: <Res>(req: OptionsInit, options?: { saveCookie?: boolean, json?: boolean }) => MaybePromise<Res>; // prettier-ignore
}

/**
 * The listings pagination supports up to 10000 results.
 * If there's more results we want to specify additional filters to match less results.
 */
const LISTING_PAGE_RESULTS_LIMIT = 10000;

interface RegionFilterOption {
  id: number;
  name: string;
}

const listingPageFilters = {
  /**
   * Create filter definition that can be passed to `setupListingFilters`
   * to use the Region filtering to slice the listing results.
   */
  setupRegionFilter: ({
    resourceType,
    cookie,
    log,
    onFetchReq,
    optionFilter,
  }: SkCrisListingPageContext & { optionFilter?: (option: RegionFilterOption) => boolean }) => {
    let currentRegionFilterIndex: null | number = null;
    let allRegionFilters: RegionFilterOption[] = [];
    let filterOptionsFetched = false;

    const initState = () => {
      if (currentRegionFilterIndex !== null) return false;

      currentRegionFilterIndex = 0;
      return true;
    };

    const resetState = () => {
      currentRegionFilterIndex = null;
    };

    /** Select filters based on current state and submit (reloads page) */
    const loadState = async () => {
      await getAllRegionFilters();
      const currRegionFilter = allRegionFilters[currentRegionFilterIndex!];
      await selectRegionFilter(currRegionFilter.id);
    };

    const hasState = async () => {
      await getAllRegionFilters();
      return allRegionFilters.length > 0;
    };

    const hasNextState = async () => {
      await getAllRegionFilters();
      const nextStateAvailable =
        (typeof currentRegionFilterIndex !== 'number' && allRegionFilters.length > 0) ||
        (typeof currentRegionFilterIndex === 'number' &&
          currentRegionFilterIndex < allRegionFilters.length - 1);
      return nextStateAvailable;
    };

    const nextState = async () => {
      await getAllRegionFilters();
      const filterAvailable = await hasNextState();
      if (!filterAvailable) {
        throw Error('Cannot select next region filter - reached end of list');
      }

      currentRegionFilterIndex =
        typeof currentRegionFilterIndex === 'number' ? currentRegionFilterIndex + 1 : 0;
    };

    /** Select filter and get session cookie that has the filter selected */
    const selectRegionFilter = async (id: number) => {
      const req = makeListingFilterRegionSelectRequest({
        resourceType,
        cookie: cookie.get(),
        regionId: id,
      });
      await onFetchReq(req, { saveCookie: true });
    };

    const getAllRegionFilters = async () => {
      if (filterOptionsFetched) return;

      const req = makeListingFilterRegionGetOptionsRequest({ resourceType });
      const json = await onFetchReq<{ arr: { id: number; name: string }[] }>(req, { saveCookie: false }); // prettier-ignore
      allRegionFilters = json?.arr ?? [];
      log.debug('RegionFilter filter options BEFORE filter', allRegionFilters);
      if (optionFilter) allRegionFilters = allRegionFilters.filter(optionFilter);
      log.debug('RegionFilter filter options AFTER filter', allRegionFilters);
      filterOptionsFetched = true;
    };

    return {
      name: 'RegionFilter',
      initState,
      loadState,
      nextState,
      hasNextState,
      resetState,
      hasState,
    } satisfies ListingPageFilter;
  },

  setupLetterFilter: ({
    resourceType,
    cookie,
    log,
    onFetchReq,
    optionFilter,
  }: SkCrisListingPageContext & { optionFilter?: (option: string) => boolean }) => {
    let currentLetterFilterIndex: null | number = null;
    let allLetterFilters: string[] = alphabet.split('');

    log.debug('LetterFilter filter options BEFORE filter', allLetterFilters);
    if (optionFilter) allLetterFilters = allLetterFilters.filter(optionFilter);
    log.debug('LetterFilter filter options AFTER filter', allLetterFilters);

    const initState = () => {
      if (currentLetterFilterIndex !== null) return false;

      currentLetterFilterIndex = 0;
      return true;
    };

    const resetState = async () => {
      currentLetterFilterIndex = null;
    };

    /** Select filters based on current state and submit (reloads page) */
    const loadState = async () => {
      const currLetterFilter = allLetterFilters[currentLetterFilterIndex!];
      await selectLetterFilter(currLetterFilter);
    };

    const hasState = async () => {
      return allLetterFilters.length > 0;
    };

    const hasNextState = async () => {
      const nextStateAvailable =
        (typeof currentLetterFilterIndex !== 'number' && allLetterFilters.length > 0) ||
        (typeof currentLetterFilterIndex === 'number' &&
          currentLetterFilterIndex < allLetterFilters.length - 1);
      return nextStateAvailable;
    };

    const nextState = async () => {
      const filterAvailable = await hasNextState();
      if (!filterAvailable) {
        throw Error('Cannot select next letter filter - reached end of list');
      }

      currentLetterFilterIndex =
        typeof currentLetterFilterIndex === 'number' ? currentLetterFilterIndex + 1 : 0;
    };

    /** Select filter and get session cookie that has the filter selected */
    const selectLetterFilter = async (char: string) => {
      // Make request to 'https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=selectNamestartAjax&ch=${char}'
      const req = makeListingFilterLetterSelectRequest({
        resourceType,
        cookie: cookie.get(),
        char,
      });
      await onFetchReq<{ arr: { id: number; name: string }[] }>(req, { saveCookie: true }); // prettier-ignore
    };

    return {
      name: 'LetterFilter',
      initState,
      loadState,
      nextState,
      hasNextState,
      resetState,
      hasState,
    } satisfies ListingPageFilter;
  },
};

export const listingPageActions = {
  getResultsCount: async ({ resourceType, cookie, onFetchReq }: SkCrisListingPageContext) => {
    const req = makeListingCountGetRequest({ resourceType, cookie: cookie.get() });
    const json = await onFetchReq<{ count: number }>(req, { saveCookie: false });
    const count: number = json?.count ?? 0;
    return count;
  },

  // prettier-ignore
  fetchItems: async ({ resourceType, cookie, page, perPage, onFetchReq }: SkCrisListingPageContext) => {
    const req = makeListingResultsGetRequest({ resourceType, cookie: cookie.get(), page, perPage });
    const json = await onFetchReq<{ str: ResultEntry[] }>(req, { saveCookie: false });
    return json?.str ?? [];
  },

  /** Get URLs of the profiles from a listing page */
  scrapeUrls: async (
    options: Omit<SkCrisListingPageContext, 'page' | 'perPage' | 'count'> & {
      perPage?: number;
      url: string;
      listingCountOnly?: boolean;
      log: Log;
      onEntries?: (
        context: ListingPageScraperContext<SkCrisListingPageContext, string>,
        entries: string[]
      ) => MaybePromise<void>;
      optionFilter?: {
        region?: (item: RegionFilterOption) => boolean;
        letter?: (item: string) => boolean;
      };
    }
  ) => {
    const { resourceType, cookie, onFetchReq, url, listingCountOnly = false, log, onEntries, optionFilter, perPage = 500 } = options || {}; // prettier-ignore

    /** Data available to all callbacks */
    const context: SkCrisListingPageContext = { resourceType, cookie, onFetchReq, page: 1, perPage, count: 0, log }; // prettier-ignore

    const regionFilter = listingPageFilters.setupRegionFilter({ ...context, optionFilter: optionFilter?.region }); // prettier-ignore
    const letterFilter = listingPageFilters.setupLetterFilter({ ...context, optionFilter: optionFilter?.letter }); // prettier-ignore

    const filters = [
      // By default, the first strategy is to select region filters.
      // Note: Filtering by first letter is not done as the first strategy, as not all
      //       characters are supported. Hence, we need something else.
      //       Filtering by region is good enough split (splits into 8 parts). However,
      //       a lot of results is associated with universities, and the most active unis
      //       are concentrated in major cities, so this can still lead to going over 10000 results.
      //       Most results is "Bratislava region", 44.6% (10760 out of 24150).
      regionFilter,
      // If there's STILL more than 10000 results even with region filters.
      // Then the second strategy is to select results by their first letter.
      // Note: This is not a great option, because the filters support only letters
      //       a-z, but projects can start with numbers (eg "3D"), or non-letter chars (double quote).
      //       Non-letter characters are listed first. So what we do is we first
      //       paginate across all the results (>10000), collecting all the non-letter results.
      //       Then, once we reach results starting with "a", we can switch to using letter-filtering.
      //       We shouldn't have to worry of hitting the limit of 10000 for non-letter results,
      //       as these represent about 0.2% of all results (60 out of 24150).
      //       Most results is for "v", 14.5% (3490 out of 24150).
      letterFilter,
    ];

    // NOTE: SPECIAL CASE!!
    // If the user wants to use specific LETTER filter options,
    // but doesn't ask for spcific REGION filter options, then we
    // reverse the order, so the application of region filter is CONDITIONAL
    // to the number of entries returned for the letter filter.
    if (optionFilter?.letter && !optionFilter?.region) filters.reverse();

    // We initially disable the filters if first few pages contain entries
    // starting with non-alphabet characters. We re-enable them once
    // the results on current page don't include non-alpha entries anymore.
    log.info(`Disabling all filters, so we can extract entries that start with non-alphabetic characters. Filters will be enabled once all such entries are processed.`); // prettier-ignore
    let filtersDisabled = true;
    let goToFirstPageAfterEnablingFilters = false;

    const links = await scrapeListingEntries({
      context,
      startUrls: [url],
      listingCountOnly,
      log,
      pageId: ({ context }) => `page ${context.page} / ${Math.ceil(context.count / context.perPage)} - ${context.perPage} entries per page`, // prettier-ignore

      // Filters config
      filters,
      // Apply filters only if the total count is above our limit
      shouldApplyFilter: async ({ context, log }, filter) => {
        // Always apply filter if we asked for specific filter option
        if (filter.name === 'RegionFilter' && optionFilter?.region) return true;
        if (filter.name === 'LetterFilter' && optionFilter?.letter) return true;

        log.debug(`Deciding if should keep applying filters.`);
        log.debug(`Fetching results count`);
        const count = await listingPageActions.getResultsCount(context); // prettier-ignore
        log.debug(`Done fetching results count (${count})`);
        const shouldUseFilters = count > LISTING_PAGE_RESULTS_LIMIT;
        log.info(`Current results count: ${count} (max: ${LISTING_PAGE_RESULTS_LIMIT})`);
        log.debug(`Should apply filters: ${shouldUseFilters}`);
        return shouldUseFilters;
      },
      onFiltersLoaded: async ({ context, log }) => {
        log.debug(`Fetching results count.`);
        const count = await listingPageActions.getResultsCount(context);
        log.debug(`Done fetching results count (${count})`);
        if (count > LISTING_PAGE_RESULTS_LIMIT) {
          log.warning(`Results matching the filters go over the maximum of ${LISTING_PAGE_RESULTS_LIMIT}. ${count - LISTING_PAGE_RESULTS_LIMIT} results will be hidden.`); // prettier-ignore
        }
        context.count = count;
      },
      onResetFilters: async ({ context }) => {
        // Hit the imaginary "Reset" button, and get a new session ID while at it.
        // That way we can apply different filters from a clean state.
        const req = makeListingFilterResetRequest({ resourceType, cookie: null });
        await onFetchReq(req, { saveCookie: true, json: false });

        context.page = 1;
        context.count = 0;
      },

      // Entries extraction
      extractEntries: async ({ context, filters, log }) => {
        log.debug(`Fetching page items.`);
        const items = await listingPageActions.fetchItems(context);
        log.debug(`Done fetching page items.`);

        // If we no longer have entries with non-alpha starting characters among the entries,
        // it's safe to enable the filters.
        const shouldEnableFilters =
          filtersDisabled && !listingPageMethods.hasItemThatStartsWithNonalpha(items);
        if (shouldEnableFilters) {
          log.info(`All entries that start with non-alphabetic characters were processed. Enabling filters now.`); // prettier-ignore
          filtersDisabled = false;
          filters.forEach((f) => (f.disabled = false));
          // Start pagination from page one again after we've enabled the filters
          goToFirstPageAfterEnablingFilters = true;
        }

        const { resourceType } = context;
        return items.map(({ guid }) => makeSkCrisDetailRequest({ resourceType, guid }));
      },
      onExtractEntriesDone: async (context, entries) => {
        await onEntries?.(context, entries || []);
      },

      onGoToNextPage: async ({ loadFilterState, context, log }) => {
        if (goToFirstPageAfterEnablingFilters) {
          log.info('Navigating to the first page of pagination after the filters were enabled');
          // Activate the filters and go again from page 1
          context.page = 1;
          await loadFilterState();
          goToFirstPageAfterEnablingFilters = false;
          return;
        }
        context.page += 1;
      },
      nextPageWait: 100,
    });

    return links;
  },
};

export const listingPageMethods = {
  hasItemThatStartsWithNonalpha: (entries: ResultEntry[]) => {
    return (
      entries
        .map((i) => i.name_sk)
        .filter(Boolean)
        // See https://stackoverflow.com/a/60297408
        .some((t) => t.match(/^[^\p{L}\p{M}\p{Zs}.-]+/iu))
    );
  },
};
