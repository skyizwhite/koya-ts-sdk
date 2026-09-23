import type { Media } from "./generated/koya.ts";

/**
 * What `koya types` emits for each model: its kind, the stored data (media and
 * references as ids), the delivered fields (media expanded) and which fields
 * reference which model.
 */
export interface ModelShape {
  kind: "list" | "object";
  data: object;
  fields: object;
  refs: { [field: string]: { model: string; many: boolean } };
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

/** `include` paths of model K: its reference fields, dotted into theirs, three deep. */
export type IncludePath<M extends ModelMap, K extends keyof M, D extends number = 3> = Untyped<M> extends true
  ? string
  : [D] extends [never]
  ? never
  : {
      [F in keyof M[K]["refs"] & string]:
        | F
        | (M[K]["refs"][F]["model"] extends keyof M ? `${F}.${IncludePath<M, M[K]["refs"][F]["model"], Prev[D]>}` : never);
    }[keyof M[K]["refs"] & string];

type NestedPaths<I extends string, F extends string> = I extends `${F}.${infer Rest}` ? Rest : never;

type Embedded<M extends ModelMap, Ref extends { model: string; many: boolean }, I extends string> =
  Ref["model"] extends keyof M
    ? Ref["many"] extends true
      ? Delivered<M, Ref["model"], I>[]
      : Delivered<M, Ref["model"], I> | null
    : unknown;

/** A delivered content of model K, with the references named by I embedded. */
export type Delivered<M extends ModelMap, K extends keyof M, I extends string = never> = Untyped<M> extends true
  ? SystemFields & { [field: string]: unknown }
  : SystemFields & {
  [F in keyof M[K]["fields"]]: F extends keyof M[K]["refs"] & string
    ? [I] extends [never]
      ? M[K]["fields"][F]
      : F extends I
        ? Embedded<M, M[K]["refs"][F], NestedPaths<I, F>> | Extract<M[K]["fields"][F], null>
        : [NestedPaths<I, F>] extends [never]
          ? M[K]["fields"][F]
          : Embedded<M, M[K]["refs"][F], NestedPaths<I, F>> | Extract<M[K]["fields"][F], null>
    : M[K]["fields"][F];
};

/** Narrowed to the keys named in `fields`, when it is given. */
export type Selected<T, F extends string> = [F] extends [never] ? T : Pick<T, F & keyof T>;

export type FieldName<M extends ModelMap, K extends keyof M> = Untyped<M> extends true
  ? string
  : (keyof SystemFields | keyof M[K]["fields"]) & string;

export type { Media };
