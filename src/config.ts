import { capitalize } from 'lodash';
import {
  createActorConfig,
  createActorInputSchema,
  createBooleanField,
  createIntegerField,
  createStringField,
  createArrayField,
  Field,
  ActorInputSchema,
  createActorOutputSchema,
} from 'apify-actor-config';
import {
  CrawlerConfigActorInput,
  LoggingActorInput,
  OutputActorInput,
  PrivacyActorInput,
  ProxyActorInput,
  crawlerInput,
  loggingInput,
  outputInput,
  privacyInput,
  proxyInput,
} from 'apify-actor-utils';

import { alphabet, regionFilterNames } from './constants';
import { DATASET_TYPE, DatasetType, REGION_TYPE, RegionType } from './types';
import actorSpec from './actorspec';

const createTagFn = (tag: string) => (t: string) => `<${tag}>${t}</${tag}>`;
const strong = createTagFn('strong');
const newLine = (repeats = 1) => '<br/>'.repeat(repeats);

export interface CustomActorInput {
  /** Choose what kind of data you want to extract - Organisations, researchers, projects, ... */
  datasetType?: DatasetType;
  /** URLs to start with */
  startUrls?: string[];
  /**
   * If checked, then, when scraping entry details, the scraper will also fetch all relationships to linked resources (eg org's researchers, org's projects, ...).
   *
   * If un-checked, only the data from the entry HTML is extracted.
   *
   * Note 1: This is different type of data than what is scraped from individual entries, as this data describes the relationships.
   *
   * Note 2: This dramatically increases the running time (full dataset takes days, up to a week).
   * Consider that the whole DB has more than 500,000 entries of all kinds.
   * No matter which dataset you obtain, the entries WILL have relationships to all the other entries.
   *
   * For details, please refer to http://apify.com/store/jurooravec/profesia-sk-scraper#output */
  entryIncludeLinkedResources?: boolean;
  /**
   * If set, only entries starting with this letter will be extracted.
   *
   * NOTE: Only characters A-Z are supported. Letters with diacritics (eg Á),
   * can be found under the base character (eg A).
   */
  listingFilterFirstLetter?: string;
  /** If set, only entries within this region will be extracted */
  listingFilterRegion?: RegionType;
  /** If set, only up to this number of entries will be extracted */
  listingFilterMaxCount?: number;
  /**
   * If set, this number of entries will be extracted per page.
   *
   * NOTE: Default is set to 500. This balances 1) slow server start-up time, 2) total server response time, 3) the risk of the request failure.
   */
  listingItemsPerPage?: number;
  /** If checked, no data is extracted. Instead, the count of matched entries is printed in the log. */
  listingCountOnly?: boolean;
}

/** Shape of the data passed to the actor from Apify */
export interface ActorInput
  // Include the common fields in input
  extends CrawlerConfigActorInput,
    LoggingActorInput,
    ProxyActorInput,
    PrivacyActorInput,
    OutputActorInput,
    CustomActorInput {}

const customActorInput: Record<keyof CustomActorInput, Field> = {
  datasetType: createStringField<DatasetType>({
    type: 'string',
    title: 'Dataset type',
    description: `Use this option if you want to scrape a whole dataset,
        not just specific URLs.${newLine(2)}
        This option is ignored if ${strong('Start URLs:')} are given`,
    editor: 'select',
    example: 'organisations',
    default: 'organisations',
    prefill: 'organisations',
    enum: DATASET_TYPE,
    enumTitles: DATASET_TYPE.map(capitalize),
    nullable: true,
  }),
  startUrls: createArrayField({
    title: 'Start URLs',
    type: 'array',
    description: `Select specific URLs to scrape. This option takes precedence over
        ${strong('Dataset type')}.${newLine(2)}
        - If the URL is a listing page, all entries of that list are extracted.${newLine()}
        - If the URL is a details page, only that page is extracted.`,
    editor: 'requestListSources',
  }),
  entryIncludeLinkedResources: createBooleanField({
    title: 'Include linked resources',
    type: 'boolean',
    description: `If checked, the scraper will obtain more detailed info by downloading
        linked resources (e.g. org's researchers, org's projects, ...).${newLine(2)}
        If un-checked, only the data from the detail page is extracted.${newLine(2)}
        Note 1: This is a different type of data than what is scraped from individual entries,
        as this data describes the ${strong('relationships')}.${newLine(2)}
        Note 2: This dramatically increases the running time (full dataset takes days, up to a week).${newLine()}
        Consider that the whole DB has more than 500,000 entries of all kinds.${newLine()}
        Whichever dataset you choose, the downloaded entries WILL have relationships
        to those 500k entries.${newLine(2)}
        For details, please refer to ${actorSpec.actor.publicUrl}#output`,
    example: true,
    default: false,
  }),
  listingFilterFirstLetter: createStringField({
    type: 'string',
    title: 'Filter by first letter',
    // prettier-ignore
    description: `If set, only entries starting with this letter will be extracted.${newLine(2)}
        ${strong('NOTE:')} Only characters A-Z are supported. Letters with diacritics (eg Á), can be
        found under the base character (eg A).`,
    editor: 'select',
    example: 'a',
    enum: alphabet.split(''),
    nullable: true,
  }),
  listingFilterRegion: createStringField<RegionType>({
    type: 'string',
    title: 'Filter by region (kraj)',
    description: 'If set, only entries within this region will be extracted.',
    editor: 'select',
    example: 'bratislava',
    enum: REGION_TYPE,
    enumTitles: REGION_TYPE.map((reg) => regionFilterNames[reg]),
    nullable: true,
  }),
  listingFilterMaxCount: createIntegerField({
    title: 'Target number of results',
    type: 'integer',
    description: `If set, only up to this number of entries will be extracted.
        The actual number of entries might be higher than this due to multiple
        pages being scraped at the same time.`,
    prefill: 100,
    example: 100,
    minimum: 1,
    nullable: true,
  }),
  listingItemsPerPage: createIntegerField({
    title: 'Results per page',
    type: 'integer',
    description: `If set, this number of entries will be extracted per page.${newLine(2)}
        ${strong('NOTE:')} Default is set to 500. This balances 1) slow server start-up time,
        2) total server response time, 3) the risk of the request failure.`,
    default: 500,
    prefill: 500,
    example: 500,
    minimum: 1,
    nullable: true,
  }),
  listingCountOnly: createBooleanField({
    title: 'Count the total matched results',
    type: 'boolean',
    description: `If checked, no data is extracted. Instead, the count of matched results is printed in the log.`,
    default: false,
    groupCaption: 'Troubleshooting options',
    groupDescription: 'Use these to verify that your custom startUrls are correct',
    nullable: true,
  }),
};

// Customize the default options
crawlerInput.requestHandlerTimeoutSecs.prefill = 60 * 60 * 4;
crawlerInput.maxRequestRetries.default = 10;
crawlerInput.maxRequestRetries.prefill = 10;
crawlerInput.maxConcurrency.default = 5;
crawlerInput.maxConcurrency.prefill = 5;

const inputSchema = createActorInputSchema<ActorInputSchema<Record<keyof ActorInput, Field>>>({
  schemaVersion: 1,
  title: actorSpec.actor.title,
  description: `Configure the ${actorSpec.actor.title}. ${newLine(2)}
      ${strong('NOTE:')} Either ${strong('Dataset type')} or
      ${strong('Start URLs')} must be given.`,
  type: 'object',
  properties: {
    ...customActorInput,
    // Include the common fields in input
    ...proxyInput,
    ...privacyInput,
    ...outputInput,
    ...crawlerInput,
    ...loggingInput,
  },
});

const outputSchema = createActorOutputSchema({
  actorSpecification: 1,
  fields: {},
  views: {},
});

const config = createActorConfig({
  actorSpecification: 1,
  name: actorSpec.platform.actorId,
  title: actorSpec.actor.title,
  description: actorSpec.actor.shortDesc,
  version: '1.0',
  dockerfile: './Dockerfile',
  input: inputSchema,
  storages: {
    dataset: outputSchema,
  },
});

export default config;
