/* eslint-disable @typescript-eslint/no-unused-vars */
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

const defaultTags = ["UNAUTHORIZED", "UNKNOWN_ERROR"] as const;

type DefaultTags = (typeof defaultTags)[number];

function concatErrorCache<T, ID>(
  existingCache: CacheList<T, ID>,
  error: FetchBaseQueryError | undefined
): CacheList<T, ID> {
  if (error && "status" in error && error.status === 401) {
    return [...existingCache, "UNAUTHORIZED"];
  }

  return [...existingCache, "UNKNOWN_ERROR"];
}

export interface CacheItem<T, ID> {
  type: T;
  id: ID;
}

export interface CacheType<T> {
  type: T;
}

export type CacheList<T, ID> = Array<
  CacheItem<T, "LIST"> | CacheItem<T, ID> | DefaultTags
>;

type InnerProvidesList<T> = <
  Results extends Array<{ id: unknown }>,
  Error extends FetchBaseQueryError,
>(
  results: Results | undefined,
  error: Error | undefined
) => CacheList<T, Results[number]["id"]>;

export const providesList =
  <T extends string>(type: T): InnerProvidesList<T> =>
  (results, error) => {
    if (results) {
      return [
        { type, id: "LIST" },
        ...results.map(({ id }) => ({ type, id }) as const),
      ];
    }

    return concatErrorCache([{ type, id: "LIST" }], error);
  };

export const invalidatesList =
  <T extends string>(type: T) =>
  (): readonly [CacheItem<T, "LIST">] =>
    [{ type, id: "LIST" }] as const;

type InnerProvidesNestedList<T> = <
  Results extends { data: Array<{ id: unknown }> },
  Error extends FetchBaseQueryError,
>(
  results: Results | undefined,
  error: Error | undefined
) => CacheList<T, Results["data"][number]["id"]>;

export const providesNestedList =
  <T extends string>(type: T): InnerProvidesNestedList<T> =>
  (results, error) => {
    if (results) {
      return [
        { type, id: "LIST" },
        ...results.data.map(({ id }) => ({ type, id }) as const),
      ];
    }

    return concatErrorCache([{ type, id: "LIST" }], error);
  };

export const cacheByIdArg =
  <T extends string>(type: T) =>
  <ID, Result = undefined, Error = undefined>(
    result: Result,
    error: Error,
    id: ID
  ): readonly [CacheItem<T, ID>] =>
    [{ type, id }] as const;

export const cacheByIdArgProperty =
  <T extends string>(type: T) =>
  <Arg extends { id: unknown }, Result = undefined, Error = undefined>(
    result: Result,
    error: Error,
    arg: Arg
  ): readonly [CacheItem<T, Arg["id"]>] | [] =>
    [{ type, id: arg.id }] as const;

export const providesProperty =
  <T extends string>(type: T) =>
  <Arg = undefined, Result = undefined, Error = undefined>(
    _result: Result,
    _error: Error,
    _arg: Arg
  ): readonly [CacheType<T>] | [] => [{ type }];

export const invalidatesUnauthorized =
  () =>
  <Arg = undefined, Result = undefined, Error = undefined>(
    _result: Result,
    _error: Error,
    _arg: Arg
  ): ["UNAUTHORIZED"] => ["UNAUTHORIZED"];

export const invalidatesUnknownErrors =
  () =>
  <Arg = undefined, Result = undefined, Error = undefined>(
    _result: Result,
    _error: Error,
    _arg: Arg
  ): ["UNKNOWN_ERROR"] => ["UNKNOWN_ERROR"];

export const cacher = {
  defaultTags,
  providesList,
  providesProperty,
  invalidatesList,
  providesNestedList,
  cacheByIdArg,
  cacheByIdArgProperty,
  invalidatesUnauthorized,
  invalidatesUnknownErrors,
};
