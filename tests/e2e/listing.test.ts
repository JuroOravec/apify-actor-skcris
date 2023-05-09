import { describe, it, vi, beforeEach, expect } from 'vitest';
import Joi from 'joi';
import { runActorTest } from 'apify-actor-utils';

import {
  simpleSkCrisOrgItemValidation,
  simpleSkCrisResItemValidation,
  simpleSkCrisPrjItemValidation,
} from '../utils/assert';
import { run } from '../../src/actor';
import { datasetTypeToUrl } from '../../src/constants';
import type { ActorInput } from '../../src/config';

const log = (...args) => console.log(...args);
const runActor = () => run({ useSessionPool: false, maxRequestRetries: 0 });

const testCases: {
  name: string;
  url: string;
  schema: Joi.ObjectSchema;
}[] = [
  { name: 'org', url: datasetTypeToUrl.organisations, schema: simpleSkCrisOrgItemValidation },
  { name: 'res', url: datasetTypeToUrl.researchers, schema: simpleSkCrisResItemValidation },
  { name: 'prj', url: datasetTypeToUrl.projects, schema: simpleSkCrisPrjItemValidation },
];

const filterTestCases: ActorInput[] = [
  { listingFilterRegion: 'nitra' },
  { listingFilterFirstLetter: 'c' },
  { listingFilterRegion: 'nitra', listingFilterFirstLetter: 'c' },
];

describe(
  'listing',
  () => {
    beforeEach(() => {
      vi.resetAllMocks();

      vi.mock('pkginfo', () => ({
        default: (obj, { include }) => {
          obj.exports = obj.exports || {};
          obj.exports.name = 'test_package_name';
        },
      }));
    });

    testCases.forEach(({ name, url, schema }) => {
      it(`extracts entries from ${name} listing`, async () => {
        const batchQueueLengths = [1, 4, 4, 4]; // First is inial URL, then 3 pages of 4 entries per page
        const numOfAssertCalls = 21; // (1 + 3) * 2 in onBatchAddRequests, and 12 * 1 onPushData
        const pushedDataTotal = 12;

        expect.assertions(numOfAssertCalls);
        const queueLengths = batchQueueLengths.slice();
        let pushedDataCount = 0;

        await runActorTest<any, ActorInput>({
          vi,
          input: {
            startUrls: [url],
            listingFilterMaxCount: 10,
            entryIncludeLinkedResources: false,
            logLevel: 'debug',
            listingItemsPerPage: 4,
            includePersonalData: true,
          },
          runActor,
          onBatchAddRequests: (reqs) => {
            const expectedLength = queueLengths.shift();
            expect(reqs).toHaveLength(expectedLength!);

            // Check that the entry URLs point to right path
            expect(reqs.every((req) => req.url.startsWith(url) && req.url.includes('guid')));
          },
          onPushData: async (data, done) => {
            expect(data.length).toBe(1);
            data.forEach((d) => Joi.assert(d, schema));
            pushedDataCount += 1;
          },
        });
        expect(pushedDataTotal).toBe(12);
      });
    });

    it(`only prints the count if listingCountOnly=true`, () => {
      const batchQueueLengths = [1]; // First is inial URL, then 3 pages of 4 entries per page
      const numOfAssertCalls = 1; // (1 + 3) * 2 in onBatchAddRequests, and 12 * 1 onPushData

      expect.assertions(numOfAssertCalls);
      const queueLengths = batchQueueLengths.slice();

      return runActorTest<any, ActorInput>({
        vi,
        input: {
          startUrls: [datasetTypeToUrl.organisations],
          listingFilterMaxCount: 10,
          entryIncludeLinkedResources: false,
          logLevel: 'debug',
          listingItemsPerPage: 4,
          includePersonalData: true,
          listingCountOnly: true,
        },
        runActor,
        onBatchAddRequests: (reqs) => {
          const expectedLength = queueLengths.shift();
          expect(reqs).toHaveLength(expectedLength!);
        },
        onPushData: async (data, done) => {
          throw Error('We should not get here');
        },
      });
    });

    filterTestCases.forEach((input) => {
      it(`extracts entries from listing with filter ${JSON.stringify(input)}`, async () => {
        const batchQueueLengths = [1, 3, 3]; // First is inial URL, then 2 pages of 3 entries per page
        const numOfAssertCalls = 13; // (1 + 3) * 2 in onBatchAddRequests, and 12 * 1 onPushData
        const pushedDataTotal = 6;

        expect.assertions(numOfAssertCalls);
        const queueLengths = batchQueueLengths.slice();
        let pushedDataCount = 0;

        await runActorTest<any, ActorInput>({
          vi,
          input: {
            startUrls: [datasetTypeToUrl.projects],
            listingFilterMaxCount: 6,
            entryIncludeLinkedResources: false,
            logLevel: 'debug',
            listingItemsPerPage: 3,
            includePersonalData: true,
            ...input,
          },
          runActor,
          onBatchAddRequests: (reqs) => {
            const expectedLength = queueLengths.shift();
            expect(reqs).toHaveLength(expectedLength!);

            // Check that the entry URLs point to right path
            expect(reqs.every((req) => req.url.startsWith(datasetTypeToUrl.projects) && req.url.includes('guid'))); // prettier-ignore
          },
          onPushData: async (data, done) => {
            expect(data.length).toBe(1);
            data.forEach((d) => Joi.assert(d, simpleSkCrisPrjItemValidation));
            pushedDataCount += 1;
          },
        });
        expect(pushedDataCount).toBe(pushedDataTotal);
      });
    });

    it(`handles single page of results`, async () => {
      const batchQueueLengths = [1, 1];
      const numOfAssertCalls = 6;
      const pushedDataTotal = 1;

      expect.assertions(numOfAssertCalls);
      const queueLengths = batchQueueLengths.slice();
      let pushedDataCount = 0;

      await runActorTest<any, ActorInput>({
        vi,
        input: {
          startUrls: [datasetTypeToUrl.projects],
          listingFilterMaxCount: 6,
          entryIncludeLinkedResources: false,
          logLevel: 'debug',
          listingItemsPerPage: 3,
          listingFilterFirstLetter: 'q',
          listingFilterRegion: 'nitra',
          includePersonalData: true,
        },
        runActor,
        onBatchAddRequests: (reqs) => {
          const expectedLength = queueLengths.shift();
          expect(reqs).toHaveLength(expectedLength!);

          // Check that the entry URLs point to right path
          expect(reqs.every((req) => req.url.startsWith(datasetTypeToUrl.projects) && req.url.includes('guid'))); // prettier-ignore
        },
        onPushData: async (data, done) => {
          expect(data.length).toBe(1);
          data.forEach((d) => Joi.assert(d, simpleSkCrisPrjItemValidation));
          pushedDataCount += 1;
        },
      });
      expect(pushedDataCount).toBe(pushedDataTotal);
    });

    it(`handles empty page`, async () => {
      const batchQueueLengths = [1];
      const numOfAssertCalls = 3;
      const pushedDataTotal = 0;

      expect.assertions(numOfAssertCalls);
      const queueLengths = batchQueueLengths.slice();
      let pushedDataCount = 0;

      await runActorTest<any, ActorInput>({
        vi,
        input: {
          startUrls: [datasetTypeToUrl.projects],
          listingFilterMaxCount: 6,
          entryIncludeLinkedResources: false,
          logLevel: 'debug',
          listingItemsPerPage: 3,
          listingFilterFirstLetter: 'q',
          listingFilterRegion: 'presov',
          includePersonalData: true,
        },
        runActor,
        onBatchAddRequests: (reqs) => {
          const expectedLength = queueLengths.shift();
          expect(reqs).toHaveLength(expectedLength!);

          // Check that the entry URLs point to right path
          expect(reqs.every((req) => req.url.startsWith(datasetTypeToUrl.projects) && req.url.includes('guid'))); // prettier-ignore
        },
        onPushData: async (data, done) => {
          expect(data.length).toBe(1);
          data.forEach((d) => Joi.assert(d, simpleSkCrisPrjItemValidation));
          pushedDataCount += 1;
        },
      });
      expect(pushedDataCount).toBe(pushedDataTotal);
    });
  },
  { timeout: 60_000 }
);
