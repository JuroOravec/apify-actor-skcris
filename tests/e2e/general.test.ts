import { describe, it, vi, beforeEach, expect } from 'vitest';
import Joi from 'joi';
import { runActorTest } from 'apify-actor-utils';

import { datasetTypeToUrl } from '../../src/constants';
import type { DatasetType, SkCrisActorInput } from '../../src/types';
import { run } from '../../src/actor';
import {
  simpleSkCrisOrgItemValidation,
  simpleSkCrisPrjItemValidation,
  simpleSkCrisResItemValidation,
} from '../utils/assert';

const log = (...args) => console.log(...args);
const runActor = () => run({ useSessionPool: false, maxRequestRetries: 0 });

const testCases: {
  datasetType: DatasetType;
  expectedUrl: string;
  schema: Joi.ObjectSchema;
}[] = [
  {
    datasetType: 'organisations',
    expectedUrl: datasetTypeToUrl.organisations,
    schema: simpleSkCrisOrgItemValidation,
  },
  {
    datasetType: 'researchers',
    expectedUrl: datasetTypeToUrl.researchers,
    schema: simpleSkCrisResItemValidation,
  },
  {
    datasetType: 'projects',
    expectedUrl: datasetTypeToUrl.projects,
    schema: simpleSkCrisPrjItemValidation,
  },
];

describe(
  'general',
  () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    testCases.forEach(({ datasetType, expectedUrl, schema }) => {
      it(`extracts ${datasetType} when datasetType=${datasetType}`, () => {
        const batchQueueLengths = [1, 4]; // First is resolved dataset type, second is 4 entries per page
        const numOfPushDataCalls = 4; // The 4 entries on first page
        const numOfAssertCalls = 8; // 2 * 2 in onBatchAddRequests, and 4 * 1 onPushData

        expect.assertions(numOfAssertCalls);
        let calls = 0;
        const queueLengths = batchQueueLengths.slice();

        return runActorTest<any, SkCrisActorInput>({
          vi,
          input: {
            datasetType: datasetType as DatasetType,
            listingFilterMaxCount: 3,
            entryIncludeLinkedResources: false,
            logLevel: 'debug',
            listingItemsPerPage: 4,
          },
          runActor,
          onBatchAddRequests: (reqs) => {
            const expectedLength = queueLengths.shift();

            expect(reqs).toHaveLength(expectedLength!);

            // Check that the dataset type got resolved correctly
            if (expectedLength === 1) {
              expect(reqs[0].url).toBe(expectedUrl);
            } else {
              // Check that the entry URLs point to right path
              expect(
                reqs.every((req) => req.url.startsWith(expectedUrl) && req.url.includes('guid'))
              );
            }
          },
          onPushData: async (data, done) => {
            calls += 1;
            expect(data.length).toBeGreaterThan(0);

            data.forEach((d) => Joi.assert(d, schema));
            if (calls >= numOfPushDataCalls) done();
          },
        });
      });
    });
  },
  { timeout: 40_000 }
);
