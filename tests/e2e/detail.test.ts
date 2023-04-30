import { describe, it, vi, beforeEach, expect } from 'vitest';
import Joi from 'joi';
import { runActorTest } from 'apify-actor-utils';

import {
  simpleSkCrisPrjItemValidation,
  simpleSkCrisOrgItemValidation,
  simpleSkCrisResItemValidation,
  detailedSkCrisPrjItemValidation,
  detailedSkCrisOrgItemValidation,
  detailedSkCrisResItemValidation,
} from '../utils/assert';
import { run } from '../../src/actor';
import type {
  DetailedSkCrisOrgItemLinkedResources,
  DetailedSkCrisPrjItemLinkedResources,
  DetailedSkCrisResItemLinkedResources,
  ResourceType,
} from '../../src/types';
import type { ActorInput } from '../../src/config';

const log = (...args) => console.log(...args);
const runActor = () => run({ useSessionPool: false, maxRequestRetries: 0 });

const detailUrls: {
  type: ResourceType;
  simpleSchema: Joi.ObjectSchema;
  detailedSchema: Joi.ObjectSchema;
  expectedCounts: object;
  url: string;
}[] = [
  // Note: Project profile with nice spread of linked resource
  {
    type: 'prj',
    simpleSchema: simpleSkCrisPrjItemValidation,
    detailedSchema: detailedSkCrisPrjItemValidation,
    expectedCounts: {
      researchersCount: 3,
      productOutputsCount: 1,
      patentOutputsCount: 2,
      publicationOutputsCount: 1,
      innovationOutputsCount: 3,
      equipmentInfraCount: 2,
      facilityInfraCount: 1,
      serviceInfraCount: 0,
      documentsCount: 0,
    } as Partial<DetailedSkCrisPrjItemLinkedResources>,
    url: 'https://www.skcris.sk/portal/register-projects?p_p_id=projectSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_projectSearchResult_WAR_cvtiappweb_javax.portlet.action=projectgodetail&guid=cfProj_20804&lang=sk_SK',
  },
  // Note: Organisation with nice spread of linked resources
  {
    type: 'org',
    simpleSchema: simpleSkCrisOrgItemValidation,
    detailedSchema: detailedSkCrisOrgItemValidation,
    expectedCounts: {
      addressesCount: 1,
      researchersCount: 2,
      projectsCount: 1,
      parentOrgsCount: 1,
      childOrgsCount: 1,
      productOutputsCount: 0,
      patentOutputsCount: 5,
      publicationOutputsCount: 12,
      innovationOutputsCount: 0,
      equipmentInfraCount: 4,
      facilityInfraCount: 1,
      serviceInfraCount: 0,
    } as Partial<DetailedSkCrisOrgItemLinkedResources>,
    url: 'https://www.skcris.sk/portal/register-organizations;jsessionid=35dade39479ee9635c73295a617e?p_p_id=organisationSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_organisationSearchResult_WAR_cvtiappweb_javax.portlet.action=organizationgodetail&guid=cfOrg_669&lang=sk_SK',
  },
  // Note: Researcher profile with a lot of patents
  {
    type: 'res',
    simpleSchema: simpleSkCrisResItemValidation,
    detailedSchema: detailedSkCrisResItemValidation,
    expectedCounts: {
      productOutputsCount: 0,
      patentOutputsCount: 11,
      publicationOutputsCount: 2,
      innovationOutputsCount: 0,
      citationOutputsCount: 1,
    } as Partial<DetailedSkCrisResItemLinkedResources>,
    url: 'https://www.skcris.sk/portal/register-researchers?p_p_id=researcherSearchResult_WAR_cvtiappweb&p_p_lifecycle=1&p_p_state=normal&p_p_mode=view&p_p_col_id=column-3&p_p_col_pos=2&p_p_col_count=3&_researcherSearchResult_WAR_cvtiappweb_javax.portlet.action=godetail&guid=cfPers_17796&lang=sk',
  },
];

describe(
  'detail',
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

    detailUrls.forEach(({ type, url, simpleSchema }) => {
      it(`extracts simple entries from ${type} page`, () => {
        expect.assertions(1);

        return runActorTest<any, ActorInput>({
          vi,
          input: {
            startUrls: [url],
            entryIncludeLinkedResources: false,
            logLevel: 'debug',
          },
          runActor,
          onPushData: async (data, done) => {
            expect(data.length).toBeGreaterThan(0);
            data.forEach((d) => {
              Joi.assert(d, simpleSchema);
            });
          },
        });
      });
    });

    detailUrls.forEach(({ type, url, detailedSchema, expectedCounts }) => {
      it(`extracts detailed entries from ${type} page`, () => {
        expect.assertions(2);

        return runActorTest<any, ActorInput>({
          vi,
          input: {
            startUrls: [url],
            entryIncludeLinkedResources: true,
            logLevel: 'debug',
          },
          runActor,
          onPushData: async (data, done) => {
            expect(data.length).toBeGreaterThan(0);
            data.forEach((d) => {
              Joi.assert(d, detailedSchema);
              expect(d).toMatchObject(expectedCounts);
            });
          },
        });
      });
    });
  },
  { timeout: 30_000 }
);
