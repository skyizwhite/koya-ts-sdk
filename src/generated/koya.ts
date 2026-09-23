import { koyaFetch } from '../http.ts';
/**
 * ISO 8601 in UTC with milliseconds
 */
export type Timestamp = string;

export interface ValidationProblem {
  field: string;
  /** See SCHEMA.md "Content values" */
  code: string;
  message: string;
}

export type ChangeOp = typeof ChangeOp[keyof typeof ChangeOp];


export const ChangeOp = {
  change_webhooks: 'change_webhooks',
  add_model: 'add_model',
  remove_model: 'remove_model',
  rename_model: 'rename_model',
  change_kind: 'change_kind',
  change_model_options: 'change_model_options',
  add_field: 'add_field',
  remove_field: 'remove_field',
  rename_field: 'rename_field',
  change_field_type: 'change_field_type',
  change_field_options: 'change_field_options',
} as const;

export interface Change {
  op: ChangeOp;
  path: string;
  destructive: boolean;
  description: string;
}

export type ApiErrorError = {
  code: string;
  message: string;
  /** `validation_failed` lists problems, `destructive_changes` changes */
  details?: ValidationProblem[] | Change[];
};

export interface ApiError {
  error: ApiErrorError;
}

export interface Me {
  /** true when called with the admin UI's session */
  owner: boolean;
  /** true when called with a management key */
  management: boolean;
  /**
     * the space a management key is limited to; null for the owner
     * @nullable
     */
  space: string | null;
  version: string;
}

/**
 * Belongs to the space and fires for every model unless `only` narrows it.
 * Sent every event; the payload's `event` says which. An `events` key from
 * older schemas is ignored.
 */
export interface Webhook {
  /** Defaults to `url`; always present on output */
  label?: string;
  url: string;
  /** Model names this webhook is narrowed to; absent means every model. */
  only?: string[];
}

export type ModelKind = typeof ModelKind[keyof typeof ModelKind];


export const ModelKind = {
  list: 'list',
  object: 'object',
} as const;

/**
 * Not one of the system fields `id`, `createdAt`, `updatedAt`, `publishedAt`, `revisedAt`.
 * @pattern ^[a-z][a-zA-Z0-9]*$
 */
export type FieldName = string;

export type TextFieldType = typeof TextFieldType[keyof typeof TextFieldType];


export const TextFieldType = {
  text: 'text',
} as const;

export interface TextField {
  name: FieldName;
  type: TextFieldType;
  was?: FieldName;
  required?: boolean;
  /** @minimum 1 */
  maxLength?: number;
  /** A cl-ppcre (Perl-style) regular expression */
  pattern?: string;
  unique?: boolean;
}

export type TextareaFieldType = typeof TextareaFieldType[keyof typeof TextareaFieldType];


export const TextareaFieldType = {
  textarea: 'textarea',
} as const;

export interface TextareaField {
  name: FieldName;
  type: TextareaFieldType;
  was?: FieldName;
  required?: boolean;
  /** @minimum 1 */
  maxLength?: number;
}

export type RichtextFieldType = typeof RichtextFieldType[keyof typeof RichtextFieldType];


export const RichtextFieldType = {
  richtext: 'richtext',
} as const;

export interface RichtextField {
  name: FieldName;
  type: RichtextFieldType;
  was?: FieldName;
  required?: boolean;
}

export type NumberFieldType = typeof NumberFieldType[keyof typeof NumberFieldType];


export const NumberFieldType = {
  number: 'number',
} as const;

export interface NumberField {
  name: FieldName;
  type: NumberFieldType;
  was?: FieldName;
  required?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
}

export type BooleanFieldType = typeof BooleanFieldType[keyof typeof BooleanFieldType];


export const BooleanFieldType = {
  boolean: 'boolean',
} as const;

export interface BooleanField {
  name: FieldName;
  type: BooleanFieldType;
  was?: FieldName;
  required?: boolean;
  /** `true` sets the field on a new content whose data does not mention it */
  default?: boolean;
}

export type DateFieldType = typeof DateFieldType[keyof typeof DateFieldType];


export const DateFieldType = {
  date: 'date',
} as const;

export interface DateField {
  name: FieldName;
  type: DateFieldType;
  was?: FieldName;
  required?: boolean;
}

export type DatetimeFieldType = typeof DatetimeFieldType[keyof typeof DatetimeFieldType];


export const DatetimeFieldType = {
  datetime: 'datetime',
} as const;

export interface DatetimeField {
  name: FieldName;
  type: DatetimeFieldType;
  was?: FieldName;
  required?: boolean;
}

export type SelectFieldType = typeof SelectFieldType[keyof typeof SelectFieldType];


export const SelectFieldType = {
  select: 'select',
} as const;

export interface SelectField {
  name: FieldName;
  type: SelectFieldType;
  was?: FieldName;
  required?: boolean;
  /** @minItems 1 */
  options: string[];
  many?: boolean;
}

export type MediaFieldType = typeof MediaFieldType[keyof typeof MediaFieldType];


export const MediaFieldType = {
  media: 'media',
} as const;

export interface MediaField {
  name: FieldName;
  type: MediaFieldType;
  was?: FieldName;
  required?: boolean;
}

export type ReferenceFieldType = typeof ReferenceFieldType[keyof typeof ReferenceFieldType];


export const ReferenceFieldType = {
  reference: 'reference',
} as const;

export interface ReferenceField {
  name: FieldName;
  type: ReferenceFieldType;
  was?: FieldName;
  required?: boolean;
  /** A model of the same schema */
  model: string;
  many?: boolean;
}

export type SlugFieldType = typeof SlugFieldType[keyof typeof SlugFieldType];


export const SlugFieldType = {
  slug: 'slug',
} as const;

export interface SlugField {
  name: FieldName;
  type: SlugFieldType;
  was?: FieldName;
  required?: boolean;
  /** A text or textarea field of the same model, filled into a blank slug */
  from: string;
  unique?: boolean;
  pattern?: string;
}

/**
 * A field of a model. Each `type` takes its own options (SCHEMA.md
 * "Field"); any other key is refused with `invalid_schema`. `was` names
 * the field this one was renamed from — a deploy moves the key in every
 * stored content — and is never returned by a GET.
 */
export type Field = TextField | TextareaField | RichtextField | NumberField | BooleanField | DateField | DatetimeField | SelectField | MediaField | ReferenceField | SlugField;

export interface Model {
  /** @pattern ^[a-z][a-z0-9-]*$ */
  name: string;
  kind: ModelKind;
  /** Template for the editor's preview link; `{CONTENT_ID}` and `{DRAFT_KEY}` are substituted. */
  previewUrl?: string;
  /** Template for the editor's published page link; `{CONTENT_ID}` is substituted. */
  publicUrl?: string;
  /**
     * A text or slug field of this model, whose value the admin UI
     * shows for a content. Absent, a content is shown by its id.
     */
  label?: string;
  /**
     * The name this model had. A deploy renames it and moves its
     * contents instead of dropping them; the stored schema keeps the
     * new name alone, so a GET never returns it. See SCHEMA.md.
     */
  was?: string;
  fields?: Field[];
}

/**
 * One space's schema document; SCHEMA.md is normative. The space is named by the URL, not by the document.
 */
export interface Schema {
  koyaSchema: 1;
  webhooks?: Webhook[];
  models?: Model[];
}

export interface Plan {
  changes: Change[];
  destructive: boolean;
}

export interface DeployResult {
  applied: Change[];
  schema: Schema;
}

/**
 * Field name to value, as SCHEMA.md "Content values" defines them. Ids for
 * `media` and `reference` fields; arrays on `many` fields.
 */
export interface ContentData { [key: string]: unknown }

export interface CreateContent {
  data: ContentData;
  publish?: boolean;
  /**
     * Defaults to a fresh ULID.
     * @pattern ^[A-Za-z0-9_-]{1,64}$
     */
  id?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  publishedAt?: Timestamp;
  revisedAt?: Timestamp;
}

export interface UpdateDraft {
  data: ContentData;
}

export interface PublishContent {
  data?: ContentData;
  publishedAt?: Timestamp;
}

/**
 * Delivery shape: the data with the system fields merged in. `media` fields
 * are expanded to Media objects (or `null` when the file is gone); `richtext`
 * HTML has its `/media/` URLs made absolute; `reference` fields are ids
 * unless embedded through `include`. With `fields`, only the named keys
 * are present, system fields included.
 */
export interface Content {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt: Timestamp | null;
  revisedAt: Timestamp | null;
  [key: string]: unknown;
 }

export interface ContentList {
  contents: Content[];
  totalCount: number;
  offset: number;
  limit: number;
}

export type AdminContentStatus = typeof AdminContentStatus[keyof typeof AdminContentStatus];


export const AdminContentStatus = {
  draft: 'draft',
  published: 'published',
  'published+draft': 'published+draft',
} as const;

/**
 * Admin shape: status, both data versions as stored (ids, not expanded) and metadata.
 */
export interface AdminContent {
  id: string;
  status: AdminContentStatus;
  published: ContentData | null;
  draft: ContentData | null;
  draftKey: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt: Timestamp | null;
  revisedAt: Timestamp | null;
}

export interface AdminContentList {
  contents: AdminContent[];
  totalCount: number;
  offset: number;
  limit: number;
}

export interface DeliveryKey {
  id: string;
  label: string;
  createdAt: Timestamp;
}

export type MediaMime = typeof MediaMime[keyof typeof MediaMime];


export const MediaMime = {
  'image/png': 'image/png',
  'image/jpeg': 'image/jpeg',
  'image/gif': 'image/gif',
  'image/webp': 'image/webp',
} as const;

export interface Media {
  /** ULID */
  id: string;
  /** Absolute: KOYA_BASE_URL + /media/{space}/{id}.{ext} */
  url: string;
  /** The uploaded file's base name */
  filename: string;
  mime: MediaMime;
  /** Bytes */
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  createdAt: Timestamp;
}

export type MediaWithReferences = Media & {
  /** The number of contents whose data mentions it */
  references: number;
};

export interface DeliveryKeys {
  keys: DeliveryKey[];
  /** Sent as `X-KOYA-WEBHOOK-KEY` with every webhook */
  webhookSecret: string;
}

export interface CreatedDeliveryKey {
  id: string;
  label: string;
  key: string;
}

export interface MediaList {
  media: Media[];
  totalCount: number;
  offset: number;
  limit: number;
}

/**
 * `bad_request` or `bad_json`
 */
export type BadRequestResponse = ApiError;

/**
 * `bad_query`: a malformed `filters`, an unknown field in `filters`/`orders`/`include`, or a bad integer
 */
export type BadQueryResponse = ApiError;

/**
 * `invalid_schema` (the document breaks SCHEMA.md) or `bad_json`
 */
export type InvalidSchemaResponse = ApiError;

/**
 * `unauthorized`: missing or wrong delivery key or management key
 */
export type UnauthorizedResponse = ApiError;

/**
 * `forbidden`: the delivery or management key belongs to another space
 */
export type ForbiddenResponse = ApiError;

/**
 * `forbidden`: a browser request from another origin
 */
export type CrossOriginResponse = ApiError;

/**
 * `not_found`: unknown space, model, content, media or endpoint
 */
export type NotFoundResponse = ApiError;

/**
 * `validation_failed`: `details` lists each problem (codes are in SCHEMA.md)
 */
export type ValidationFailedResponse = ApiError;

export type DeletedResponse = {
  deleted: true;
};

/**
 * Values above 100 are clamped to 100.
 */
export type LimitParameter = number;

export type OffsetParameter = number;

/**
 * Comma-separated field or system field names, `-` prefix for descending,
 * e.g. `-publishedAt,title`. Default: newest published first.
 */
export type OrdersParameter = string;

/**
 * `field[op]value` terms joined with `[and]` and `[or]`; `[or]` separates
 * groups of `[and]` terms. Operators: `equals`, `not_equals`, `contains`,
 * `not_contains`, `begins_with`, `exists`, `not_exists`, `less_than`,
 * `greater_than`. On a `many` field, `equals` and `contains` mean "has
 * this value". Example: `title[contains]lisp[and]publishedAt[exists]`.
 */
export type FiltersParameter = string;

/**
 * Comma-separated keys to keep in each content; applied after `include` and
 * media expansion. System fields not named are dropped too.
 */
export type FieldsParameter = string;

/**
 * Comma-separated reference fields to embed, dotted for nesting:
 * `tags,author.avatar` embeds `tags`, and `avatar` inside each `author`.
 * Only `reference` fields may be named. Referenced contents that are
 * missing or unpublished are dropped from a `many` field and `null` in a
 * single one.
 */
export type IncludeParameter = string;

/**
 * The content's draft key (from the admin API or the editor's preview link) serves its draft instead of the published data.
 */
export type DraftKeyParameter = string;

export type GetContentsParams = {
/**
 * Values above 100 are clamped to 100.
 * @minimum 0
 */
limit?: LimitParameter;
/**
 * @minimum 0
 */
offset?: OffsetParameter;
/**
 * Comma-separated field or system field names, `-` prefix for descending,
 * e.g. `-publishedAt,title`. Default: newest published first.
 */
orders?: OrdersParameter;
/**
 * Comma-separated keys to keep in each content; applied after `include` and
 * media expansion. System fields not named are dropped too.
 */
fields?: FieldsParameter;
/**
 * `field[op]value` terms joined with `[and]` and `[or]`; `[or]` separates
 * groups of `[and]` terms. Operators: `equals`, `not_equals`, `contains`,
 * `not_contains`, `begins_with`, `exists`, `not_exists`, `less_than`,
 * `greater_than`. On a `many` field, `equals` and `contains` mean "has
 * this value". Example: `title[contains]lisp[and]publishedAt[exists]`.
 */
filters?: FiltersParameter;
/**
 * Comma-separated reference fields to embed, dotted for nesting:
 * `tags,author.avatar` embeds `tags`, and `avatar` inside each `author`.
 * Only `reference` fields may be named. Referenced contents that are
 * missing or unpublished are dropped from a `many` field and `null` in a
 * single one.
 */
include?: IncludeParameter;
/**
 * The content's draft key (from the admin API or the editor's preview link) serves its draft instead of the published data.
 */
draftKey?: DraftKeyParameter;
};

export type GetContentParams = {
/**
 * Comma-separated keys to keep in each content; applied after `include` and
 * media expansion. System fields not named are dropped too.
 */
fields?: FieldsParameter;
/**
 * Comma-separated reference fields to embed, dotted for nesting:
 * `tags,author.avatar` embeds `tags`, and `avatar` inside each `author`.
 * Only `reference` fields may be named. Referenced contents that are
 * missing or unpublished are dropped from a `many` field and `null` in a
 * single one.
 */
include?: IncludeParameter;
/**
 * The content's draft key (from the admin API or the editor's preview link) serves its draft instead of the published data.
 */
draftKey?: DraftKeyParameter;
};

export type DeploySchemaParams = {
/**
 * Apply destructive changes too.
 */
force?: DeploySchemaForce;
};

export type DeploySchemaForce = typeof DeploySchemaForce[keyof typeof DeploySchemaForce];


export const DeploySchemaForce = {
  true: 'true',
} as const;

export type ListAdminContentsParams = {
/**
 * Values above 100 are clamped to 100.
 * @minimum 0
 */
limit?: LimitParameter;
/**
 * @minimum 0
 */
offset?: OffsetParameter;
/**
 * Comma-separated field or system field names, `-` prefix for descending,
 * e.g. `-publishedAt,title`. Default: newest published first.
 */
orders?: OrdersParameter;
/**
 * `field[op]value` terms joined with `[and]` and `[or]`; `[or]` separates
 * groups of `[and]` terms. Operators: `equals`, `not_equals`, `contains`,
 * `not_contains`, `begins_with`, `exists`, `not_exists`, `less_than`,
 * `greater_than`. On a `many` field, `equals` and `contains` mean "has
 * this value". Example: `title[contains]lisp[and]publishedAt[exists]`.
 */
filters?: FiltersParameter;
};

export type GetAdminContentDraftKey200 = {
  draftKey: string;
};

export type CreateDeliveryKeyBody = {
  label?: string;
};

export type ListMediaParams = {
/**
 * Matches file names.
 */
q?: string;
/**
 * Values above 100 are clamped to 100.
 * @minimum 0
 */
limit?: number;
/**
 * @minimum 0
 */
offset?: number;
};

export type UploadMediaBody = {
  file: (Blob | File)[];
  alt?: string;
};

export type UploadMedia201 = {
  media: Media[];
};

export type UpdateMediaBody = {
  alt: string;
};

export const getGetContentsUrl = (space: string,
    model: string,
    params?: GetContentsParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/${space}/${model}?${stringifiedParams}` : `/api/v1/${space}/${model}`
}

/**
 * For a `list` model, a page of published contents. For an `object` model,
 * its single content (published, or its draft with the right `draftKey`);
 * `limit`, `offset`, `orders` and `filters` are ignored then.
 * @summary List published contents, or read an object model's content
 */
export const getContents = async (space: string,
    model: string,
    params?: GetContentsParams, options?: Parameters<typeof koyaFetch>[1]): Promise<ContentList | Content> => {

  return koyaFetch<ContentList | Content>(getGetContentsUrl(space,model,params),
  {
    ...options,
    method: 'GET'


  }
);}



export const getGetContentUrl = (space: string,
    model: string,
    id: string,
    params?: GetContentParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/${space}/${model}/${id}?${stringifiedParams}` : `/api/v1/${space}/${model}/${id}`
}

/**
 * @summary Read one published content
 */
export const getContent = async (space: string,
    model: string,
    id: string,
    params?: GetContentParams, options?: Parameters<typeof koyaFetch>[1]): Promise<Content> => {

  return koyaFetch<Content>(getGetContentUrl(space,model,id,params),
  {
    ...options,
    method: 'GET'


  }
);}



export const getGetHealthUrl = () => {




  return `/health`
}

/**
 * @summary Liveness, touching the database
 */
export const getHealth = async ( options?: Parameters<typeof koyaFetch>[1]): Promise<string> => {

  return koyaFetch<string>(getGetHealthUrl(),
  {
    ...options,
    method: 'GET'


  }
);}



export const getGetMeUrl = () => {




  return `/admin/api/me`
}

/**
 * @summary Who am I
 */
export const getMe = async ( options?: Parameters<typeof koyaFetch>[1]): Promise<Me> => {

  return koyaFetch<Me>(getGetMeUrl(),
  {
    ...options,
    method: 'GET'


  }
);}



export const getGetSchemaUrl = (space: string,) => {




  return `/admin/api/schema/${space}`
}

/**
 * @summary The space's stored schema
 */
export const getSchema = async (space: string, options?: Parameters<typeof koyaFetch>[1]): Promise<Schema> => {

  return koyaFetch<Schema>(getGetSchemaUrl(space),
  {
    ...options,
    method: 'GET'


  }
);}



export const getDeploySchemaUrl = (space: string,
    params?: DeploySchemaParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/admin/api/schema/${space}?${stringifiedParams}` : `/admin/api/schema/${space}`
}

/**
 * Validates the document, diffs it against the space's stored schema and,
 * unless a destructive change is present without `force=true`, stores it.
 * Existing content is never modified. The space must already exist — it is
 * made in the admin UI — and a deploy to an unknown name is a 404.
 * @summary Replace the space's schema
 */
export const deploySchema = async (space: string,
    schema: Schema,
    params?: DeploySchemaParams, options?: Parameters<typeof koyaFetch>[1]): Promise<DeployResult> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return koyaFetch<DeployResult>(getDeploySchemaUrl(space,params),
  {
    ...options,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(schema)
  }
);}



export const getPlanSchemaUrl = (space: string,) => {




  return `/admin/api/schema/${space}/plan`
}

/**
 * @summary The changes a PUT of this schema would apply
 */
export const planSchema = async (space: string,
    schema: Schema, options?: Parameters<typeof koyaFetch>[1]): Promise<Plan> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return koyaFetch<Plan>(getPlanSchemaUrl(space),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(schema)
  }
);}



export const getListAdminContentsUrl = (space: string,
    model: string,
    params?: ListAdminContentsParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/admin/api/contents/${space}/${model}?${stringifiedParams}` : `/admin/api/contents/${space}/${model}`
}

/**
 * Takes the delivery API's `limit`, `offset`, `orders` and `filters`.
 * Filters and orders apply to the draft data when a content has one.
 * @summary List every content of a model, drafts included
 */
export const listAdminContents = async (space: string,
    model: string,
    params?: ListAdminContentsParams, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContentList> => {

  return koyaFetch<AdminContentList>(getListAdminContentsUrl(space,model,params),
  {
    ...options,
    method: 'GET'


  }
);}



export const getCreateAdminContentUrl = (space: string,
    model: string,) => {




  return `/admin/api/contents/${space}/${model}`
}

/**
 * Saved as a draft unless `publish` is true. `id` and the system timestamps
 * may be supplied, for imports that keep another system's ids and dates;
 * `publishedAt` and `revisedAt` are only stored when publishing. For an
 * `object` model that already has its content, that content is updated
 * (drafted, or published with `publish`) instead of a second one being made.
 * @summary Create a content
 */
export const createAdminContent = async (space: string,
    model: string,
    createContent: CreateContent, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return koyaFetch<AdminContent>(getCreateAdminContentUrl(space,model),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(createContent)
  }
);}



export const getGetAdminContentUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/contents/${space}/${model}/${id}`
}

/**
 * @summary Read a content, both versions
 */
export const getAdminContent = async (space: string,
    model: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

  return koyaFetch<AdminContent>(getGetAdminContentUrl(space,model,id),
  {
    ...options,
    method: 'GET'


  }
);}



export const getUpdateAdminContentDraftUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/contents/${space}/${model}/${id}`
}

/**
 * `data` is merged onto the current draft (or, without one, the published
 * data): keys present replace, a `null` value removes the key, keys absent
 * stay. The result is validated whole. A new draft key is issued, so earlier
 * preview links stop working.
 * @summary Save a draft
 */
export const updateAdminContentDraft = async (space: string,
    model: string,
    id: string,
    updateDraft: UpdateDraft, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return koyaFetch<AdminContent>(getUpdateAdminContentDraftUrl(space,model,id),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(updateDraft)
  }
);}



export const getDeleteAdminContentUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/contents/${space}/${model}/${id}`
}

/**
 * Removes both versions. Fires `delete` webhooks when it was published.
 * @summary Delete a content
 */
export const deleteAdminContent = async (space: string,
    model: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<DeletedResponse> => {

  return koyaFetch<DeletedResponse>(getDeleteAdminContentUrl(space,model,id),
  {
    ...options,
    method: 'DELETE'


  }
);}



export const getPublishAdminContentUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/contents/${space}/${model}/${id}/publish`
}

/**
 * Publishes `data` when given, else the current draft, else re-publishes the
 * published data. Clears the draft and its key. `publishedAt` overrides the
 * publish date; otherwise the first publish date is kept and `revisedAt` set
 * to now. Fires `publish` webhooks.
 * @summary Publish
 */
export const publishAdminContent = async (space: string,
    model: string,
    id: string,
    publishContent?: PublishContent, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return koyaFetch<AdminContent>(getPublishAdminContentUrl(space,model,id),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(publishContent)
  }
);}



export const getUnpublishAdminContentUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/contents/${space}/${model}/${id}/unpublish`
}

/**
 * Takes the content off the delivery API. Its data (the draft when there is
 * one) is kept as a draft with a new draft key; `publishedAt` is cleared.
 * Fires `unpublish` webhooks.
 * @summary Unpublish
 */
export const unpublishAdminContent = async (space: string,
    model: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

  return koyaFetch<AdminContent>(getUnpublishAdminContentUrl(space,model,id),
  {
    ...options,
    method: 'POST'


  }
);}



export const getDiscardAdminContentDraftUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/contents/${space}/${model}/${id}/discard-draft`
}

/**
 * No webhook fires; what is published does not change.
 * @summary Discard the draft of a published content
 */
export const discardAdminContentDraft = async (space: string,
    model: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

  return koyaFetch<AdminContent>(getDiscardAdminContentDraftUrl(space,model,id),
  {
    ...options,
    method: 'POST'


  }
);}



export const getGetAdminContentDraftKeyUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/contents/${space}/${model}/${id}/draft-key`
}

/**
 * For building preview URLs. Generated on first call; replaced whenever a
 * draft is saved.
 * @summary The content's draft key
 */
export const getAdminContentDraftKey = async (space: string,
    model: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<GetAdminContentDraftKey200> => {

  return koyaFetch<GetAdminContentDraftKey200>(getGetAdminContentDraftKeyUrl(space,model,id),
  {
    ...options,
    method: 'POST'


  }
);}



export const getListDeliveryKeysUrl = (space: string,) => {




  return `/admin/api/keys/${space}`
}

/**
 * @summary The space's delivery keys and webhook secret
 */
export const listDeliveryKeys = async (space: string, options?: Parameters<typeof koyaFetch>[1]): Promise<DeliveryKeys> => {

  return koyaFetch<DeliveryKeys>(getListDeliveryKeysUrl(space),
  {
    ...options,
    method: 'GET'


  }
);}



export const getCreateDeliveryKeyUrl = (space: string,) => {




  return `/admin/api/keys/${space}`
}

/**
 * The plaintext `key` appears in this response only; the server stores its SHA-256.
 * @summary Create a delivery key
 */
export const createDeliveryKey = async (space: string,
    createDeliveryKeyBody?: CreateDeliveryKeyBody, options?: Parameters<typeof koyaFetch>[1]): Promise<CreatedDeliveryKey> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return koyaFetch<CreatedDeliveryKey>(getCreateDeliveryKeyUrl(space),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(createDeliveryKeyBody)
  }
);}



export const getDeleteDeliveryKeyUrl = (space: string,
    id: string,) => {




  return `/admin/api/keys/${space}/${id}`
}

/**
 * @summary Delete a delivery key
 */
export const deleteDeliveryKey = async (space: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<DeletedResponse> => {

  return koyaFetch<DeletedResponse>(getDeleteDeliveryKeyUrl(space,id),
  {
    ...options,
    method: 'DELETE'


  }
);}



export const getListMediaUrl = (space: string,
    params?: ListMediaParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/admin/api/media/${space}?${stringifiedParams}` : `/admin/api/media/${space}`
}

/**
 * @summary List media, newest first
 */
export const listMedia = async (space: string,
    params?: ListMediaParams, options?: Parameters<typeof koyaFetch>[1]): Promise<MediaList> => {

  return koyaFetch<MediaList>(getListMediaUrl(space,params),
  {
    ...options,
    method: 'GET'


  }
);}



export const getUploadMediaUrl = (space: string,) => {




  return `/admin/api/media/${space}`
}

/**
 * `multipart/form-data` with one or more `file` parts and an optional `alt`
 * applied to all of them. PNG, JPEG, GIF and WebP, up to 20 MB each, decided
 * by the file's leading bytes; the part's Content-Type is ignored. The whole
 * request body is limited to 21 MB.
 * @summary Upload images
 */
export const uploadMedia = async (space: string,
    uploadMediaBody: UploadMediaBody, options?: Parameters<typeof koyaFetch>[1]): Promise<UploadMedia201> => {
    const formData = new FormData();
uploadMediaBody.file.forEach(value => formData.append(`file`, value));
if(uploadMediaBody.alt !== undefined) {
 formData.append(`alt`, uploadMediaBody.alt);
 }

  return koyaFetch<UploadMedia201>(getUploadMediaUrl(space),
  {
    ...options,
    method: 'POST'
    ,
    body: formData
  }
);}



export const getGetMediaUrl = (space: string,
    id: string,) => {




  return `/admin/api/media/${space}/${id}`
}

/**
 * @summary Read one media
 */
export const getMedia = async (space: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<MediaWithReferences> => {

  return koyaFetch<MediaWithReferences>(getGetMediaUrl(space,id),
  {
    ...options,
    method: 'GET'


  }
);}



export const getUpdateMediaUrl = (space: string,
    id: string,) => {




  return `/admin/api/media/${space}/${id}`
}

/**
 * @summary Set the alt text
 */
export const updateMedia = async (space: string,
    id: string,
    updateMediaBody: UpdateMediaBody, options?: Parameters<typeof koyaFetch>[1]): Promise<Media> => {

    const getHeaders = (h?: NonNullable<RequestInit['headers']>): Record<string, string | readonly string[]> => {
    if (!h) return {};
    if (h instanceof Headers) return Object.fromEntries(h.entries());
    if (Symbol.iterator in h) {
      return Object.fromEntries(
        Array.from(h as Iterable<Iterable<string>>, (entry) => Array.from(entry) as [string, string]),
      );
    }
    const headers: Record<string, string | readonly string[]> = {};
    for (const [name, value] of Object.entries<string | readonly string[] | undefined>(h)) {
      if (value !== undefined) headers[name] = value;
    }
    return headers;
  };
return koyaFetch<Media>(getUpdateMediaUrl(space,id),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(updateMediaBody)
  }
);}



export const getDeleteMediaUrl = (space: string,
    id: string,) => {




  return `/admin/api/media/${space}/${id}`
}

/**
 * Refused with 409 `in_use` while any content still uses the file (see `references`).
 * @summary Delete a media and its file
 */
export const deleteMedia = async (space: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<DeletedResponse> => {

  return koyaFetch<DeletedResponse>(getDeleteMediaUrl(space,id),
  {
    ...options,
    method: 'DELETE'


  }
);}
