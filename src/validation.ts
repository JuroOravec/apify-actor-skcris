import Joi from 'joi';
import { allActorInputValidationFields } from 'crawlee-one';

import { DATASET_TYPE, REGION_TYPE } from './types';
import type { ActorInput } from './config';
import { alphabet, datasetTypeToUrl } from './constants';

const inputValidationSchema = Joi.object<ActorInput>({
  ...allActorInputValidationFields,

  datasetType: Joi.string().valid(...DATASET_TYPE).optional(), // prettier-ignore
  startUrls: Joi.array().optional(),
  entryIncludeLinkedResources: Joi.boolean().optional(),
  listingFilterFirstLetter: Joi.string().valid(...alphabet.split('')).optional(), // prettier-ignore
  listingFilterRegion: Joi.string().valid(...REGION_TYPE).optional(), // prettier-ignore
  listingItemsPerPage: Joi.number().min(0).integer().optional(),
  listingCountOnly: Joi.boolean().optional(),
} satisfies Record<keyof ActorInput, Joi.Schema>);

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
