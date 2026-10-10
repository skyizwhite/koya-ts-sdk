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
  change_custom_fields: 'change_custom_fields',
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

export type MisfitVersion = typeof MisfitVersion[keyof typeof MisfitVersion];


export const MisfitVersion = {
  published: 'published',
  draft: 'draft',
} as const;

export interface Misfit {
  id: string;
  /** The field, `field.subfield` inside a custom field, or `field[index]` / `field[index].subfield` in a repeater's row */
  field: string;
  version: MisfitVersion;
  message: string;
}

export interface Change {
  op: ChangeOp;
  /** `webhooks`, `customFields`, `model`, `model.field`, or `model.field.subfield` inside a custom field (`model.field[customField].subfield` in a repeater) */
  path: string;
  destructive: boolean;
  description: string;
  /** Stored contents that do not fit a tightened option or a required field added; present only when there are some */
  misfits?: Misfit[];
}

export type ApiErrorError = {
  code: string;
  message: string;
  /** `validation_failed` lists problems, `destructive_changes` and `contents_do_not_fit` changes */
  details?: ValidationProblem[] | Change[];
};

export interface ApiError {
  error: ApiErrorError;
}

export interface Me {
  /** the space the management key is limited to */
  space: string;
  version: string;
}

/**
 * Belongs to the space and fires for every model unless `only` narrows it.
 * Sent every event; the payload's `event` says which. An `events` key from
 * older schemas is ignored.
 */
export interface Webhook {
  /**
     * Unique within the schema. Defaults to `url`; responses always carry it
     * @minLength 1
     */
  label?: string;
  /**
     * Starts with `http://` or `https://`. See SCHEMA.md for which addresses are sent to.
     * @pattern ^[Hh][Tt][Tt][Pp][Ss]?://.
     */
  url: string;
  /** The model name, or model names without repeats, this webhook is narrowed to; absent means every model. */
  only?: string | string[];
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

/**
 * Shown under the field's name in the editor, to say what the field expects.
 * @minLength 1
 */
export type FieldHelp = string;

export interface TextField {
  name: FieldName;
  type: TextFieldType;
  was?: FieldName;
  help?: FieldHelp;
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
  help?: FieldHelp;
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
  help?: FieldHelp;
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
  help?: FieldHelp;
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
  help?: FieldHelp;
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
  help?: FieldHelp;
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
  help?: FieldHelp;
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
  help?: FieldHelp;
  required?: boolean;
  /**
     * @minItems 1
     * @items.pattern ^[^,]*$
     */
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
  help?: FieldHelp;
  required?: boolean;
  /** An array of media ids, kept in their order; delivered as media objects, a file that is gone dropping out */
  many?: boolean;
}

export type ReferenceFieldType = typeof ReferenceFieldType[keyof typeof ReferenceFieldType];


export const ReferenceFieldType = {
  reference: 'reference',
} as const;

export interface ReferenceField {
  name: FieldName;
  type: ReferenceFieldType;
  was?: FieldName;
  help?: FieldHelp;
  required?: boolean;
  /** A model of the same schema */
  model: string;
  many?: boolean;
}

export type SlugFieldType = typeof SlugFieldType[keyof typeof SlugFieldType];


export const SlugFieldType = {
  slug: 'slug',
} as const;

/**
 * A second key of a list content, typed by the editor and unique within
 * the model. A list model has one at most, an object model none.
 */
export interface SlugField {
  name: FieldName;
  type: SlugFieldType;
  was?: FieldName;
  help?: FieldHelp;
  required?: boolean;
  pattern?: string;
}

export type CustomFieldFieldType = typeof CustomFieldFieldType[keyof typeof CustomFieldFieldType];


export const CustomFieldFieldType = {
  custom: 'custom',
} as const;

/**
 * Its value is an object of the custom field's fields' values.
 */
export interface CustomFieldField {
  name: FieldName;
  type: CustomFieldFieldType;
  was?: FieldName;
  help?: FieldHelp;
  required?: boolean;
  /** A custom field of the same schema */
  customField: FieldName;
}

export type RepeaterFieldType = typeof RepeaterFieldType[keyof typeof RepeaterFieldType];


export const RepeaterFieldType = {
  repeater: 'repeater',
} as const;

/**
 * Its value is an array of rows, each an object naming its custom field
 * in `fieldId` beside that custom field's fields' values. Only in a
 * model, not inside a custom field.
 */
export interface RepeaterField {
  name: FieldName;
  type: RepeaterFieldType;
  was?: FieldName;
  help?: FieldHelp;
  /** At least one row */
  required?: boolean;
  /**
     * Custom fields of the same schema a row may be.
     * @minItems 1
     */
  customFields: FieldName[];
}

/**
 * A field of a model. Each `type` takes its own options (SCHEMA.md
 * "Field"); any other key is refused with `invalid_schema`. `was` names
 * the field this one was renamed from — a deploy moves the key in every
 * stored content — and is never returned by a GET.
 */
export type Field = TextField | TextareaField | RichtextField | NumberField | BooleanField | DateField | DatetimeField | SelectField | MediaField | ReferenceField | SlugField | CustomFieldField | RepeaterField;

export interface Model {
  /** @pattern ^[a-z][a-z0-9-]*$ */
  name: string;
  kind: ModelKind;
  /**
     * Template for the editor's preview link, starting with `http://` or `https://`; `{CONTENT_ID}`, `{CONTENT_SLUG}` (the draft's) and `{DRAFT_KEY}` are substituted. A template with `{CONTENT_SLUG}` needs a slug field, and no link is shown while the slug is blank.
     * @pattern ^[Hh][Tt][Tt][Pp][Ss]?://.
     */
  previewUrl?: string;
  /**
     * Template for the editor's published page link, starting with `http://` or `https://`; `{CONTENT_ID}` and `{CONTENT_SLUG}` (the published one) are substituted. A template with `{CONTENT_SLUG}` needs a slug field, and no link is shown while the slug is blank.
     * @pattern ^[Hh][Tt][Tt][Pp][Ss]?://.
     */
  publicUrl?: string;
  /**
     * A text or slug field of this model, not one inside a custom
     * field, whose value the admin UI
     * shows for a content. Absent, a content is shown by its id.
     */
  label?: string;
  /**
     * The name this model had. A deploy renames it and moves its
     * contents instead of dropping them; the stored schema keeps the
     * new name alone, so a GET never returns it. See SCHEMA.md.
     * @pattern ^[a-z][a-z0-9-]*$
     */
  was?: string;
  /** Responses always carry it. */
  fields?: Field[];
}

/**
 * A set of fields a model uses as one field of type `custom`, or as the
 * rows of a `repeater`. Its fields are any type but `slug`, `custom` and
 * `repeater`, none is `unique` or carries `was`, and none is named
 * `fieldId`, which names a repeater row's custom field.
 */
export interface CustomField {
  name: FieldName;
  /** @minItems 1 */
  fields: Field[];
}

/**
 * One space's schema document; SCHEMA.md is normative. The space is named by the URL, not by the document.
 */
export interface Schema {
  koyaSchema: 1;
  /** Responses always carry it. */
  webhooks?: Webhook[];
  /** Responses always carry it. */
  models?: Model[];
  /** Omitted from the output when empty. */
  customFields?: CustomField[];
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
 * `media` and `reference` fields; arrays on `many` fields; an object of
 * its fields' values on a `custom` field; an array of rows on a
 * `repeater`, each an object naming its custom field in `fieldId` beside
 * that custom field's fields' values.
 */
export interface ContentData { [key: string]: unknown }

export interface CreateContent {
  data: ContentData;
  /**
     * `null` is as absent
     * @nullable
     */
  publish?: boolean | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  publishedAt?: Timestamp;
  revisedAt?: Timestamp;
}

export interface UpdateDraft {
  data: ContentData;
}

export interface PublishContent {
  /** `null` is as absent */
  data?: ContentData | null;
  publishedAt?: Timestamp;
}

/**
 * Delivery shape: the data with the system fields merged in. `media` fields
 * are expanded to Media objects (or `null` when the file is gone); `richtext`
 * HTML has its `/media/` URLs made absolute; `reference` fields are ids
 * unless embedded through `include`; the same goes for the fields inside
 * a `custom` field and a `repeater`'s rows, which keep their `fieldId`. With `fields`, only the named data
 * fields are present; the system fields always are.
 */
export interface Content {
  /** 12 lowercase letters and digits, made by the server; a content stored before keeps the id it had */
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
  /** 12 lowercase letters and digits, made by the server; a content stored before keeps the id it had */
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
  /** The number of contents that use it in a `media` or `richtext` field of the current schema */
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
 * `bad_query`: a malformed `filters`, an unknown field in `filters`/`orders`/`include`, an unknown operator, an operator or an order a custom field, a field inside one or a repeater does not take, a value that is not a number for a `number` field or not `true`/`false` for a `boolean` one, an `include` path with a segment that is not a reference (or, on the way to one, a custom field or a repeater), or a bad integer
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
 * `forbidden`: the delivery or management key belongs to another space; a space that does not exist is another space too
 */
export type ForbiddenResponse = ApiError;

/**
 * `not_found`: unknown model, content, media or endpoint
 */
export type NotFoundResponse = ApiError;

/**
 * `too_large`: the request body is over 21 MB
 */
export type TooLargeResponse = ApiError;

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
 * e.g. `-publishedAt,title`. Default: newest published first. `id`
 * orders by the ids' text, not by when the contents were made;
 * `createdAt` by its value, which creating the content may have given.
 */
export type OrdersParameter = string;

/**
 * `field[op]value` terms joined with `[and]` and `[or]`; `[or]` separates
 * groups of `[and]` terms. Operators: `equals`, `not_equals`, `contains`,
 * `not_contains`, `begins_with`, `exists`, `not_exists`, `less_than`,
 * `greater_than`. On a `many` field, `equals` and `contains` mean "has
 * this value", and `not_equals` and `not_contains` "does not have this
 * value". On a `richtext` field, `contains`, `not_contains` and
 * `begins_with` read its text without tags. On a `custom` field only
 * `contains` and `not_contains` work: `contains` matches when one of its
 * text, textarea, slug or richtext fields contains the value,
 * `not_contains` when none does; any other operator, or `orders` on it,
 * is `bad_query`. One of those fields is named through its custom field,
 * as `meta.title[contains]x`, and takes only `contains` and
 * `not_contains`. A `repeater` field is the same as a custom field, over
 * the fields of every row. Example:
 * `title[contains]lisp[and]publishedAt[exists]`.
 */
export type FiltersParameter = string;

/**
 * Search: the text of the model's `text`, `textarea`, `slug` and `richtext`
 * fields, those inside a custom field or a repeater's rows included,
 * contains it (rich text
 * without its tags), or it is a content's whole id. Applies together with
 * `filters`.
 */
export type QParameter = string;

/**
 * Comma-separated top-level fields to keep in each content; applied after
 * `include` and media expansion. A custom field or a repeater is kept
 * whole. The system
 * fields are always kept.
 */
export type FieldsParameter = string;

/**
 * Comma-separated reference fields to embed, dotted for nesting:
 * `tags,author.team` embeds `tags`, `author`, and `team` inside each `author`.
 * Only `reference` fields may be named; one inside a custom field is named
 * through it, as `meta.author`, and a path ending at a custom field or at
 * anything else inside it is `bad_query`. One in a repeater's rows is named
 * through the repeater, as `blocks.by`, and embedded in each row whose
 * custom field has a reference named `by`, the other rows left as they
 * are; a path that reaches no reference is `bad_query`. What is embedded is the referenced
 * contents' published data, even when the request carries a `draftKey`;
 * an embedded content carries no draft key. Referenced contents that
 * are missing or unpublished are dropped from a `many` field and `null` in a
 * single one.
 */
export type IncludeParameter = string;

/**
 * The content's draft key (from the admin API or the editor's preview link) serves its draft instead of the published data. The contents it embeds through `include` stay published.
 */
export type DraftKeyParameter = string;

export type GetListParams = {
/**
 * Values above 100 are clamped to 100.
 * @minimum 0
 */
limit?: LimitParameter;
/**
 * @minimum 0
 * @maximum 9223372036854776000
 */
offset?: OffsetParameter;
/**
 * Comma-separated field or system field names, `-` prefix for descending,
 * e.g. `-publishedAt,title`. Default: newest published first. `id`
 * orders by the ids' text, not by when the contents were made;
 * `createdAt` by its value, which creating the content may have given.
 */
orders?: OrdersParameter;
/**
 * Comma-separated top-level fields to keep in each content; applied after
 * `include` and media expansion. A custom field or a repeater is kept
 * whole. The system
 * fields are always kept.
 */
fields?: FieldsParameter;
/**
 * `field[op]value` terms joined with `[and]` and `[or]`; `[or]` separates
 * groups of `[and]` terms. Operators: `equals`, `not_equals`, `contains`,
 * `not_contains`, `begins_with`, `exists`, `not_exists`, `less_than`,
 * `greater_than`. On a `many` field, `equals` and `contains` mean "has
 * this value", and `not_equals` and `not_contains` "does not have this
 * value". On a `richtext` field, `contains`, `not_contains` and
 * `begins_with` read its text without tags. On a `custom` field only
 * `contains` and `not_contains` work: `contains` matches when one of its
 * text, textarea, slug or richtext fields contains the value,
 * `not_contains` when none does; any other operator, or `orders` on it,
 * is `bad_query`. One of those fields is named through its custom field,
 * as `meta.title[contains]x`, and takes only `contains` and
 * `not_contains`. A `repeater` field is the same as a custom field, over
 * the fields of every row. Example:
 * `title[contains]lisp[and]publishedAt[exists]`.
 */
filters?: FiltersParameter;
/**
 * Search: the text of the model's `text`, `textarea`, `slug` and `richtext`
 * fields, those inside a custom field or a repeater's rows included,
 * contains it (rich text
 * without its tags), or it is a content's whole id. Applies together with
 * `filters`.
 */
q?: QParameter;
/**
 * Comma-separated reference fields to embed, dotted for nesting:
 * `tags,author.team` embeds `tags`, `author`, and `team` inside each `author`.
 * Only `reference` fields may be named; one inside a custom field is named
 * through it, as `meta.author`, and a path ending at a custom field or at
 * anything else inside it is `bad_query`. One in a repeater's rows is named
 * through the repeater, as `blocks.by`, and embedded in each row whose
 * custom field has a reference named `by`, the other rows left as they
 * are; a path that reaches no reference is `bad_query`. What is embedded is the referenced
 * contents' published data, even when the request carries a `draftKey`;
 * an embedded content carries no draft key. Referenced contents that
 * are missing or unpublished are dropped from a `many` field and `null` in a
 * single one.
 */
include?: IncludeParameter;
};

export type GetListContentParams = {
/**
 * Comma-separated top-level fields to keep in each content; applied after
 * `include` and media expansion. A custom field or a repeater is kept
 * whole. The system
 * fields are always kept.
 */
fields?: FieldsParameter;
/**
 * Comma-separated reference fields to embed, dotted for nesting:
 * `tags,author.team` embeds `tags`, `author`, and `team` inside each `author`.
 * Only `reference` fields may be named; one inside a custom field is named
 * through it, as `meta.author`, and a path ending at a custom field or at
 * anything else inside it is `bad_query`. One in a repeater's rows is named
 * through the repeater, as `blocks.by`, and embedded in each row whose
 * custom field has a reference named `by`, the other rows left as they
 * are; a path that reaches no reference is `bad_query`. What is embedded is the referenced
 * contents' published data, even when the request carries a `draftKey`;
 * an embedded content carries no draft key. Referenced contents that
 * are missing or unpublished are dropped from a `many` field and `null` in a
 * single one.
 */
include?: IncludeParameter;
/**
 * The content's draft key (from the admin API or the editor's preview link) serves its draft instead of the published data. The contents it embeds through `include` stay published.
 */
draftKey?: DraftKeyParameter;
};

export type GetListContentBySlugParams = {
/**
 * Comma-separated top-level fields to keep in each content; applied after
 * `include` and media expansion. A custom field or a repeater is kept
 * whole. The system
 * fields are always kept.
 */
fields?: FieldsParameter;
/**
 * Comma-separated reference fields to embed, dotted for nesting:
 * `tags,author.team` embeds `tags`, `author`, and `team` inside each `author`.
 * Only `reference` fields may be named; one inside a custom field is named
 * through it, as `meta.author`, and a path ending at a custom field or at
 * anything else inside it is `bad_query`. One in a repeater's rows is named
 * through the repeater, as `blocks.by`, and embedded in each row whose
 * custom field has a reference named `by`, the other rows left as they
 * are; a path that reaches no reference is `bad_query`. What is embedded is the referenced
 * contents' published data, even when the request carries a `draftKey`;
 * an embedded content carries no draft key. Referenced contents that
 * are missing or unpublished are dropped from a `many` field and `null` in a
 * single one.
 */
include?: IncludeParameter;
/**
 * The content's draft key (from the admin API or the editor's preview link) serves its draft instead of the published data. The contents it embeds through `include` stay published.
 */
draftKey?: DraftKeyParameter;
};

export type GetObjectParams = {
/**
 * Comma-separated top-level fields to keep in each content; applied after
 * `include` and media expansion. A custom field or a repeater is kept
 * whole. The system
 * fields are always kept.
 */
fields?: FieldsParameter;
/**
 * Comma-separated reference fields to embed, dotted for nesting:
 * `tags,author.team` embeds `tags`, `author`, and `team` inside each `author`.
 * Only `reference` fields may be named; one inside a custom field is named
 * through it, as `meta.author`, and a path ending at a custom field or at
 * anything else inside it is `bad_query`. One in a repeater's rows is named
 * through the repeater, as `blocks.by`, and embedded in each row whose
 * custom field has a reference named `by`, the other rows left as they
 * are; a path that reaches no reference is `bad_query`. What is embedded is the referenced
 * contents' published data, even when the request carries a `draftKey`;
 * an embedded content carries no draft key. Referenced contents that
 * are missing or unpublished are dropped from a `many` field and `null` in a
 * single one.
 */
include?: IncludeParameter;
/**
 * The content's draft key (from the admin API or the editor's preview link) serves its draft instead of the published data. The contents it embeds through `include` stay published.
 */
draftKey?: DraftKeyParameter;
};

export type GetHealth200 = {
  status: 'ok';
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

export type GetAdminListParams = {
/**
 * Values above 100 are clamped to 100.
 * @minimum 0
 */
limit?: LimitParameter;
/**
 * @minimum 0
 * @maximum 9223372036854776000
 */
offset?: OffsetParameter;
/**
 * Comma-separated field or system field names, `-` prefix for descending,
 * e.g. `-publishedAt,title`. Default: newest published first. `id`
 * orders by the ids' text, not by when the contents were made;
 * `createdAt` by its value, which creating the content may have given.
 */
orders?: OrdersParameter;
/**
 * `field[op]value` terms joined with `[and]` and `[or]`; `[or]` separates
 * groups of `[and]` terms. Operators: `equals`, `not_equals`, `contains`,
 * `not_contains`, `begins_with`, `exists`, `not_exists`, `less_than`,
 * `greater_than`. On a `many` field, `equals` and `contains` mean "has
 * this value", and `not_equals` and `not_contains` "does not have this
 * value". On a `richtext` field, `contains`, `not_contains` and
 * `begins_with` read its text without tags. On a `custom` field only
 * `contains` and `not_contains` work: `contains` matches when one of its
 * text, textarea, slug or richtext fields contains the value,
 * `not_contains` when none does; any other operator, or `orders` on it,
 * is `bad_query`. One of those fields is named through its custom field,
 * as `meta.title[contains]x`, and takes only `contains` and
 * `not_contains`. A `repeater` field is the same as a custom field, over
 * the fields of every row. Example:
 * `title[contains]lisp[and]publishedAt[exists]`.
 */
filters?: FiltersParameter;
/**
 * Search: the text of the model's `text`, `textarea`, `slug` and `richtext`
 * fields, those inside a custom field or a repeater's rows included,
 * contains it (rich text
 * without its tags), or it is a content's whole id. Applies together with
 * `filters`.
 */
q?: QParameter;
};

export type GetAdminListContentDraftKey200 = {
  draftKey: string;
};

export type GetAdminObjectDraftKey200 = {
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
 * @maximum 9223372036854776000
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

export const getGetListUrl = (space: string,
    model: string,
    params?: GetListParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/${space}/lists/${model}?${stringifiedParams}` : `/api/v1/${space}/lists/${model}`
}

/**
 * A page of a `list` model's published contents. 404 for an `object` model.
 * @summary List published list contents
 */
export const getList = async (space: string,
    model: string,
    params?: GetListParams, options?: Parameters<typeof koyaFetch>[1]): Promise<ContentList> => {

  return koyaFetch<ContentList>(getGetListUrl(space,model,params),
  {
    ...options,
    method: 'GET'


  }
);}



export const getGetListContentUrl = (space: string,
    model: string,
    id: string,
    params?: GetListContentParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/${space}/lists/${model}/${id}?${stringifiedParams}` : `/api/v1/${space}/lists/${model}/${id}`
}

/**
 * Its draft with the right `draftKey`. 404 for an `object` model.
 * @summary Read one published list content
 */
export const getListContent = async (space: string,
    model: string,
    id: string,
    params?: GetListContentParams, options?: Parameters<typeof koyaFetch>[1]): Promise<Content> => {

  return koyaFetch<Content>(getGetListContentUrl(space,model,id,params),
  {
    ...options,
    method: 'GET'


  }
);}



export const getGetListContentBySlugUrl = (space: string,
    model: string,
    slug: string,
    params?: GetListContentBySlugParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/${space}/lists/${model}/slugs/${slug}?${stringifiedParams}` : `/api/v1/${space}/lists/${model}/slugs/${slug}`
}

/**
 * The content whose published slug it is, as `getListContent` reads it.
 * With the content's `draftKey`, its draft's slug finds it too, and its
 * draft is read; a key that is not the content's finds it by its published
 * slug only. 404 for an `object` model, a model without exactly one slug
 * field, or a slug two contents hold.
 * @summary Read one published list content by its slug
 */
export const getListContentBySlug = async (space: string,
    model: string,
    slug: string,
    params?: GetListContentBySlugParams, options?: Parameters<typeof koyaFetch>[1]): Promise<Content> => {

  return koyaFetch<Content>(getGetListContentBySlugUrl(space,model,slug,params),
  {
    ...options,
    method: 'GET'


  }
);}



export const getGetObjectUrl = (space: string,
    model: string,
    params?: GetObjectParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/api/v1/${space}/objects/${model}?${stringifiedParams}` : `/api/v1/${space}/objects/${model}`
}

/**
 * The one content of an `object` model, or its draft with the right
 * `draftKey`. 404 for a `list` model, or while the object is not published.
 * @summary Read a published object
 */
export const getObject = async (space: string,
    model: string,
    params?: GetObjectParams, options?: Parameters<typeof koyaFetch>[1]): Promise<Content> => {

  return koyaFetch<Content>(getGetObjectUrl(space,model,params),
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
export const getHealth = async ( options?: Parameters<typeof koyaFetch>[1]): Promise<GetHealth200> => {

  return koyaFetch<GetHealth200>(getGetHealthUrl(),
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




  return `/admin/api/${space}/schema`
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

  return stringifiedParams.length > 0 ? `/admin/api/${space}/schema?${stringifiedParams}` : `/admin/api/${space}/schema`
}

/**
 * Validates the document, diffs it against the space's stored schema and,
 * unless a destructive change is present without `force=true`, stores it.
 * Existing content changes only as the schema does: a rename carries it
 * through, and a removed or retyped field's values are taken out of every
 * published object, draft and revision. The space must already exist — it is
 * made in the admin UI — and a deploy to another name, one that does not
 * exist included, is a 403.
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




  return `/admin/api/${space}/schema/plan`
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



export const getGetAdminListUrl = (space: string,
    model: string,
    params?: GetAdminListParams,) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {

    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : String(value))
    }
  });

  const stringifiedParams = normalizedParams.toString();

  return stringifiedParams.length > 0 ? `/admin/api/${space}/lists/${model}?${stringifiedParams}` : `/admin/api/${space}/lists/${model}`
}

/**
 * A page of a `list` model's contents; takes the delivery API's `limit`,
 * `offset`, `orders`, `filters` and `q`, and they apply to the draft data
 * when a content has one. 404 for an `object` model.
 * @summary List every list content, drafts included
 */
export const getAdminList = async (space: string,
    model: string,
    params?: GetAdminListParams, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContentList> => {

  return koyaFetch<AdminContentList>(getGetAdminListUrl(space,model,params),
  {
    ...options,
    method: 'GET'


  }
);}



export const getCreateAdminListContentUrl = (space: string,
    model: string,) => {




  return `/admin/api/${space}/lists/${model}`
}

/**
 * Saved as a draft unless `publish` is true. The server makes the id: 12
 * lowercase letters and digits drawn at random, one the space does not
 * hold, and a body that gives `id` is a 400 (`null` is as absent). The system timestamps may be
 * supplied, for imports that keep another system's dates;
 * a timestamp needs a date, a time and an offset or `Z`, and is stored in
 * UTC with milliseconds.
 * `publishedAt` and `revisedAt` are only stored when publishing. 404 for an
 * `object` model: its object is made by its first write.
 * @summary Create a list content
 */
export const createAdminListContent = async (space: string,
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
return koyaFetch<AdminContent>(getCreateAdminListContentUrl(space,model),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(createContent)
  }
);}



export const getGetAdminListContentUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/${space}/lists/${model}/${id}`
}

/**
 * @summary Read a list content, both versions
 */
export const getAdminListContent = async (space: string,
    model: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

  return koyaFetch<AdminContent>(getGetAdminListContentUrl(space,model,id),
  {
    ...options,
    method: 'GET'


  }
);}



export const getUpdateAdminListContentUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/${space}/lists/${model}/${id}`
}

/**
 * `data` is merged onto the current draft (or, without one, the published
 * data): keys present replace, a `null` value removes the key, keys absent
 * stay. The result is validated whole. A new draft key is issued, so earlier
 * preview links stop working. When the result is what the content holds
 * already, nothing is written -- no draft, no revision, no webhook -- and
 * the content comes back as it is; when it is the published data again,
 * the draft is dropped, as `discard-draft` would.
 * @summary Save a draft
 */
export const updateAdminListContent = async (space: string,
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
return koyaFetch<AdminContent>(getUpdateAdminListContentUrl(space,model,id),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(updateDraft)
  }
);}



export const getDeleteAdminListContentUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/${space}/lists/${model}/${id}`
}

/**
 * Removes both versions. Fires `delete` webhooks, or `discard` for a content
 * that was only a draft.
 * Refused with 409 `in_use` while another content refers to it.
 * @summary Delete a list content
 */
export const deleteAdminListContent = async (space: string,
    model: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<DeletedResponse> => {

  return koyaFetch<DeletedResponse>(getDeleteAdminListContentUrl(space,model,id),
  {
    ...options,
    method: 'DELETE'


  }
);}



export const getGetAdminListContentBySlugUrl = (space: string,
    model: string,
    slug: string,) => {




  return `/admin/api/${space}/lists/${model}/slugs/${slug}`
}

/**
 * @summary Read a list content by its slug, both versions
 */
export const getAdminListContentBySlug = async (space: string,
    model: string,
    slug: string, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

  return koyaFetch<AdminContent>(getGetAdminListContentBySlugUrl(space,model,slug),
  {
    ...options,
    method: 'GET'


  }
);}



export const getUpdateAdminListContentBySlugUrl = (space: string,
    model: string,
    slug: string,) => {




  return `/admin/api/${space}/lists/${model}/slugs/${slug}`
}

/**
 * As `updateAdminListContent`.
 * @summary Save a draft of a list content found by its slug
 */
export const updateAdminListContentBySlug = async (space: string,
    model: string,
    slug: string,
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
return koyaFetch<AdminContent>(getUpdateAdminListContentBySlugUrl(space,model,slug),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(updateDraft)
  }
);}



export const getDeleteAdminListContentBySlugUrl = (space: string,
    model: string,
    slug: string,) => {




  return `/admin/api/${space}/lists/${model}/slugs/${slug}`
}

/**
 * As `deleteAdminListContent`.
 * @summary Delete a list content found by its slug
 */
export const deleteAdminListContentBySlug = async (space: string,
    model: string,
    slug: string, options?: Parameters<typeof koyaFetch>[1]): Promise<DeletedResponse> => {

  return koyaFetch<DeletedResponse>(getDeleteAdminListContentBySlugUrl(space,model,slug),
  {
    ...options,
    method: 'DELETE'


  }
);}



export const getPublishAdminListContentUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/${space}/lists/${model}/${id}/publish`
}

/**
 * Publishes `data` when given, else the current draft, else re-publishes the
 * published data. Clears the draft and its key. `publishedAt` overrides the
 * publish date; otherwise the first publish date is kept and `revisedAt` set
 * to now. Fires `publish` webhooks.
 * @summary Publish
 */
export const publishAdminListContent = async (space: string,
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
return koyaFetch<AdminContent>(getPublishAdminListContentUrl(space,model,id),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(publishContent)
  }
);}



export const getUnpublishAdminListContentUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/${space}/lists/${model}/${id}/unpublish`
}

/**
 * Takes the content off the delivery API. Its data (the draft when there is
 * one) is kept as a draft with a new draft key; `publishedAt` and `revisedAt`
 * are cleared.
 * Fires `unpublish` webhooks. A content that is not published is refused
 * with 409 `not_published`, and a published one with 409 `in_use` while
 * another content refers to it.
 * @summary Unpublish
 */
export const unpublishAdminListContent = async (space: string,
    model: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

  return koyaFetch<AdminContent>(getUnpublishAdminListContentUrl(space,model,id),
  {
    ...options,
    method: 'POST'


  }
);}



export const getDiscardAdminListContentDraftUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/${space}/lists/${model}/${id}/discard-draft`
}

/**
 * Fires `discard` webhooks. A content with no draft is refused with 409.
 * @summary Discard the draft of a published list content
 */
export const discardAdminListContentDraft = async (space: string,
    model: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

  return koyaFetch<AdminContent>(getDiscardAdminListContentDraftUrl(space,model,id),
  {
    ...options,
    method: 'POST'


  }
);}



export const getGetAdminListContentDraftKeyUrl = (space: string,
    model: string,
    id: string,) => {




  return `/admin/api/${space}/lists/${model}/${id}/draft-key`
}

/**
 * For building preview URLs. Generated on first call; replaced whenever a
 * draft is saved.
 * @summary The list content's draft key
 */
export const getAdminListContentDraftKey = async (space: string,
    model: string,
    id: string, options?: Parameters<typeof koyaFetch>[1]): Promise<GetAdminListContentDraftKey200> => {

  return koyaFetch<GetAdminListContentDraftKey200>(getGetAdminListContentDraftKeyUrl(space,model,id),
  {
    ...options,
    method: 'POST'


  }
);}



export const getGetAdminObjectUrl = (space: string,
    model: string,) => {




  return `/admin/api/${space}/objects/${model}`
}

/**
 * 404 for a `list` model, or before the object's first write.
 * @summary Read an object, both versions
 */
export const getAdminObject = async (space: string,
    model: string, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

  return koyaFetch<AdminContent>(getGetAdminObjectUrl(space,model),
  {
    ...options,
    method: 'GET'


  }
);}



export const getUpdateAdminObjectUrl = (space: string,
    model: string,) => {




  return `/admin/api/${space}/objects/${model}`
}

/**
 * As saving a draft of a list content. The first save makes the object,
 * filling the defaults; two first writes at once make one, and the other is
 * refused with 409 `object_exists`. 404 for a `list` model.
 * @summary Save a draft of an object
 */
export const updateAdminObject = async (space: string,
    model: string,
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
return koyaFetch<AdminContent>(getUpdateAdminObjectUrl(space,model),
  {
    ...options,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(updateDraft)
  }
);}



export const getPublishAdminObjectUrl = (space: string,
    model: string,) => {




  return `/admin/api/${space}/objects/${model}/publish`
}

/**
 * As publishing a list content. Before its first write, `data` makes the
 * object, published; without `data` that is a 404; two first writes at
 * once make one, and the other is refused with 409 `object_exists`. 404 for
 * a `list` model.
 * @summary Publish an object
 */
export const publishAdminObject = async (space: string,
    model: string,
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
return koyaFetch<AdminContent>(getPublishAdminObjectUrl(space,model),
  {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getHeaders(options?.headers) },
    body: JSON.stringify(publishContent)
  }
);}



export const getUnpublishAdminObjectUrl = (space: string,
    model: string,) => {




  return `/admin/api/${space}/objects/${model}/unpublish`
}

/**
 * As unpublishing a list content. 404 for a `list` model, or before the
 * object's first write.
 * @summary Unpublish an object
 */
export const unpublishAdminObject = async (space: string,
    model: string, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

  return koyaFetch<AdminContent>(getUnpublishAdminObjectUrl(space,model),
  {
    ...options,
    method: 'POST'


  }
);}



export const getDiscardAdminObjectDraftUrl = (space: string,
    model: string,) => {




  return `/admin/api/${space}/objects/${model}/discard-draft`
}

/**
 * As discarding the draft of a list content. 404 for a `list` model, or
 * before the object's first write.
 * @summary Discard the draft of an object
 */
export const discardAdminObjectDraft = async (space: string,
    model: string, options?: Parameters<typeof koyaFetch>[1]): Promise<AdminContent> => {

  return koyaFetch<AdminContent>(getDiscardAdminObjectDraftUrl(space,model),
  {
    ...options,
    method: 'POST'


  }
);}



export const getGetAdminObjectDraftKeyUrl = (space: string,
    model: string,) => {




  return `/admin/api/${space}/objects/${model}/draft-key`
}

/**
 * As the draft key of a list content. 404 for a `list` model, or before the
 * object's first write.
 * @summary The draft key of an object
 */
export const getAdminObjectDraftKey = async (space: string,
    model: string, options?: Parameters<typeof koyaFetch>[1]): Promise<GetAdminObjectDraftKey200> => {

  return koyaFetch<GetAdminObjectDraftKey200>(getGetAdminObjectDraftKeyUrl(space,model),
  {
    ...options,
    method: 'POST'


  }
);}



export const getListDeliveryKeysUrl = (space: string,) => {




  return `/admin/api/${space}/keys`
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




  return `/admin/api/${space}/keys`
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




  return `/admin/api/${space}/keys/${id}`
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

  return stringifiedParams.length > 0 ? `/admin/api/${space}/media?${stringifiedParams}` : `/admin/api/${space}/media`
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




  return `/admin/api/${space}/media`
}

/**
 * `multipart/form-data` with one or more `file` parts and an optional `alt`
 * applied to all of them. PNG, JPEG, GIF and WebP, up to 20 MB each and 20 MB
 * together, decided by the file's leading bytes; the part's Content-Type is
 * ignored. The whole request body is limited to 21 MB. A JPEG, PNG or WebP
 * is stored without its metadata but its orientation and colour profile.
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




  return `/admin/api/${space}/media/${id}`
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




  return `/admin/api/${space}/media/${id}`
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




  return `/admin/api/${space}/media/${id}`
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
