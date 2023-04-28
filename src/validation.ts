import Joi from 'joi';
import { pick } from 'lodash';
import { LOG_LEVEL } from 'apify-actor-utils';

import { DATASET_TYPE, REGION_TYPE } from './types';
import type { ActorInput, CustomActorInput } from './config';
import { alphabet, datasetTypeToUrl } from './constants';

type DefaultActorInput = Omit<ActorInput, keyof CustomActorInput>;

const defaultInputValidationFields: Record<keyof DefaultActorInput, Joi.Schema> = {
  proxy: Joi.object().optional(), // NOTE: Expand this type?
  logLevel: Joi.string().valid(...LOG_LEVEL).optional(), // prettier-ignore

  navigationTimeoutSecs: Joi.number().integer().min(0).optional(),
  ignoreSslErrors: Joi.boolean().optional(),
  additionalMimeTypes: Joi.array().items(Joi.string().min(1)).optional(),
  suggestResponseEncoding: Joi.string().min(1).optional(),
  forceResponseEncoding: Joi.string().min(1).optional(),
  requestHandlerTimeoutSecs: Joi.number().integer().min(0).optional(),
  maxRequestRetries: Joi.number().integer().min(0).optional(),
  maxRequestsPerCrawl: Joi.number().integer().min(0).optional(),
  maxRequestsPerMinute: Joi.number().integer().min(0).optional(),
  minConcurrency: Joi.number().integer().min(0).optional(),
  maxConcurrency: Joi.number().integer().min(0).optional(),
  keepAlive: Joi.boolean().optional(),
};

const inputValidationSchema = Joi.object<ActorInput>({
  ...defaultInputValidationFields,
  datasetType: Joi.string().valid(...DATASET_TYPE).optional(), // prettier-ignore
  startUrls: Joi.array().optional(),
  entryIncludeLinkedResources: Joi.boolean().optional(),
  listingFilterFirstLetter: Joi.string().valid(...alphabet.split('')).optional(), // prettier-ignore
  listingFilterRegion: Joi.string().valid(...REGION_TYPE).optional(), // prettier-ignore
  listingFilterMaxCount: Joi.number().min(0).integer().optional(),
  listingItemsPerPage: Joi.number().min(0).integer().optional(),
  listingCountOnly: Joi.boolean().optional(),
});

export const validateInput = (input: ActorInput | null) => {
  Joi.assert(input, inputValidationSchema);

  if (!input?.startUrls && !input?.datasetType) {
    throw Error(
      `Missing instruction for scraping - either startUrls or datasetType MUST be specified. INPUT: ${JSON.stringify(
        input
      )}`
    );
  }

  if (input.startUrls && input.datasetType) {
    throw Error(
      `Ambiguous instruction for scraping - only ONE of startUrls or datasetType MUST be specified. INPUT: ${JSON.stringify(
        input
      )}`
    );
  }

  if (!input.startUrls && !datasetTypeToUrl[input.datasetType!]) {
    throw Error(`Invalid value for datasetType option. Got ${input.datasetType}, but allowed values are ${JSON.stringify(Object.keys(datasetTypeToUrl))} `); // prettier-ignore
  }
};

export const pickCrawlerInputFields = <T extends DefaultActorInput>(config: T) =>
  pick(config, [
    'navigationTimeoutSecs',
    'ignoreSslErrors',
    'additionalMimeTypes',
    'suggestResponseEncoding',
    'forceResponseEncoding',
    'requestHandlerTimeoutSecs',
    'maxRequestRetries',
    'maxRequestsPerCrawl',
    'maxRequestsPerMinute',
    'minConcurrency',
    'maxConcurrency',
    'keepAlive',
  ]);
