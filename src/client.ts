import { getContent, getContents } from "./generated/koya.ts";
import type { GetContentsParams } from "./generated/koya.ts";
import type { Transport } from "./http.ts";
import type {
  AnyModels,
  Delivered,
  FieldName,
  IncludePath,
  ListModels,
  ModelMap,
  ObjectModels,
  Selected,
} from "./models.ts";

export interface ClientOptions {
  /** The server, e.g. `https://cms.example.com`. */
  baseUrl: string;
  space: string;
  /** Made on the space's Keys page. Safe to ship to a browser: it only reads what is published. */
  deliveryKey: string;
  fetch?: typeof globalThis.fetch;
}

export interface ItemQuery<M extends ModelMap, K extends keyof M, I extends string, F extends string> {
  /** Reference fields to embed, dotted for nesting: `["tags", "author.avatar"]`. */
  include?: readonly I[];
  /** Keys to keep in each content; system fields not named are dropped too. */
  fields?: readonly F[];
  /** Serves the draft instead, for previews. */
  draftKey?: string;
}

export interface ListQuery<M extends ModelMap, K extends keyof M, I extends string, F extends string>
  extends Omit<ItemQuery<M, K, I, F>, "draftKey"> {
  limit?: number;
  offset?: number;
  /** Field names, `-` for descending: `["-publishedAt", "title"]`. */
  orders?: string | readonly string[];
  /** `title[contains]lisp[and]publishedAt[exists]`; see the delivery API. */
  filters?: string;
}

export interface ContentList<T> {
  contents: T[];
  totalCount: number;
  offset: number;
  limit: number;
}

type Result<M extends ModelMap, K extends keyof M, I extends string, F extends string> = Selected<Delivered<M, K, I>, F>;

function joined(value: string | readonly string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "string" ? value : value.join(",");
}

function params(query: ListQuery<any, any, string, string> & { draftKey?: string } = {}): GetContentsParams {
  const out: GetContentsParams = {};
  if (query.limit !== undefined) out.limit = query.limit;
  if (query.offset !== undefined) out.offset = query.offset;
  const orders = joined(query.orders);
  if (orders) out.orders = orders;
  if (query.filters) out.filters = query.filters;
  const fields = joined(query.fields);
  if (fields) out.fields = fields;
  const include = joined(query.include);
  if (include) out.include = include;
  if (query.draftKey) out.draftKey = query.draftKey;
  return out;
}

/**
 * A delivery API client for one space. Pass the `KoyaModels` that `koya types`
 * generates to type every content by its model.
 */
export function createClient<M extends ModelMap = AnyModels>(options: ClientOptions) {
  const transport: Transport = { baseUrl: options.baseUrl, deliveryKey: options.deliveryKey, fetch: options.fetch };
  const { space } = options;

  return {
    /** A page of published contents of a `list` model, newest published first by default. */
    getList<K extends ListModels<M>, const I extends IncludePath<M, K> = never, const F extends FieldName<M, K> = never>(
      model: K,
      query?: ListQuery<M, K, I, F>,
    ): Promise<ContentList<Result<M, K, I, F>>> {
      return getContents(space, model, params(query), { transport }) as Promise<any>;
    },

    /** One published content of a `list` model, or its draft with `draftKey`. */
    getItem<K extends ListModels<M>, const I extends IncludePath<M, K> = never, const F extends FieldName<M, K> = never>(
      model: K,
      id: string,
      query?: ItemQuery<M, K, I, F>,
    ): Promise<Result<M, K, I, F>> {
      return getContent(space, model, id, params(query), { transport }) as Promise<any>;
    },

    /** The content of an `object` model, or its draft with `draftKey`. */
    getObject<K extends ObjectModels<M>, const I extends IncludePath<M, K> = never, const F extends FieldName<M, K> = never>(
      model: K,
      query?: ItemQuery<M, K, I, F>,
    ): Promise<Result<M, K, I, F>> {
      return getContents(space, model, params(query), { transport }) as Promise<any>;
    },
  };
}

export type Client<M extends ModelMap = AnyModels> = ReturnType<typeof createClient<M>>;
