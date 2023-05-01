import Joi from 'joi';
import {
  crawlerInputValidationFields,
  loggingInputValidationFields,
  privacyInputValidationFields,
  proxyInputValidationFields,
} from 'apify-actor-utils';

import { DATASET_TYPE, REGION_TYPE } from './types';
import type { ActorInput } from './config';
import { alphabet, datasetTypeToUrl } from './constants';

const inputValidationSchema = Joi.object<ActorInput>({
  ...crawlerInputValidationFields,
  ...proxyInputValidationFields,
  ...loggingInputValidationFields,
  ...privacyInputValidationFields,

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
