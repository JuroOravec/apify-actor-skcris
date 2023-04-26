import { LogLevel as ApifyLogLevel } from 'apify';
import type { RouteHandlerWrapper } from 'apify-actor-utils';
import type { CrawlingContext } from 'crawlee';

import type { ArrVal } from '../utils/types';

export const LOG_LEVEL = ['debug', 'info', 'warn', 'error', 'off'] as const; // prettier-ignore
export type LogLevel = ArrVal<typeof LOG_LEVEL>;

export const logLevelToApify: Record<LogLevel, ApifyLogLevel> = {
  off: ApifyLogLevel.OFF,
  debug: ApifyLogLevel.DEBUG,
  info: ApifyLogLevel.INFO,
  warn: ApifyLogLevel.WARNING,
  error: ApifyLogLevel.ERROR,
};

export const logLevelHandlerWrapper = <T extends CrawlingContext>(
  logLevel: LogLevel
): RouteHandlerWrapper<T> => {
  return (handler) => {
    return (ctx, ...args) => {
      ctx.log.info(`Setting log level to ${logLevel}`);
      ctx.log.setLevel(logLevelToApify[logLevel]);
      return handler(ctx, ...args);
    };
  };
};
