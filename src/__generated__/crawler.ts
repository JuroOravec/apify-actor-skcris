import { AllActorInputs, CrawleeOneActorRouterCtx, CrawleeOneActorInst, CrawleeOneRoute, CrawleeOneRouteHandler, CrawleeOneRouteWrapper, CrawleeOneRouteMatcher, CrawleeOneRouteMatcherFn, CrawleeOneIO, CrawleeOneTelemetry, CrawleeOneCtx, CrawleeOneArgs, crawleeOne } from "crawlee-one"
import type { BasicCrawlingContext, HttpCrawlingContext, CheerioCrawlingContext, JSDOMCrawlingContext, PlaywrightCrawlingContext, PuppeteerCrawlingContext } from "crawlee"


export type MaybePromise<T> = T | Promise<T>;

export type skcrisLabel = "orgListing" | "orgDetail" | "prjListing" | "prjDetail" | "resListing" | "resDetail";

export enum skcrisLabelEnum {
  'orgListing' = 'orgListing',
  'orgDetail' = 'orgDetail',
  'prjListing' = 'prjListing',
  'prjDetail' = 'prjDetail',
  'resListing' = 'resListing',
  'resDetail' = 'resDetail'
}

export type skcrisCtx<TInput extends Record<string, any> = AllActorInputs, TIO extends CrawleeOneIO = CrawleeOneIO, Telem extends CrawleeOneTelemetry<any, any> = CrawleeOneTelemetry<any, any>> = CrawleeOneCtx<CheerioCrawlingContext, skcrisLabel, TInput, TIO, Telem>;

export const skcrisCrawler = <TInput extends Record<string, any> = AllActorInputs, TIO extends CrawleeOneIO = CrawleeOneIO, Telem extends CrawleeOneTelemetry<any, any> = CrawleeOneTelemetry<any, any>>(args: Omit<CrawleeOneArgs<"cheerio", skcrisCtx<TInput, TIO, Telem>>, 'type'>) => crawleeOne<"cheerio", skcrisCtx<TInput, TIO, Telem>>({ ...args, type: "cheerio"});;

export type skcrisRouterContext<TInput extends Record<string, any> = AllActorInputs, TIO extends CrawleeOneIO = CrawleeOneIO, Telem extends CrawleeOneTelemetry<any, any> = CrawleeOneTelemetry<any, any>> = CrawleeOneActorRouterCtx<skcrisCtx<TInput, TIO, Telem>>;

export type skcrisActorCtx<TInput extends Record<string, any> = AllActorInputs, TIO extends CrawleeOneIO = CrawleeOneIO, Telem extends CrawleeOneTelemetry<any, any> = CrawleeOneTelemetry<any, any>> = CrawleeOneActorInst<skcrisCtx<TInput, TIO, Telem>>;

export type skcrisRoute<TInput extends Record<string, any> = AllActorInputs, TIO extends CrawleeOneIO = CrawleeOneIO, Telem extends CrawleeOneTelemetry<any, any> = CrawleeOneTelemetry<any, any>> = CrawleeOneRoute<skcrisCtx<TInput, TIO, Telem>, skcrisRouterContext<TInput, TIO, Telem>>;

export type skcrisRouteHandler<TInput extends Record<string, any> = AllActorInputs, TIO extends CrawleeOneIO = CrawleeOneIO, Telem extends CrawleeOneTelemetry<any, any> = CrawleeOneTelemetry<any, any>> = CrawleeOneRouteHandler<skcrisCtx<TInput, TIO, Telem>, skcrisRouterContext<TInput, TIO, Telem>>;

export type skcrisRouteWrapper<TInput extends Record<string, any> = AllActorInputs, TIO extends CrawleeOneIO = CrawleeOneIO, Telem extends CrawleeOneTelemetry<any, any> = CrawleeOneTelemetry<any, any>> = CrawleeOneRouteWrapper<skcrisCtx<TInput, TIO, Telem>, skcrisRouterContext<TInput, TIO, Telem>>;

export type skcrisRouteMatcher<TInput extends Record<string, any> = AllActorInputs, TIO extends CrawleeOneIO = CrawleeOneIO, Telem extends CrawleeOneTelemetry<any, any> = CrawleeOneTelemetry<any, any>> = CrawleeOneRouteMatcher<skcrisCtx<TInput, TIO, Telem>, skcrisRouterContext<TInput, TIO, Telem>>;

export type skcrisRouteMatcherFn<TInput extends Record<string, any> = AllActorInputs, TIO extends CrawleeOneIO = CrawleeOneIO, Telem extends CrawleeOneTelemetry<any, any> = CrawleeOneTelemetry<any, any>> = CrawleeOneRouteMatcherFn<skcrisCtx<TInput, TIO, Telem>, skcrisRouterContext<TInput, TIO, Telem>>;

export type skcrisOnBeforeHandler<TInput extends Record<string, any> = AllActorInputs, TIO extends CrawleeOneIO = CrawleeOneIO, Telem extends CrawleeOneTelemetry<any, any> = CrawleeOneTelemetry<any, any>> = CrawleeOneRouteHandler<skcrisCtx<TInput, TIO, Telem>, skcrisRouterContext<TInput, TIO, Telem>>;

export type skcrisOnAfterHandler<TInput extends Record<string, any> = AllActorInputs, TIO extends CrawleeOneIO = CrawleeOneIO, Telem extends CrawleeOneTelemetry<any, any> = CrawleeOneTelemetry<any, any>> = CrawleeOneRouteHandler<skcrisCtx<TInput, TIO, Telem>, skcrisRouterContext<TInput, TIO, Telem>>;

export type skcrisOnReady = <TInput extends Record<string, any> = AllActorInputs, TIO extends CrawleeOneIO = CrawleeOneIO, Telem extends CrawleeOneTelemetry<any, any> = CrawleeOneTelemetry<any, any>>(actor: skcrisActorCtx<TInput, TIO, Telem>) => MaybePromise<void>;;