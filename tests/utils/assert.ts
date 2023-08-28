import Joi from 'joi';
import type { ApifyEntryMetadata } from 'crawlee-one';

import type {
  DetailedSkCrisOrgItem,
  DetailedSkCrisPrjItem,
  DetailedSkCrisResItem,
  SimpleSkCrisOrgItem,
  SimpleSkCrisPrjItem,
  SimpleSkCrisResItem,
  SkCrisLinkedResource,
  SkCrisLinkedResourceAddress,
  SkCrisLinkedResourceCitation,
  SkCrisLinkedResourceDocument,
} from '../../src/types';

////////////////////////
// Numbers
////////////////////////
export const joiNumInt = Joi.number().integer();
export const joiNumIntNonNeg = joiNumInt.min(0);
export const joiNumIntNonNegNullable = joiNumIntNonNeg.allow(null);
export const joiNumNonNeg = Joi.number().min(0);
export const joiNumNonNegNullable = joiNumNonNeg.allow(null);

////////////////////////
// Strings
////////////////////////
export const joiStrNotEmpty = Joi.string().min(1);
export const joiStrNotEmptyNullable = joiStrNotEmpty.allow(null);

////////////////////////
// URLs
////////////////////////
export const joiUrlNotEmpty = Joi.string()
  .min(1)
  .uri({ scheme: ['http', 'https'] });
export const joiUrlNotEmptyNullable = joiUrlNotEmpty.allow(null);

////////////////////////
// Objects
////////////////////////
export const metadataValidation = Joi.object<ApifyEntryMetadata>({
  actorId: joiStrNotEmptyNullable,
  actorRunId: joiStrNotEmptyNullable,
  actorRunUrl: joiUrlNotEmptyNullable,
  contextId: joiStrNotEmpty,
  requestId: joiStrNotEmptyNullable,
  originalUrl: joiUrlNotEmptyNullable,
  loadedUrl: joiUrlNotEmptyNullable,
  dateHandled: Joi.date().iso(),
  numberOfRetries: joiNumIntNonNeg,
});

const addressValidation = Joi.object<SkCrisLinkedResourceAddress>({
  country: joiStrNotEmptyNullable,
  countryName: joiStrNotEmptyNullable,
  adrLine1: joiStrNotEmptyNullable,
  adrLine2: joiStrNotEmptyNullable,
  adrLine3: joiStrNotEmptyNullable,
  adrLine4: joiStrNotEmptyNullable,
  adrLine5: joiStrNotEmptyNullable,
  postCode: joiStrNotEmptyNullable.pattern(/[0-9]{3}\s*[0-9]{2}/, 'sk postcode'),
  cityTown: joiStrNotEmptyNullable,
  cfUri: joiStrNotEmptyNullable,
  region: joiStrNotEmptyNullable,
  district: joiStrNotEmptyNullable,
  township: joiStrNotEmptyNullable,
  type: joiStrNotEmptyNullable,
});

const linkedResourceValidation = Joi.object<SkCrisLinkedResource>({
  id: joiNumIntNonNeg,
  name: joiStrNotEmptyNullable,
  roles: Joi.array().items(Joi.object({ role: joiStrNotEmptyNullable })),
  url: joiUrlNotEmpty.pattern(/(?:\?|&)id=/, 'url has id'),
});

const linkedResourceCitationValidation = Joi.object<SkCrisLinkedResourceCitation>({
  id: joiNumIntNonNeg,
  name: joiStrNotEmptyNullable,
  roles: Joi.array().items(Joi.object({ role: joiStrNotEmptyNullable })),
  url: joiUrlNotEmpty.pattern(/(?:\?|&)id=/, 'url has id'),
  idpubl: joiNumIntNonNeg,
  desc: joiStrNotEmptyNullable,
});

const linkedResourceDocumentValidation = Joi.object<SkCrisLinkedResourceDocument>({
  id: joiNumIntNonNeg,
  name: joiStrNotEmptyNullable,
  url: joiUrlNotEmpty.pattern(/(?:\?|&)id=/, 'url has id'),
  date: Joi.object<SkCrisLinkedResourceDocument['date']>({
    date: joiNumIntNonNeg,
    day: joiNumIntNonNeg,
    hours: joiNumIntNonNeg,
    minutes: joiNumIntNonNeg,
    month: joiNumIntNonNeg,
    nanos: joiNumIntNonNeg,
    seconds: joiNumIntNonNeg,
    time: joiNumIntNonNeg,
    timezoneOffset: joiNumInt,
    year: joiNumIntNonNeg,
  }),
});

const simpleSkCrisOrgItemValidationFields: Record<
  keyof (SimpleSkCrisOrgItem & { metadata: ApifyEntryMetadata }),
  Joi.Schema
> = {
  guid: joiStrNotEmpty,
  url: joiUrlNotEmpty.pattern(/(?:\?|&)guid=/, 'url has guid'),
  name: joiStrNotEmptyNullable,
  acronym: joiStrNotEmptyNullable,
  ičo: joiStrNotEmptyNullable.pattern(/^[0-9]+$/, 'ico'),
  description: joiStrNotEmptyNullable,
  govDept: joiStrNotEmptyNullable,
  skNace: joiStrNotEmptyNullable,
  financingType: joiStrNotEmptyNullable,
  orgType: joiStrNotEmptyNullable,
  activityMain: joiStrNotEmptyNullable,
  email: Joi.array().items(joiStrNotEmptyNullable.email()),
  phone: joiStrNotEmptyNullable,
  website: joiStrNotEmptyNullable,
  certificateText: joiStrNotEmptyNullable,
  certificate: joiStrNotEmptyNullable,
  certificateStartDate: joiStrNotEmptyNullable.pattern(/[0-9]{4}-[0-9]{2}-[0-9]{2}/, 'is date'),
  certificateEndDate: joiStrNotEmptyNullable.pattern(/[0-9]{4}-[0-9]{2}-[0-9]{2}/, 'is date'),
  activitySpec: joiStrNotEmptyNullable.pattern(/[\w-]+.*?\/.*?[\w-]+.*?\/.*?[\w-]+/, 'contains words separated by 2 slashes'), // prettier-ignore
  activitySpec1: joiStrNotEmptyNullable,
  activitySpec2: joiStrNotEmptyNullable,
  activitySpec3: joiStrNotEmptyNullable,
  metadata: metadataValidation,
};

export const simpleSkCrisOrgItemValidation = Joi.object<
  SimpleSkCrisOrgItem & { metadata: ApifyEntryMetadata }
>({ ...simpleSkCrisOrgItemValidationFields });

export const detailedSkCrisOrgItemValidation = Joi.object<
  DetailedSkCrisOrgItem & { metadata: ApifyEntryMetadata }
>({
  ...simpleSkCrisOrgItemValidationFields,
  addresses: Joi.array().items(addressValidation),
  researchers: Joi.array().items(linkedResourceValidation),
  projects: Joi.array().items(linkedResourceValidation),
  parentOrgs: Joi.array().items(linkedResourceValidation),
  childOrgs: Joi.array().items(linkedResourceValidation),
  productOutputs: Joi.array().items(linkedResourceValidation),
  patentOutputs: Joi.array().items(linkedResourceValidation),
  publicationOutputs: Joi.array().items(linkedResourceValidation),
  innovationOutputs: Joi.array().items(linkedResourceValidation),
  equipmentInfra: Joi.array().items(linkedResourceValidation),
  facilityInfra: Joi.array().items(linkedResourceValidation),
  serviceInfra: Joi.array().items(linkedResourceValidation),
  addressesCount: joiNumIntNonNeg,
  researchersCount: joiNumIntNonNeg,
  projectsCount: joiNumIntNonNeg,
  parentOrgsCount: joiNumIntNonNeg,
  childOrgsCount: joiNumIntNonNeg,
  productOutputsCount: joiNumIntNonNeg,
  patentOutputsCount: joiNumIntNonNeg,
  publicationOutputsCount: joiNumIntNonNeg,
  innovationOutputsCount: joiNumIntNonNeg,
  equipmentInfraCount: joiNumIntNonNeg,
  facilityInfraCount: joiNumIntNonNeg,
  serviceInfraCount: joiNumIntNonNeg,
});

const simpleSkCrisResItemValidationFields: Record<
  keyof (SimpleSkCrisResItem & { metadata: ApifyEntryMetadata }),
  Joi.Schema
> = {
  guid: joiStrNotEmpty,
  url: joiUrlNotEmpty.pattern(/(?:\?|&)guid=/, 'url has guid'),
  fullName: joiStrNotEmptyNullable,
  datasource: joiStrNotEmptyNullable,
  industry: joiStrNotEmptyNullable,
  orgType: joiStrNotEmptyNullable,
  keywords: Joi.array().items(joiStrNotEmptyNullable),
  annotation: joiStrNotEmptyNullable,
  email: Joi.array().items(joiStrNotEmptyNullable.email()),
  website: joiStrNotEmptyNullable,
  metadata: metadataValidation,
};

export const simpleSkCrisResItemValidation = Joi.object<
  SimpleSkCrisResItem & { metadata: ApifyEntryMetadata }
>({ ...simpleSkCrisResItemValidationFields });

export const detailedSkCrisResItemValidation = Joi.object<
  DetailedSkCrisResItem & { metadata: ApifyEntryMetadata }
>({
  ...simpleSkCrisResItemValidationFields,
  organisations: Joi.array().items(linkedResourceValidation),
  projects: Joi.array().items(linkedResourceValidation),
  productOutputs: Joi.array().items(linkedResourceValidation),
  patentOutputs: Joi.array().items(linkedResourceValidation),
  publicationOutputs: Joi.array().items(linkedResourceValidation),
  innovationOutputs: Joi.array().items(linkedResourceValidation),
  citationOutputs: Joi.array().items(linkedResourceCitationValidation),
  organisationsCount: joiNumIntNonNeg,
  projectsCount: joiNumIntNonNeg,
  productOutputsCount: joiNumIntNonNeg,
  patentOutputsCount: joiNumIntNonNeg,
  publicationOutputsCount: joiNumIntNonNeg,
  innovationOutputsCount: joiNumIntNonNeg,
  citationOutputsCount: joiNumIntNonNeg,
});

const simpleSkCrisPrjItemValidationFields: Record<
  keyof (SimpleSkCrisPrjItem & { metadata: ApifyEntryMetadata }),
  Joi.Schema
> = {
  guid: joiStrNotEmpty,
  url: joiUrlNotEmpty.pattern(/(?:\?|&)guid=/, 'url has guid'),
  name: joiStrNotEmptyNullable,
  projectCode: joiStrNotEmptyNullable,
  abstract: joiStrNotEmptyNullable,
  keywords: Joi.array().items(joiStrNotEmptyNullable),
  grantCallName: joiStrNotEmptyNullable,
  awardAmountEur: joiNumNonNegNullable,
  researchType: joiStrNotEmptyNullable,
  programmeType: joiStrNotEmptyNullable,
  duration: joiStrNotEmptyNullable,
  durationStart: joiStrNotEmptyNullable.pattern(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/, 'is date'),
  durationEnd: joiStrNotEmptyNullable.pattern(/[0-9]{2}\.[0-9]{2}\.[0-9]{4}/, 'is date'),
  activitySpec: joiStrNotEmptyNullable.pattern(/[\w-]+.*?\/.*?[\w-]+.*?\/.*?[\w-]+/, 'contains words separated by 2 slashes'), // prettier-ignore
  activitySpec1: joiStrNotEmptyNullable,
  activitySpec2: joiStrNotEmptyNullable,
  activitySpec3: joiStrNotEmptyNullable,
  metadata: metadataValidation,
};

export const simpleSkCrisPrjItemValidation = Joi.object<
  SimpleSkCrisPrjItem & { metadata: ApifyEntryMetadata }
>({ ...simpleSkCrisPrjItemValidationFields });

export const detailedSkCrisPrjItemValidation = Joi.object<
  DetailedSkCrisPrjItem & { metadata: ApifyEntryMetadata }
>({
  ...simpleSkCrisPrjItemValidationFields,
  organisations: Joi.array().items(linkedResourceValidation),
  researchers: Joi.array().items(linkedResourceValidation),
  productOutputs: Joi.array().items(linkedResourceValidation),
  patentOutputs: Joi.array().items(linkedResourceValidation),
  publicationOutputs: Joi.array().items(linkedResourceValidation),
  innovationOutputs: Joi.array().items(linkedResourceValidation),
  equipmentInfra: Joi.array().items(linkedResourceValidation),
  facilityInfra: Joi.array().items(linkedResourceValidation),
  serviceInfra: Joi.array().items(linkedResourceValidation),
  documents: Joi.array().items(linkedResourceDocumentValidation),
  organisationsCount: joiNumIntNonNeg,
  researchersCount: joiNumIntNonNeg,
  productOutputsCount: joiNumIntNonNeg,
  patentOutputsCount: joiNumIntNonNeg,
  publicationOutputsCount: joiNumIntNonNeg,
  innovationOutputsCount: joiNumIntNonNeg,
  equipmentInfraCount: joiNumIntNonNeg,
  facilityInfraCount: joiNumIntNonNeg,
  serviceInfraCount: joiNumIntNonNeg,
  documentsCount: joiNumIntNonNeg,
});
