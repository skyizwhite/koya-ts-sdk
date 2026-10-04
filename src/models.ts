import type { Media } from "./generated/koya.ts";

/** A reference field: the model it points at, and whether it holds many. */
export interface RefShape {
  model: string;
  many: boolean;
}

/** The reference fields of a set of fields, and of the custom fields and repeater rows among them. */
export interface Refs {
  [field: string]: RefShape | { custom: { [field: string]: RefShape } } | { rows: { [fieldId: string]: { [field: string]: RefShape } } };
}

/**
 * What `koya types` emits for each model: its kind, the stored data (media and
 * references as ids), the delivered fields (media expanded) and which fields
 * reference which model, those inside a custom field or a repeater's rows included.
 */
export interface ModelShape {
  kind: "list" | "object";
  data: object;
  fields: object;
  refs: Refs;
}

export type ModelMap = { [model: string]: ModelShape };

/** Used when no generated types are passed: every model, any field. */
export interface AnyModels {
  [model: string]: {
    kind: "list" | "object";
    data: { [field: string]: unknown };
    fields: { [field: string]: unknown };
    refs: {};
  };
}

// AnyModels says nothing about a model's fields, so every query is a plain string
// and every content a plain object
type Untyped<M> = string extends keyof M ? true : false;

export interface SystemFields {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  revisedAt: string | null;
}

export type ListModels<M extends ModelMap> = { [K in keyof M]: "list" extends M[K]["kind"] ? K : never }[keyof M] & string;
export type ObjectModels<M extends ModelMap> = { [K in keyof M]: "object" extends M[K]["kind"] ? K : never }[keyof M] & string;

type Prev = [never, 0, 1, 2, 3];

// a custom field or a repeater is not a step of its own: its references count as the model's
type RefPaths<M extends ModelMap, R, D extends number> = {
  [F in keyof R & string]: R[F] extends RefShape
    ? F | (R[F]["model"] extends keyof M ? `${F}.${IncludePath<M, R[F]["model"], Prev[D]>}` : never)
    : R[F] extends { custom: infer C }
      ? `${F}.${RefPaths<M, C, D>}`
      : R[F] extends { rows: infer Rows }
        ? `${F}.${{ [Id in keyof Rows]: RefPaths<M, Rows[Id], D> }[keyof Rows]}`
        : never;
}[keyof R & string];

/**
 * `include` paths of model K: its reference fields, dotted into theirs, three deep.
 * A reference inside a custom field or a repeater's rows is named through it: `meta.author`, `blocks.by`.
 */
export type IncludePath<M extends ModelMap, K extends keyof M, D extends number = 3> = Untyped<M> extends true
  ? string
  : [D] extends [never]
  ? never
  : RefPaths<M, M[K]["refs"], D>;

type NestedPaths<I extends string, F extends string> = I extends `${F}.${infer Rest}` ? Rest : never;

type Embedded<M extends ModelMap, Ref extends RefShape, I extends string> =
  Ref["model"] extends keyof M
    ? Ref["many"] extends true
      ? Delivered<M, Ref["model"], I>[]
      : Delivered<M, Ref["model"], I> | null
    : unknown;

type Row<M extends ModelMap, T, Rows, I extends string> = T extends { fieldId: infer Id }
  ? Id extends keyof Rows
    ? Embed<M, T, Rows[Id], I>
    : T
  : T;

type Embed<M extends ModelMap, T, R, I extends string> = {
  [F in keyof T]: F extends keyof R & string
    ? [NestedPaths<I, F> | Extract<I, F>] extends [never]
      ? T[F]
      : R[F] extends RefShape
        ? Embedded<M, R[F], NestedPaths<I, F>> | Extract<T[F], null>
        : R[F] extends { custom: infer C }
          ? Embed<M, NonNullable<T[F]>, C, NestedPaths<I, F>> | Extract<T[F], null>
          : R[F] extends { rows: infer Rows }
            ? Row<M, NonNullable<T[F]> extends readonly (infer E)[] ? E : never, Rows, NestedPaths<I, F>>[] | Extract<T[F], null>
            : T[F]
    : T[F];
};

/** A delivered content of model K, with the references named by I embedded. */
export type Delivered<M extends ModelMap, K extends keyof M, I extends string = never> = Untyped<M> extends true
  ? SystemFields & { [field: string]: unknown }
  : SystemFields & Embed<M, M[K]["fields"], M[K]["refs"], I>;

/** Narrowed to the fields named in `fields`, when it is given; the system fields always stay. */
export type Selected<T, F extends string> = [F] extends [never] ? T : Pick<T, (F | keyof SystemFields) & keyof T>;

export type FieldName<M extends ModelMap, K extends keyof M> = Untyped<M> extends true
  ? string
  : (keyof SystemFields | keyof M[K]["fields"]) & string;

export type { Media };
