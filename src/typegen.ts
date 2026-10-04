import type { CustomField, Field, Model, Schema } from "./generated/koya.ts";

function typeName(model: string): string {
  return model.replace(/(^|-)([a-z0-9])/g, (_, _dash, c: string) => c.toUpperCase());
}

function shapeName(customField: string, delivered: boolean): string {
  return `${typeName(customField)}${delivered ? "Fields" : "Data"}`;
}

function valueType(field: Field, delivered: boolean): string {
  switch (field.type) {
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "select": {
      const one = field.options.map((o) => JSON.stringify(o)).join(" | ");
      return field.many ? `(${one})[]` : one;
    }
    case "reference":
      return field.many ? "string[]" : "string";
    case "media":
      // a media whose file is gone is delivered as null, required or not, and drops out of a many field
      if (field.many) return delivered ? "koya.Media[]" : "string[]";
      return delivered ? "koya.Media | null" : "string";
    case "custom":
      return shapeName(field.customField, delivered);
    case "repeater": {
      const rows = field.customFields.map((c) => `({ fieldId: ${JSON.stringify(c)} } & ${shapeName(c, delivered)})`);
      return `(${rows.join(" | ")})[]`;
    }
    default:
      return "string";
  }
}

function property(field: Field, delivered: boolean): string {
  const type = valueType(field, delivered);
  const help = field.help ? `  /** ${field.help.replace(/\*\//g, "*\\/").replace(/\s*\n\s*/g, " ")} */\n` : "";
  if (field.required) return `${help}  ${field.name}: ${type};`;
  return `${help}  ${field.name}?: ${type.endsWith("| null") ? type : `${type} | null`};`;
}

function body(fields: Field[], delivered: boolean): string {
  return fields.length ? `{\n${fields.map((f) => property(f, delivered)).join("\n")}\n}` : "{}";
}

function modelTypes(model: Model): string {
  const name = typeName(model.name);
  const fields = model.fields ?? [];
  return [
    `/** \`${model.name}\` as stored: media and references are ids. */`,
    `export interface ${name}Data ${body(fields, false)}`,
    "",
    `/** \`${model.name}\` as delivered, without the system fields. */`,
    `export interface ${name}Fields ${body(fields, true)}`,
  ].join("\n");
}

function customFieldTypes(customField: CustomField): string {
  return [
    `/** The custom field \`${customField.name}\` as stored: media and references are ids. */`,
    `export interface ${shapeName(customField.name, false)} ${body(customField.fields, false)}`,
    "",
    `/** The custom field \`${customField.name}\` as delivered. */`,
    `export interface ${shapeName(customField.name, true)} ${body(customField.fields, true)}`,
  ].join("\n");
}

function referenceRefs(fields: Field[]): string[] {
  return fields.flatMap((f) =>
    f.type === "reference" ? [`${JSON.stringify(f.name)}: { model: ${JSON.stringify(f.model)}; many: ${f.many ? "true" : "false"} }`] : [],
  );
}

function refs(fields: Field[], customFields: Map<string, CustomField>): string[] {
  const inside = (name: string) => referenceRefs(customFields.get(name)?.fields ?? []);
  return fields.flatMap((f) => {
    if (f.type === "reference") return referenceRefs([f]);
    if (f.type === "custom") {
      const custom = inside(f.customField);
      return custom.length ? [`${JSON.stringify(f.name)}: { custom: { ${custom.join("; ")} } }`] : [];
    }
    if (f.type === "repeater") {
      const rows = f.customFields.flatMap((c) => {
        const row = inside(c);
        return row.length ? [`${JSON.stringify(c)}: { ${row.join("; ")} }`] : [];
      });
      return rows.length ? [`${JSON.stringify(f.name)}: { rows: { ${rows.join("; ")} } }`] : [];
    }
    return [];
  });
}

function modelEntry(model: Model, customFields: Map<string, CustomField>): string {
  const name = typeName(model.name);
  const entries = refs(model.fields ?? [], customFields);
  return [
    `  ${JSON.stringify(model.name)}: {`,
    `    kind: ${JSON.stringify(model.kind)};`,
    `    data: ${name}Data;`,
    `    fields: ${name}Fields;`,
    `    refs: ${entries.length ? `{ ${entries.join("; ")} }` : "{}"};`,
    "  };",
  ].join("\n");
}

function usedCustomFields(models: Model[]): Set<string> {
  const used = new Set<string>();
  for (const field of models.flatMap((m) => m.fields ?? [])) {
    if (field.type === "custom") used.add(field.customField);
    if (field.type === "repeater") field.customFields.forEach((c) => used.add(c));
  }
  return used;
}

/**
 * TypeScript declarations for a schema: per model `<Name>Data` and
 * `<Name>Fields`, the same pair per custom field a model uses, and
 * `KoyaModels`, which `createClient` and `createAdminClient` take.
 */
export function generateTypes(schema: Schema, { from = "koya-ts-sdk" }: { from?: string } = {}): string {
  const models = schema.models ?? [];
  const used = usedCustomFields(models);
  const customFields = (schema.customFields ?? []).filter((c) => used.has(c.name));
  const names = new Map<string, string>();
  for (const model of models) {
    const name = typeName(model.name);
    const other = names.get(name);
    if (other) throw new Error(`models ${other} and ${model.name} would both be typed ${name}`);
    names.set(name, model.name);
  }
  for (const customField of customFields) {
    const name = typeName(customField.name);
    const model = names.get(name);
    if (model) throw new Error(`model ${model} and custom field ${customField.name} would both be typed ${name}`);
  }
  const byName = new Map(customFields.map((c) => [c.name, c]));
  return [
    "// Generated by koya-ts-sdk (`koya types`) from a koya schema. Do not edit.",
    "",
    `import type * as koya from ${JSON.stringify(from)};`,
    "",
    ...models.flatMap((m) => [modelTypes(m), ""]),
    ...customFields.flatMap((c) => [customFieldTypes(c), ""]),
    // a type alias, not an interface, so that it is assignable to ModelMap's index signature
    "export type KoyaModels = {",
    ...models.map((m) => modelEntry(m, byName)),
    "};",
    "",
  ].join("\n");
}
