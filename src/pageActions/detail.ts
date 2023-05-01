import type { Log } from 'apify';
import type { DOMLib } from 'apify-actor-utils';
import type { OptionsInit } from 'got-scraping';
import { mapValues } from 'lodash';

import type {
  DetailedItemLinkedResourcesByType,
  DetailedSkCrisOrgItem,
  DetailedSkCrisPrjItem,
  DetailedSkCrisResItem,
  ResourceType,
  SimpleItemByType,
  SimpleSkCrisOrgItem,
  SimpleSkCrisPrjItem,
  SimpleSkCrisResItem,
} from '../types';
import {
  CookieRef,
  LinkedResourceId,
  makeDetailLinkedResourceGetRequest,
  makeSkCrisLinkedAddressRequest,
} from '../api/skcris';
import type { MaybePromise } from '../utils/types';
import { awaitValues } from '../utils/async';

export interface SkCrisDetailPageContext<T extends ResourceType = ResourceType> {
  resourceType: T;
  cookie: CookieRef;
  /** Current page we want to extract */
  page: number;
  /** Num of entries to fetch per page */
  perPage: number;
  log: Log;
  onFetchReq: <Res>(req: OptionsInit, options?: { saveCookie?: boolean }) => MaybePromise<Res>; // prettier-ignore
}

interface LinkedResourceResponse {
  count: number;
  res: { id: number; name: string }[];
}

const createOrganisationUrl = (id: number) => `https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_organisationSearchResult_WAR_cvtiappweb_javax.portlet.action=organizationgodetail&id=${id}`; // prettier-ignore
const createResearcherUrl = (id: number) => `https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_researcherSearchResult_WAR_cvtiappweb_action=goresdetail&id=${id}`; // prettier-ignore
const createProjectUrl = (id: number) => `https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_javax.portlet.action=projectgodetail&id=${id}`; // prettier-ignore
const createOrgOutputUrl = (id: number, outputType: 'innovation' | 'patent' | 'product' | 'publication') => `https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_organisationSearchResult_WAR_cvtiappweb_action=linkedvysledky&type=${outputType}&id=${id}`; // prettier-ignore
const createOrgInfraUrl = (id: number, infraType: 'serv' | 'facil' | 'equip') => `https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_organisationSearchResult_WAR_cvtiappweb_action=orglinkedinfrastr&type=${infraType}&id=${id}`; // prettier-ignore
const createPrjOutputUrl = (id: number, outputType: 'innovation' | 'patent' | 'product' | 'publication') => `https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_action=linkedvysledky&type=${outputType}&id=${id}`; // prettier-ignore
const createPrjInfraUrl = (id: number, infraType: 'serv' | 'facil' | 'equip') => `https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_action=projlinkedinfrastr&type=${infraType}&id=${id}`; // prettier-ignore
const createPrjDocUrl = (id: number) => `https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=downloadDocument&p_p_cacheability=cacheLevelPage&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_action=downloadDocument&_projectSearchResult_WAR_cvtiappweb_implicitModel=true&documentId=${id}`; // prettier-ignore
const createResOutputUrl = (id: number, outputType: 'innovation' | 'patent' | 'product' | 'publication' | 'citation') => `https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_researcherSearchResult_WAR_cvtiappweb_action=linkedvysledky&type=${outputType}&id=${id}`; // prettier-ignore

/** Description of how each linked resource should be handled */
const linkedResourceTransformerByType: {
  [Key in ResourceType]: {
    [Id in LinkedResourceId<Key>]: {
      key: keyof DetailedItemLinkedResourcesByType<Key>;
      map?: (val: any) => any;
    };
  };
} = {
  org: {
    goorgaddresses: {
      key: 'addresses',
      map: (addr: DetailedSkCrisOrgItem['addresses'][0]) => {
        return mapValues(addr, (val) => (val === '' ? null : val));
      },
    },
    goorgprojectlist: {
      key: 'projects',
      map: (prj: DetailedSkCrisOrgItem['projects'][0]) => ({
        ...prj,
        url: createProjectUrl(prj.id),
      }),
    },
    goorgresearcherlist: {
      key: 'researchers',
      map: (res: DetailedSkCrisOrgItem['researchers'][0]) => ({
        ...res,
        url: createResearcherUrl(res.id),
      }),
    },
    goorgorgparentlist: {
      key: 'parentOrgs',
      map: (org: DetailedSkCrisOrgItem['parentOrgs'][0]) => ({
        ...org,
        url: createOrganisationUrl(org.id),
      }),
    },
    goorgorgchildlist: {
      key: 'childOrgs',
      map: (org: DetailedSkCrisOrgItem['childOrgs'][0]) => ({
        ...org,
        url: createOrganisationUrl(org.id),
      }),
    },
    goorginnovationlist: {
      key: 'innovationOutputs',
      map: (output: DetailedSkCrisOrgItem['innovationOutputs'][0]) => ({
        ...output,
        url: createOrgOutputUrl(output.id, 'innovation'),
      }),
    },
    goorgpatentlist: {
      key: 'patentOutputs',
      map: (output: DetailedSkCrisOrgItem['patentOutputs'][0]) => ({
        ...output,
        url: createOrgOutputUrl(output.id, 'patent'),
      }),
    },
    goorgproductlist: {
      key: 'productOutputs',
      map: (output: DetailedSkCrisOrgItem['productOutputs'][0]) => ({
        ...output,
        url: createOrgOutputUrl(output.id, 'product'),
      }),
    },
    goorgpublicationlist: {
      key: 'publicationOutputs',
      map: (output: DetailedSkCrisOrgItem['publicationOutputs'][0]) => ({
        ...output,
        url: createOrgOutputUrl(output.id, 'publication'),
      }),
    },
    goorgequipmentlist: {
      key: 'equipmentInfra',
      map: (output: DetailedSkCrisOrgItem['equipmentInfra'][0]) => ({
        ...output,
        url: createOrgInfraUrl(output.id, 'equip'),
      }),
    },
    goorgfacilitylist: {
      key: 'facilityInfra',
      map: (output: DetailedSkCrisOrgItem['facilityInfra'][0]) => ({
        ...output,
        url: createOrgInfraUrl(output.id, 'facil'),
      }),
    },
    goorgservicelist: {
      key: 'serviceInfra',
      map: (output: DetailedSkCrisOrgItem['serviceInfra'][0]) => ({
        ...output,
        url: createOrgInfraUrl(output.id, 'serv'),
      }),
    },
  },

  prj: {
    goprjorganisationlist: {
      key: 'organisations',
      map: (org: DetailedSkCrisPrjItem['organisations'][0]) => ({
        ...org,
        url: createOrganisationUrl(org.id),
      }),
    },
    goprjresearcherlist: {
      key: 'researchers',
      map: (res: DetailedSkCrisPrjItem['researchers'][0]) => ({
        ...res,
        url: createResearcherUrl(res.id),
      }),
    },
    goprjinnovationlist: {
      key: 'innovationOutputs',
      map: (output: DetailedSkCrisPrjItem['innovationOutputs'][0]) => ({
        ...output,
        url: createPrjOutputUrl(output.id, 'innovation'),
      }),
    },
    goprjpatentlist: {
      key: 'patentOutputs',
      map: (output: DetailedSkCrisPrjItem['patentOutputs'][0]) => ({
        ...output,
        url: createPrjOutputUrl(output.id, 'patent'),
      }),
    },
    goprjproductlist: {
      key: 'productOutputs',
      map: (output: DetailedSkCrisPrjItem['productOutputs'][0]) => ({
        ...output,
        url: createPrjOutputUrl(output.id, 'product'),
      }),
    },
    goprjpublicationlist: {
      key: 'publicationOutputs',
      map: (output: DetailedSkCrisPrjItem['publicationOutputs'][0]) => ({
        ...output,
        url: createPrjOutputUrl(output.id, 'publication'),
      }),
    },
    goprjequipmentlist: {
      key: 'equipmentInfra',
      map: (infra: DetailedSkCrisPrjItem['equipmentInfra'][0]) => ({
        ...infra,
        url: createPrjInfraUrl(infra.id, 'equip'),
      }),
    },
    goprjfacilitylist: {
      key: 'facilityInfra',
      map: (infra: DetailedSkCrisPrjItem['facilityInfra'][0]) => ({
        ...infra,
        url: createPrjInfraUrl(infra.id, 'facil'),
      }),
    },
    goprjservicelist: {
      key: 'serviceInfra',
      map: (infra: DetailedSkCrisPrjItem['serviceInfra'][0]) => ({
        ...infra,
        url: createPrjInfraUrl(infra.id, 'serv'),
      }),
    },
    goprjdocumentlist: {
      key: 'documents',
      map: (doc: DetailedSkCrisPrjItem['documents'][0]) => ({
        ...doc,
        url: createPrjDocUrl(doc.id),
      }),
    },
  },

  res: {
    goresorganisationlist: {
      key: 'organisations',
      map: (org: DetailedSkCrisResItem['organisations'][0]) => ({
        ...org,
        url: createOrganisationUrl(org.id),
      }),
    },
    goresprojectlist: {
      key: 'projects',
      map: (prj: DetailedSkCrisResItem['projects'][0]) => ({
        ...prj,
        url: createProjectUrl(prj.id),
      }),
    },
    goresinnovationlist: {
      key: 'innovationOutputs',
      map: (output: DetailedSkCrisResItem['innovationOutputs'][0]) => ({
        ...output,
        url: createResOutputUrl(output.id, 'innovation'),
      }),
    },
    gorespatentlist: {
      key: 'patentOutputs',
      map: (output: DetailedSkCrisResItem['patentOutputs'][0]) => ({
        ...output,
        url: createResOutputUrl(output.id, 'patent'),
      }),
    },
    goresproductlist: {
      key: 'productOutputs',
      map: (output: DetailedSkCrisResItem['productOutputs'][0]) => ({
        ...output,
        url: createResOutputUrl(output.id, 'product'),
      }),
    },
    gorespublicationlist: {
      key: 'publicationOutputs',
      map: (output: DetailedSkCrisResItem['publicationOutputs'][0]) => ({
        ...output,
        url: createResOutputUrl(output.id, 'publication'),
      }),
    },
    gorescitationlist: {
      key: 'citationOutputs',
      map: (output: DetailedSkCrisResItem['citationOutputs'][0]) => ({
        ...output,
        desc: output.desc || null,
        url: createResOutputUrl(output.id, 'citation'),
      }),
    },
  },
};

const toLowerCase = (val?: string | null) => val?.toLocaleLowerCase() ?? null;
const keywordsMap = (val?: string) => {
  if (val === '-') return [];
  // In some cases, the keywords are not separated by anything,
  // so we search for them by where lower and uppercase meet
  // Eg "Cloud computingBiotech" => "Cloud computing, Biotech"
  const newVal =
    val && !val.includes(',')
      ? val.replace(/[a-z][A-Z]/g, (letters) => letters[0] + ', ' + letters[1])
      : val;
  return newVal?.split(',').map((t) => t.trim().toLocaleLowerCase()) ?? [];
};

/** Description of how resource type should be handled */
const mapFieldsByType: {
  [Key in ResourceType]: Record<
    string,
    { key?: keyof SimpleItemByType<Key>; map?: (val: any) => any; drop?: true }
  >;
} = {
  org: {
    Názov: { key: 'name' },
    Akronym: { key: 'acronym' },
    IČO: { key: 'ičo' },
    Adresa: { drop: true }, // Address is included via JSON requests
    Zameranie: { key: 'description' },
    Rezort: { key: 'govDept', map: toLowerCase },
    'SK NACE': { key: 'skNace', map: toLowerCase },
    'Forma hospodárenia': { key: 'financingType', map: toLowerCase },
    Sektor: { key: 'orgType', map: toLowerCase },
    'Prevažujúca činnosť': { key: 'activityMain', map: toLowerCase },
    'Odbor vedy a techniky': { key: 'activitySpec', map: toLowerCase },
    'Certifikát spôs. vykonávať VaV č.': { key: 'certificateText' },
    'E-mail': { key: 'email', map: (val?: string) => toLowerCase(val)?.split(',').map((t) => t.trim()) ?? [] }, // prettier-ignore
    Telefón: { key: 'phone' },
    www: { key: 'website', map: toLowerCase },
  },
  res: {
    'Meno a priezvisko': { key: 'fullName' },
    'Zdroj dát': { key: 'datasource', map: toLowerCase },
    'Odbor VaV': { key: 'industry', map: toLowerCase },
    'Sektor VaV': { key: 'orgType', map: toLowerCase },
    'Kľúčové slová': { key: 'keywords', map: keywordsMap },
    Anotácia: { key: 'annotation', map: toLowerCase },
    www: { key: 'website', map: toLowerCase },
    'e-mail': { key: 'email', map: (val?: string) => toLowerCase(val)?.split(',').map((t) => t.trim()) ?? [] }, // prettier-ignore
    'Chcete upraviť Vaše údaje ?': { drop: true },
  },
  prj: {
    'Názov projektu': { key: 'name' },
    'Kód projektu': { key: 'projectCode' },
    Abstrakt: { key: 'abstract' },
    'Kľúčové slová': { key: 'keywords', map: keywordsMap },
    'Názov výzvy': { key: 'grantCallName' },
    'Pridelená suma': {
      key: 'awardAmountEur',
      map: (val?: string) => {
        const maybeNum = Number.parseFloat(val?.replace(/\s*eur$/i, '') || '-');
        return Number.isNaN(maybeNum) ? null : maybeNum;
      },
    },
    'Odbor vedy a techniky': { key: 'activitySpec', map: toLowerCase },
    'Charakter VaV': { key: 'researchType', map: toLowerCase },
    'Typ programu, finanč. zdroja': { key: 'programmeType', map: toLowerCase },
    Trvanie: { key: 'duration' },
  },
};

export const detailPageActions = {
  // Ask for related resources as long as they are there (paginate over all of them at batches of 500).
  // Eg for profile page
  // https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_researcherSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfPers_17002&lang=sk
  // I had use following request
  // curl 'https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_resource_id=goresprojectlist&page=1&perPage=10' \
  // -H 'Accept: application/json, text/javascript, */*; q=0.01' \
  // -H 'Accept-Language: en-US,en;q=0.9,sk;q=0.8,cs;q=0.7,de;q=0.6,ko;q=0.5' \
  // -H 'Connection: keep-alive' \
  // -H 'Cookie: JSESSIONID=3fc1fdd74277456796d2a7c47e70' \
  // -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36' \
  // --compressed
  fetchLinkedResources: async <T extends ResourceType>({
    resourceType,
    resourceId,
    cookie,
    page,
    perPage,
    log,
    onFetchReq,
  }: SkCrisDetailPageContext<T> & { resourceId: LinkedResourceId<T> }) => {
    const cookieVal = cookie.get();
    const totalItems: unknown[] = [];
    let currPage = page;
    let total: number | string = 'unknown';
    while (true) {
      log.debug(`Fetching linked resources for "${resourceType}" page. SESSION_ID ${cookieVal} (page ${currPage}, total ${total ?? 'unknown'})`); // prettier-ignore

      let res;
      let count;

      // Addresses don't follow the regular pattern
      if (resourceId === 'goorgaddresses') {
        const req = makeSkCrisLinkedAddressRequest({ resourceType, cookie: cookie.get() });
        res = await onFetchReq<unknown[]>(req, { saveCookie: false });
        count = res.length;
      } else {
        // prettier-ignore
        const req = makeDetailLinkedResourceGetRequest({ resourceType, resourceId, cookie: cookie.get(), page: currPage, perPage });
        const data = await onFetchReq<LinkedResourceResponse>(req, { saveCookie: false });
        res = data.res;
        count = data.count;
      }
      total = count;
      totalItems.push(...res);

      if (totalItems.length >= count || !res?.length) {
        log.debug(`Done fetching linked resources for "${resourceType}" page. SESSION_ID ${cookieVal} (page ${currPage}, total ${total ?? 'unknown'})`); // prettier-ignore
        break;
      }
      currPage += 1;
    }
    return totalItems;
  },

  fetchLinkedResourcesForResourceType: async <T extends ResourceType>(
    resourceType: T,
    linkedResourceIds: readonly LinkedResourceId<T>[],
    context: Omit<SkCrisDetailPageContext, 'resourceType'> & { log: Log }
  ) => {
    const cookieVal = context.cookie.get();
    context.log.info(`Fetching linked resources for "${resourceType}" page. SESSION_ID ${cookieVal}`); // prettier-ignore

    // For each resourceID, fetch the linked resources
    const linkedResources = await linkedResourceIds.reduce<{
      [Key in keyof DetailedItemLinkedResourcesByType<T>]: Promise<unknown[]>;
    }>((agg, resourceId) => {
      const mapper = linkedResourceTransformerByType[resourceType][resourceId];
      if (!mapper.key) throw Error(`Cannot find mapped key for resourceId ${resourceId} for ResourceType ${resourceType}`); // prettier-ignore

      // prettier-ignore
      agg[mapper.key] = detailPageActions.fetchLinkedResources({
        resourceType,
        resourceId,
        ...context,
      }).then((data) => (mapper.map ? data.map(mapper.map) : data));
      return agg;
    }, {} as any);

    // Wait for all requests to finish simultaneously
    const linkedResourcePromises = Object.values(linkedResources);
    await Promise.all(linkedResourcePromises);
    const resolvedLinkedResources = await awaitValues(linkedResources);

    // Add counts
    Object.entries(resolvedLinkedResources).forEach(([key, data]) => {
      resolvedLinkedResources[`${key}Count`] = (data as any[]).length;
    });

    context.log.debug(`Done fetching linked resources for "${resourceType}" page. SESSION_ID ${cookieVal}`); // prettier-ignore
    return resolvedLinkedResources;
  },
};

export const detailDOMActions = {
  extractOrgDetail: <T>({ domLib, log }: { domLib: DOMLib<T>; log: Log }) => {
    const url = domLib.url();
    log.debug(`Extracting details from org page. URL ${url}`);
    const tableData = detailDOMActions.extractTableData({ domLib, log, resourceType: 'org' });

    const certificateData = detailMethods.parseCertificate(tableData.certificateText);
    const fieldData = detailMethods.parseFields(tableData.activitySpec);

    // https://www.skcris.sk/portal/register-researchers?...&guid=cfOrg_4328
    const guid = new URL(url!).searchParams.get('guid');

    log.debug(`Done extracting details from org page. URL ${url}`);

    return {
      guid,
      url,
      ...tableData,
      ...certificateData,
      ...fieldData,
    } as SimpleSkCrisOrgItem;
  },

  extractPrjDetail: <T>({ domLib, log }: { domLib: DOMLib<T>; log: Log }) => {
    const url = domLib.url();
    log.debug(`Extracting details from prj page. URL ${url}`);

    const tableData = detailDOMActions.extractTableData({ domLib, log, resourceType: 'prj' });
    const fieldData = detailMethods.parseFields(tableData.activitySpec);

    // Project duration has form like so: "01.01.2018 - 31.12.2020"
    const [projStart, projEnd] = (tableData.duration || '').split('-').map((t) => t.trim());
    tableData.durationStart = projStart;
    tableData.durationEnd = projEnd;

    // https://www.skcris.sk/portal/register-researchers?...&guid=cfOrg_4328
    const guid = new URL(url!).searchParams.get('guid');

    log.debug(`Done extracting details from prj page. URL ${url}`);

    return {
      guid,
      url,
      ...tableData,
      ...fieldData,
    } as SimpleSkCrisPrjItem;
  },

  extractResDetail: <T>({ domLib, log }: { domLib: DOMLib<T>; log: Log }) => {
    const url = domLib.url();
    log.debug(`Extracting details from res page. URL ${url}`);
    const tableData = detailDOMActions.extractTableData({ domLib, log, resourceType: 'res' });

    // https://www.skcris.sk/portal/register-researchers?...&guid=cfOrg_4328
    const guid = new URL(url!).searchParams.get('guid');

    log.debug(`Done extracting details from res page. URL ${url}`);

    return {
      guid,
      url,
      ...tableData,
    } as any as SimpleSkCrisResItem;
  },

  extractTableData: <T>({
    domLib,
    log,
    resourceType,
  }: {
    domLib: DOMLib<T>;
    log: Log;
    resourceType: ResourceType;
  }) => {
    const url = domLib.url();
    log.debug(`Extracting tabular details from the page. URL ${url}`);
    const rootEl = domLib.root();

    const tableDataEls = domLib
      .findMany(rootEl, '.detail > tr')
      .filter((el) => domLib.text(el)) // Remove empty tags
      .slice(1, -1); // Remove first row (heading) and last row (related resources - we get this data in JSON)
    log.debug(`Found ${tableDataEls.length} elements. URL ${url}`); // prettier-ignore

    const titleMap = mapFieldsByType[resourceType];
    const tableData = tableDataEls.reduce((agg, rowEl) => {
      const [title, val] = domLib.children(rowEl, (el) => domLib.text(el)?.replace(/\s+/g, ' '));
      if (!title) return agg;

      const mapper = titleMap[title];
      if (mapper?.drop) return agg;

      const mappedTitle = mapper?.key ? mapper.key : title;
      const mappedVal = mapper?.map ? mapper.map(val) : val;
      agg[mappedTitle] = mappedVal ?? null;
      return agg;
    }, {} as Record<string, string | null>);

    log.debug(`Done extracting tabular details from the page. URL ${url}`); // prettier-ignore
    return tableData;
  },
};

const detailMethods = {
  /** Certificate has form like so: "2022/12986:2-D1230 ( 07.01 2022 - 06.01 2028 )" */
  parseCertificate: (certificateText: string | null) => {
    const { groups } = (certificateText || '').match(
      /(?<cert>.*?)\s*\(\s*(?<start>.*?)\s*-\s*(?<end>.*?)\s*\)/
    ) || { groups: { cert: '', start: '', end: '' } };

    const certificate = groups?.cert || null;

    const formatDate = (dateText: string | null) => {
      const [d, m, y] =
        dateText
          ?.split(/[\.\s]/)
          .map((s) => s.trim())
          .filter(Boolean) ?? [];
      return y && d && m ? `${y}-${m}-${d}` : y && m ? `${y}-${m}` : y ? y : null;
    };

    const certificateStartDate = formatDate(groups?.start ?? null);
    const certificateEndDate = formatDate(groups?.end ?? null);

    return {
      certificate,
      certificateStartDate,
      certificateEndDate,
    };
  },

  parseFields: (fieldText: string | null) => {
    const [activitySpec1 = null, activitySpec2 = null, activitySpec3 = null] =
      fieldText?.split(/\//g).map((s) => s.trim().toLocaleLowerCase()) ?? [];

    return { activitySpec1, activitySpec2, activitySpec3 };
  },
};
