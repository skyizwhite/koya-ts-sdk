import {
  createAdminListContent,
  createDeliveryKey,
  deleteAdminListContent,
  deleteDeliveryKey,
  deleteMedia,
  deploySchema,
  discardAdminListContentDraft,
  discardAdminObjectDraft,
  getAdminList,
  getAdminListContent,
  getAdminListContentBySlug,
  getAdminListContentDraftKey,
  getAdminObject,
  getAdminObjectDraftKey,
  getMe,
  getMedia,
  getSchema,
  listDeliveryKeys,
  listMedia,
  planSchema,
  publishAdminListContent,
  publishAdminObject,
  unpublishAdminListContent,
  unpublishAdminObject,
  updateAdminListContent,
  updateAdminObject,
  updateMedia,
  uploadMedia,
} from "./generated/koya.ts";
import type { AdminContent as RawAdminContent, GetAdminListParams, Schema } from "./generated/koya.ts";
import type { Transport } from "./http.ts";
import type { AnyModels, ListModels, ModelMap, ObjectModels } from "./models.ts";

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
  /** Search the text fields, as the delivery API's `q`; it applies to the draft when there is one. */
  q?: string;
}

export interface PublishOptions<Data> {
  /** Published instead of the draft. */
  data?: DataInput<Data>;
  publishedAt?: string;
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
    getMe: () => getMe(init),

    getSchema: () => getSchema(space, init),
    /** What `deploySchema` of this schema would change; stores nothing. */
    planSchema: (schema: Schema) => planSchema(space, schema, init),
    deploySchema: (schema: Schema, { force = false }: DeployOptions = {}) =>
      deploySchema(space, schema, force ? { force: "true" } : undefined, init),

    /** Every content of a `list` model, drafts included; filters, orders and `q` apply to the draft when there is one. */
    getList<K extends ListModels<M>>(model: K, query: AdminListQuery = {}): Promise<AdminContentList<Data<K>>> {
      const params: GetAdminListParams = {};
      if (query.limit !== undefined) params.limit = query.limit;
      if (query.offset !== undefined) params.offset = query.offset;
      if (query.orders) params.orders = typeof query.orders === "string" ? query.orders : query.orders.join(",");
      if (query.filters) params.filters = query.filters;
      if (query.q) params.q = query.q;
      return getAdminList(space, model, params, init) as Promise<any>;
    },
    /** One content of a `list` model, reached through its id: both versions, as stored. */
    getListContent<K extends ListModels<M>>(model: K, id: string): Content<K> {
      return getAdminListContent(space, model, id, init) as Promise<any>;
    },
    /** One content of a `list` model, found by its published slug or its draft's: both versions, as stored. */
    getListContentBySlug<K extends ListModels<M>>(model: K, slug: string): Content<K> {
      return getAdminListContentBySlug(space, model, slug, init) as Promise<any>;
    },
    /** Saved as a draft unless `publish`. */
    createListContent<K extends ListModels<M>>(model: K, data: DataInput<Data<K>>, options: CreateOptions = {}): Content<K> {
      return createAdminListContent(space, model, { data, ...options }, init) as Promise<any>;
    },
    /** Merged onto the current draft (or the published data): keys given replace, `null` removes. */
    updateListContent<K extends ListModels<M>>(model: K, id: string, data: DataInput<Data<K>>): Content<K> {
      return updateAdminListContent(space, model, id, { data }, init) as Promise<any>;
    },
    /** Publishes `data` when given, else the draft, else re-publishes. */
    publishListContent<K extends ListModels<M>>(model: K, id: string, options: PublishOptions<Data<K>> = {}): Content<K> {
      return publishAdminListContent(space, model, id, options, init) as Promise<any>;
    },
    /**
     * Takes it off the delivery API, keeping its data as a draft. Refused with `409 not_published`
     * when it is not published, and `409 in_use` while another content refers to it.
     */
    unpublishListContent<K extends ListModels<M>>(model: K, id: string): Content<K> {
      return unpublishAdminListContent(space, model, id, init) as Promise<any>;
    },
    /**
     * Drops the draft of a published content. Refused with `409 not_published` when it is not
     * published, and `409 no_draft` when it has no draft.
     */
    discardListContentDraft<K extends ListModels<M>>(model: K, id: string): Content<K> {
      return discardAdminListContentDraft(space, model, id, init) as Promise<any>;
    },
    /** Refused with `409 in_use` while another content refers to it. */
    deleteListContent: (model: ListModels<M>, id: string) => deleteAdminListContent(space, model, id, init),
    /** The key that serves the draft through the delivery API, for preview URLs. */
    getListContentDraftKey: async (model: ListModels<M>, id: string) =>
      (await getAdminListContentDraftKey(space, model, id, init)).draftKey,

    /**
     * The one content of an `object` model, reached through the model: both versions, as stored.
     * Refused with `404 not_found` until its first update or publish.
     */
    getObject<K extends ObjectModels<M>>(model: K): Content<K> {
      return getAdminObject(space, model, init) as Promise<any>;
    },
    /** Merged onto the current draft (or the published data); the first update makes the content. */
    updateObject<K extends ObjectModels<M>>(model: K, data: DataInput<Data<K>>): Content<K> {
      return updateAdminObject(space, model, { data }, init) as Promise<any>;
    },
    /** Publishes `data` when given, else the draft, else re-publishes; `data` makes the content when it has none. */
    publishObject<K extends ObjectModels<M>>(model: K, options: PublishOptions<Data<K>> = {}): Content<K> {
      return publishAdminObject(space, model, options, init) as Promise<any>;
    },
    /** Takes it off the delivery API, keeping its data as a draft. Refused with `409 not_published` when it is not published. */
    unpublishObject<K extends ObjectModels<M>>(model: K): Content<K> {
      return unpublishAdminObject(space, model, init) as Promise<any>;
    },
    /** Drops its draft. Refused with `409 not_published` when it is not published, and `409 no_draft` when it has no draft. */
    discardObjectDraft<K extends ObjectModels<M>>(model: K): Content<K> {
      return discardAdminObjectDraft(space, model, init) as Promise<any>;
    },
    /** The key that serves the draft through the delivery API, for preview URLs. */
    getObjectDraftKey: async (model: ObjectModels<M>) => (await getAdminObjectDraftKey(space, model, init)).draftKey,

    /** The keys, without their plaintext, and the webhook secret. */
    listDeliveryKeys: () => listDeliveryKeys(space, init),
    /** The plaintext `key` is in this answer only. */
    createDeliveryKey: (label = "") => createDeliveryKey(space, { label }, init),
    deleteDeliveryKey: (id: string) => deleteDeliveryKey(space, id, init),

    /** Newest first; `q` matches file names. */
    listMedia: (query: { q?: string; limit?: number; offset?: number } = {}) => listMedia(space, query, init),
    getMedia: (id: string) => getMedia(space, id, init),
    /** PNG, JPEG, GIF or WebP, up to 20 MB each. In Node, `fs.openAsBlob(path)` gives a Blob. */
    uploadMedia: async (files: Blob | readonly Blob[], { alt }: { alt?: string } = {}) =>
      (await uploadMedia(space, { file: Array.isArray(files) ? [...files] : [files as Blob], ...(alt ? { alt } : {}) }, init)).media,
    updateMedia: (id: string, { alt }: { alt: string }) => updateMedia(space, id, { alt }, init),
    /** Refused with `409 in_use` while a content uses it. */
    deleteMedia: (id: string) => deleteMedia(space, id, init),
  };
}

export type AdminClient<M extends ModelMap = AnyModels> = ReturnType<typeof createAdminClient<M>>;
