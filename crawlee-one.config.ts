import type { CrawleeOneConfig } from 'crawlee-one';

const config: CrawleeOneConfig = {
  version: 1,
  schema: {
    crawlers: {
      skcris: {
        type: 'cheerio',
        routes: ['orgListing', 'orgDetail', 'prjListing', 'prjDetail', 'resListing', 'resDetail'],
      },
    },
  },
};

export default config;
