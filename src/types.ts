import { fromPairs } from 'lodash';

import type { ArrVal } from './utils/types';
import { skcrisRouteHandler } from './__generated__/crawler';

const enumFromArray = <T extends readonly any[]>(arr: T) => {
  return fromPairs(arr.map((k) => [k, k])) as { [Key in ArrVal<T>]: Key };
};

export const RESOURCE_TYPE = ['org', 'res', 'prj'] as const; // prettier-ignore
export const RESOURCE_TYPE_ENUM = enumFromArray(RESOURCE_TYPE);
export type ResourceType = ArrVal<typeof RESOURCE_TYPE>;

export const RES_RESOURCE = ['goresorganisationlist', 'goresprojectlist', 'goresproductlist', 'gorespatentlist', 'gorespublicationlist', 'goresinnovationlist', 'gorescitationlist'] as const; // prettier-ignore
export type ResResourceId = ArrVal<typeof RES_RESOURCE>;

export const ORG_RESOURCE = ['goorgaddresses', 'goorgresearcherlist', 'goorgprojectlist', 'goorgorgparentlist', 'goorgorgchildlist', 'goorgproductlist', 'goorgpatentlist', 'goorgpublicationlist', 'goorginnovationlist', 'goorgequipmentlist', 'goorgfacilitylist', 'goorgservicelist'] as const; // prettier-ignore
export type OrgResourceId = ArrVal<typeof ORG_RESOURCE>;

export const PRJ_RESOURCE = ['goprjresearcherlist', 'goprjorganisationlist', 'goprjproductlist', 'goprjpatentlist', 'goprjpublicationlist', 'goprjinnovationlist', 'goprjequipmentlist', 'goprjfacilitylist', 'goprjservicelist', 'goprjdocumentlist'] as const; // prettier-ignore
export type PrjResourceId = ArrVal<typeof PRJ_RESOURCE>;

export const DATASET_TYPE = ['researchers', 'projects', 'organisations'] as const; // prettier-ignore
export type DatasetType = ArrVal<typeof DATASET_TYPE>;

export const REGION_TYPE = ['bratislava', 'trnava', 'trencin', 'nitra', 'zilina', 'banskabystrica', 'presov', 'kosice', 'zahranicie'] as const; // prettier-ignore
export type RegionType = ArrVal<typeof REGION_TYPE>;

export type HandlerContext = Parameters<skcrisRouteHandler>[0];

interface BaseSkCrisItem {
  /** Eg `"cfOrg_7343"` */
  guid: string | null;
  /** Eg `"https://www.skcris.sk/portal/register-organizations?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&_organisationSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfOrg_7343"` */
  url: string | null;
}

/** Data after we've normalized and mapped them to our fields */
export interface SimpleSkCrisOrgItem extends BaseSkCrisItem, ActivitySpecFields {
  /** Eg `'"punkt"'` */
  name: string | null;
  /** Eg `'ABC'` */
  acronym: string | null;
  /** Eg `'42128013'` */
  ičo: string | null;
  /** Eg `'Obcˇianske zdruzˇenie PUNKT vzniklo v roku 2007 za u´cˇelom propaga´cie a podpory vy´skumu v oblasti dizajnu, vy´tvarne´ho umenia, architektu´ry a urbanizmu. Postupne sme rozsˇi´rili svoj za´mer na komplexnu´ podporu rozvoja mesta na ro^znych u´rovniach. Ta´to sa ty´ka predovsˇetky´m podpory komunitne´ho zˇivota a miestnej ekonomiky, prepojenia potrieb obyvatelˇov s urba´nnym rozvojom, ako i zodpovedne´ho nakladania s odpadom a jeho redukcie v praxi. Nasˇi´m celkovy´m za´merom je podporovatˇ va¨cˇsˇiu rozmanitostˇ v slovenskom umeni´ a kultu´re, podporovatˇ komunitny´ rozvoj a stimulovatˇ akti´vne obcˇianstvo.'` */
  description: string | null;
  /** Eg `'Bez príslušnosti k orgánu štátu a štátnej správy'` */
  govDept: string | null;
  /** Eg `'Činnosti záujmových organizácií'` */
  skNace: string | null;
  /** Eg `'Nezisková organizácia'` */
  financingType: string | null;
  /** Eg `'neziskové organizácie'` */
  orgType: string | null;
  /** Eg `'iná prevažujúca činnosť ako výskum a vývoj'` */
  activityMain: string | null;
  /** Eg `['name.surname@company.sk']` */
  email: string[];
  /** Eg `'-'` or `'0949 123 456'` */
  phone: string | null;
  /** Eg `'-'` or `'https://website.sk'` */
  website: string | null;
  /** Eg `'2022/12986:2-D1230 ( 07.01 2022 - 06.01 2028 )'` */
  certificateText: string | null;
  /** Eg `'2020/18949:2-D1230'` */
  certificate: string | null;
  /** Eg `'2020-11-16'` */
  certificateStartDate: string | null;
  /** Eg `'2026-11-15'` */
  certificateEndDate: string | null;
}

export interface SimpleSkCrisResItem extends BaseSkCrisItem {
  /** Eg `'RNDr. FirstName LastName, PhD.'` */
  fullName: string | null;
  /** Eg `'výskumník - CREPČ'` */
  datasource: string | null;
  /** Eg `'Ostatné príbuzné odbory chemického inžinierstva'` */
  industry: string | null;
  /** Eg `'sektor vysokých škôl'` */
  orgType: string | null;
  /** Unknown value */
  keywords: string | null;
  /** Eg `'-'` or unknown value */
  annotation: string | null;
  /** Eg `'-'` or `'https://website.sk'` */
  website: string | null;
  /** Eg `['name.surname@company.sk']` */
  email: string[];
}

export interface SimpleSkCrisPrjItem extends BaseSkCrisItem, ActivitySpecFields {
  /** Eg `'A network for Gravitational Waves, Geophysics and Machine Learning'` */
  name: string | null;
  /** Eg `'CA17137'` */
  projectCode: string | null;
  /** Eg `'Prelomový objav gravitačných vĺn 14. septembra 2015 bol možný vďaka synergii techník čerpajúcich z odborných znalostí z fyziky, matematiky, informačných vied a výpočtovej techniky. V súčasnosti rýchlo rastie záujem o strojové učenie (ML), hlboké učenie (DL), problémy s klasifikáciou, dolovanie a vizualizáciu údajov a všeobecne o vývoj nových techník a algoritmov na efektívne zaobchádzanie s komplexnými a masívnymi údajmi. množiny nájdené v tom, čo bolo vytvorené ako „veľké dáta“, v širokom spektre disciplín, od spoločenských vied až po prírodné vedy. Rýchle zvýšenie výpočtového výkonu, ktorý máme k dispozícii, a vývoj inovatívnych techník na rýchlu analýzu údajov bude mať zásadný význam pre vzrušujúcu novú oblasť astronómie gravitačných vĺn (GW) zameranú na konkrétne témy, ako sú systémy riadenia a spätnej väzby pre budúcu generáciu detektory, odstránenie šumu, analýza údajov a nástroje na úpravu údajov. Objav signálov GW z kolíznych binárnych čiernych dier (BBH) a pravdepodobná existencia novo pozorovateľnej populácie masívnych čiernych dier hviezdneho pôvodu priniesla analýzu nízkych -frekvenčné dáta GW zásadné poslanie vedy GW. Nízkofrekvenčný výkon detektorov GW založených na Zemi je do značnej miery ovplyvnený schopnosťou zvládnuť potlačenie seizmického hluku v okolí. Cieľom tejto nákladovej akcie je vytvoriť širokú sieť vedcov zo štyroch rôznych odborných oblastí, konkrétne z fyziky GW, geofyziky, výpočtovej techniky a robotiky, so spoločným cieľom čeliť výzvam v oblasti analýzy údajov a charakteristík šumu detektorov GW. URL: https://www.cost.eu/actions/CA17137'` */
  abstract: string | null;
  /** Unknown value */
  keywords: string | null;
  /** Eg `'xxxxxx'` */
  grantCallName: string | null;
  /** Eg `'0.0'` */
  awardAmountEur: string | null;
  /** Eg `'aplikovaný (priemyselný) výskum'` */
  researchType: string | null;
  /** Eg `'medzinárodná spolupráca - COST'` */
  programmeType: string | null;
  /** Eg `'01.01.2018 - 31.12.2020'` */
  duration: string | null;
  /** Eg `'01.01.2018'` */
  durationStart: string | null;
  /** Eg `'31.12.2020'` */
  durationEnd: string | null;
}

export type SimpleItemByType<T extends ResourceType> = T extends 'res'
  ? SimpleSkCrisResItem
  : T extends 'org'
  ? SimpleSkCrisOrgItem
  : T extends 'prj'
  ? SimpleSkCrisPrjItem
  : never;

export interface DetailedSkCrisOrgItemLinkedResources {
  addresses: SkCrisLinkedResourceAddress[];
  researchers: SkCrisLinkedResource[];
  projects: SkCrisLinkedResource[];
  parentOrgs: SkCrisLinkedResource[];
  childOrgs: SkCrisLinkedResource[];
  productOutputs: SkCrisLinkedResource[];
  patentOutputs: SkCrisLinkedResource[];
  publicationOutputs: SkCrisLinkedResource[];
  innovationOutputs: SkCrisLinkedResource[];
  equipmentInfra: SkCrisLinkedResource[];
  facilityInfra: SkCrisLinkedResource[];
  serviceInfra: SkCrisLinkedResource[];
  addressesCount: number;
  researchersCount: number;
  projectsCount: number;
  parentOrgsCount: number;
  childOrgsCount: number;
  productOutputsCount: number;
  patentOutputsCount: number;
  publicationOutputsCount: number;
  innovationOutputsCount: number;
  equipmentInfraCount: number;
  facilityInfraCount: number;
  serviceInfraCount: number;
}

export interface DetailedSkCrisPrjItemLinkedResources {
  organisations: SkCrisLinkedResource[];
  researchers: SkCrisLinkedResource[];
  productOutputs: SkCrisLinkedResource[];
  patentOutputs: SkCrisLinkedResource[];
  publicationOutputs: SkCrisLinkedResource[];
  innovationOutputs: SkCrisLinkedResource[];
  equipmentInfra: SkCrisLinkedResource[];
  facilityInfra: SkCrisLinkedResource[];
  serviceInfra: SkCrisLinkedResource[];
  documents: SkCrisLinkedResourceDocument[];
  organisationsCount: number;
  researchersCount: number;
  productOutputsCount: number;
  patentOutputsCount: number;
  publicationOutputsCount: number;
  innovationOutputsCount: number;
  equipmentInfraCount: number;
  facilityInfraCount: number;
  serviceInfraCount: number;
  documentsCount: number;
}

export interface DetailedSkCrisResItemLinkedResources {
  organisations: SkCrisLinkedResource[];
  projects: SkCrisLinkedResource[];
  productOutputs: SkCrisLinkedResource[];
  patentOutputs: SkCrisLinkedResource[];
  publicationOutputs: SkCrisLinkedResource[];
  innovationOutputs: SkCrisLinkedResource[];
  citationOutputs: SkCrisLinkedResourceCitation[];
  organisationsCount: number;
  projectsCount: number;
  productOutputsCount: number;
  patentOutputsCount: number;
  publicationOutputsCount: number;
  innovationOutputsCount: number;
  citationOutputsCount: number;
}

export interface DetailedSkCrisOrgItem extends SimpleSkCrisOrgItem, DetailedSkCrisOrgItemLinkedResources {} // prettier-ignore
export interface DetailedSkCrisPrjItem extends SimpleSkCrisPrjItem, DetailedSkCrisPrjItemLinkedResources {} // prettier-ignore
export interface DetailedSkCrisResItem extends SimpleSkCrisResItem, DetailedSkCrisResItemLinkedResources {} // prettier-ignore

export type DetailedItemLinkedResourcesByType<T extends ResourceType> = T extends 'res'
  ? DetailedSkCrisResItemLinkedResources
  : T extends 'org'
  ? DetailedSkCrisOrgItemLinkedResources
  : T extends 'prj'
  ? DetailedSkCrisPrjItemLinkedResources
  : never;

interface ActivitySpecFields {
  /** Eg `'SPOLOČENSKÉ VEDY / Ostatné odbory spoločenských vied / Ostatné odbory spoločenských vied'` */
  activitySpec: string | null;
  /** Eg `'SPOLOČENSKÉ VEDY'` */
  activitySpec1: string | null;
  /** Eg `'Ostatné odbory spoločenských vied'` */
  activitySpec2: string | null;
  /** Eg `'Ostatné odbory spoločenských vied'` */
  activitySpec3: string | null;
}

/** Entry related to other ResourceType */
export interface SkCrisLinkedResource {
  /** Eg `33670` */
  id: number;
  /** Eg `'FirstName LastName'` or `'International Interdisciplinary Network on Smart Healthy Age friendly Environments'` */
  name: string;
  roles: {
    /** Eg `'kontaktná osoba'` */
    role: string;
  }[];
  /** Eg `'https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_researcherSearchResult_WAR_cvtiappweb_action=goresdetail&zmaz=org&id=33670'` */
  url: string;
}

/** Citation entry related to other ResourceType */
export interface SkCrisLinkedResourceCitation extends SkCrisLinkedResource {
  /** Eg `197710` */
  idpubl: number;
  /** Unknown value */
  desc: string;
}

/** Address entry related to other ResourceType */
export interface SkCrisLinkedResourceAddress {
  /** Eg `'Country [name=Slovensko, code=SK]'` */
  country: string;
  /** Eg `'Slovensko'` */
  countryName: string;
  /** Eg `'3033/5'` */
  adrLine1: string;
  /** No example */
  adrLine2: string;
  /** Eg `'Povraznícka'` */
  adrLine3: string;
  /** No example */
  adrLine4: string;
  /** No example */
  adrLine5: string;
  /** Eg `'81105'` */
  postCode: string;
  /** Eg `'Bratislava'` */
  cityTown: string;
  /** No example */
  cfUri: string;
  /** Eg `'Bratislavský kraj'` */
  region: string;
  /** Eg `'Okres Bratislava I'` */
  district: string;
  /** Eg `'Bratislava - mestská časť Staré Mesto'` */
  township: string;
  /** Eg `'sídlo'` */
  type: string;
}

/** Document entry related to other ResourceType */
export interface SkCrisLinkedResourceDocument {
  /** Eg `3421288` */
  id: number;
  /** Eg `'Info o projekte'` */
  name: string;
  /** Eg `'https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=downloadDocument&p_p_cacheability=cacheLevelPage&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_action=downloadDocument&_projectSearchResult_WAR_cvtiappweb_implicitModel=true&documentId=3421288'` */
  url: string;
  date: {
    /** Eg `22` */
    date: number;
    /** Eg `2` */
    day: number;
    /** Eg `22` */
    hours: number;
    /** Eg `43` */
    minutes: number;
    /** Eg `3` */
    month: number;
    /** Eg `0` */
    nanos: number;
    /** Eg `44` */
    /** Eg `44` */
    seconds: number;
    /** Eg `1398199424000` */
    time: number;
    /** Eg `-120` */
    timezoneOffset: number;
    /** Eg `114` */
    year: number;
  };
}
