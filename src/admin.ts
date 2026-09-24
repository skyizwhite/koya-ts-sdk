import {
  createAdminContent,
  createDeliveryKey,
  deleteAdminContent,
  deleteDeliveryKey,
  deleteMedia,
  deploySchema,
  discardAdminContentDraft,
  getAdminContent,
  getAdminContentDraftKey,
  getMe,
  getMedia,
  getSchema,
  listAdminContents,
  listDeliveryKeys,
  listMedia,
  planSchema,
  publishAdminContent,
  unpublishAdminContent,
  updateAdminContentDraft,
  updateMedia,
  uploadMedia,
} from "./generated/koya.ts";
import type { AdminContent as RawAdminContent, ListAdminContentsParams, Schema } from "./generated/koya.ts";
import type { Transport } from "./http.ts";
import type { AnyModels, ModelMap } from "./models.ts";

export interface AdminClientOptions {
  baseUrl: string;
  space: string;
  /** Made on the space's Keys page. It can change everything in the space: keep it on a server. */
  managementKey: string;
  fetch?: typeof globalThis.fetch;
}

/** A content as the admin API returns it: both versions, as stored. */
export interface AdminContent<Data> extends Omit<RawAdminContent, "published" | "draft"> {
  published: Data | null;
  draft: Data | null;
}

export interface AdminContentList<Data> {
  contents: AdminContent<Data>[];
  totalCount: number;
  offset: number;
  limit: number;
}

/** Field values to write; `null` removes a key when saving a draft. */
export type DataInput<Data> = { [F in keyof Data]?: Data[F] | null };

export interface CreateOptions {
  /** Publish at once instead of saving a draft. */
  publish?: boolean;
  /** Keep another system's id, for imports. Defaults to a fresh ULID. */
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Stored only when publishing. */
  publishedAt?: string;
  revisedAt?: string;
}

export interface AdminListQuery {
  limit?: number;
  offset?: number;
  orders?: string | readonly string[];
  filters?: string;
}

export interface DeployOptions {
  /** Apply destructive changes too. Without it they are refused with `409 destructive_changes`. */
  force?: boolean;
}

/**
 * An admin API client for one space: its schema, contents, delivery keys and
 * media. Pass the generated `KoyaModels` to type content data.
 */
export function createAdminClient<M extends ModelMap = AnyModels>(options: AdminClientOptions) {
  const transport: Transport = { baseUrl: options.baseUrl, managementKey: options.managementKey, fetch: options.fetch };
  const { space } = options;
  const init = { transport };
  type Data<K extends keyof M> = M[K]["data"];
  type Content<K extends keyof M> = Promise<AdminContent<Data<K>>>;

  return {
    /** Who the key is, and the server's version. */
    me: () => getMe(init),

    schema: {
      get: () => getSchema(space, init),
      /** What `deploy` of this schema would change; stores nothing. */
      plan: (schema: Schema) => planSchema(space, schema, init),
      deploy: (schema: Schema, { force = false }: DeployOptions = {}) =>
        deploySchema(space, schema, force ? { force: "true" } : undefined, init),
    },

    contents: {
      /** Every content of the model, drafts included; filters and orders apply to the draft when there is one. */
      list<K extends keyof M & string>(model: K, query: AdminListQuery = {}): Promise<AdminContentList<Data<K>>> {
        const params: ListAdminContentsParams = {};
        if (query.limit !== undefined) params.limit = query.limit;
        if (query.offset !== undefined) params.offset = query.offset;
        if (query.orders) params.orders = typeof query.orders === "string" ? query.orders : query.orders.join(",");
        if (query.filters) params.filters = query.filters;
        return listAdminContents(space, model, params, init) as Promise<any>;
      },
      get<K extends keyof M & string>(model: K, id: string): Content<K> {
        return getAdminContent(space, model, id, init) as Promise<any>;
      },
      /** Saved as a draft unless `publish`. On an `object` model that has its content, that content is updated. */
      create<K extends keyof M & string>(model: K, data: DataInput<Data<K>>, options: CreateOptions = {}): Content<K> {
        return createAdminContent(space, model, { data, ...options }, init) as Promise<any>;
      },
      /** Merged onto the current draft (or the published data): keys given replace, `null` removes. */
      updateDraft<K extends keyof M & string>(model: K, id: string, data: DataInput<Data<K>>): Content<K> {
        return updateAdminContentDraft(space, model, id, { data }, init) as Promise<any>;
      },
      /** Publishes `data` when given, else the draft, else re-publishes. */
      publish<K extends keyof M & string>(
        model: K,
        id: string,
        options: { data?: DataInput<Data<K>>; publishedAt?: string } = {},
      ): Content<K> {
        return publishAdminContent(space, model, id, options, init) as Promise<any>;
      },
      /**
       * Takes it off the delivery API, keeping its data as a draft. Refused with `409 in_use`
       * while another content refers to it.
       */
      unpublish<K extends keyof M & string>(model: K, id: string): Content<K> {
        return unpublishAdminContent(space, model, id, init) as Promise<any>;
      },
      /** Drops the draft of a published content. */
      discardDraft<K extends keyof M & string>(model: K, id: string): Content<K> {
        return discardAdminContentDraft(space, model, id, init) as Promise<any>;
      },
      /** Refused with `409 in_use` while another content refers to it. */
      delete: (model: keyof M & string, id: string) => deleteAdminContent(space, model, id, init),
      /** The key that serves the draft through the delivery API, for preview URLs. */
      draftKey: async (model: keyof M & string, id: string) =>
        (await getAdminContentDraftKey(space, model, id, init)).draftKey,
    },

    deliveryKeys: {
      /** The keys, without their plaintext, and the webhook secret. */
      list: () => listDeliveryKeys(space, init),
      /** The plaintext `key` is in this answer only. */
      create: (label = "") => createDeliveryKey(space, { label }, init),
      delete: (id: string) => deleteDeliveryKey(space, id, init),
    },

    media: {
      /** Newest first; `q` matches file names. */
      list: (query: { q?: string; limit?: number; offset?: number } = {}) => listMedia(space, query, init),
      get: (id: string) => getMedia(space, id, init),
      /** PNG, JPEG, GIF or WebP, up to 20 MB each. In Node, `fs.openAsBlob(path)` gives a Blob. */
      upload: async (files: Blob | readonly Blob[], { alt }: { alt?: string } = {}) =>
        (await uploadMedia(space, { file: Array.isArray(files) ? [...files] : [files as Blob], ...(alt ? { alt } : {}) }, init)).media,
      update: (id: string, { alt }: { alt: string }) => updateMedia(space, id, { alt }, init),
      /** Refused with `409 in_use` while a content uses it. */
      delete: (id: string) => deleteMedia(space, id, init),
    },
  };
}

export type AdminClient<M extends ModelMap = AnyModels> = ReturnType<typeof createAdminClient<M>>;
