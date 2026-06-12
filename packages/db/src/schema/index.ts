import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  numeric,
  boolean,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const chapterEnum = pgEnum("chapter", ["7", "13", "11", "12"]);
export const districtEnum = pgEnum("district", ["CACB", "CAEB", "CANB", "CASB"]);
export const matterStatusEnum = pgEnum("matter_status", [
  "intake",
  "review",
  "ready_to_file",
  "filed",
  "closed",
]);
export const documentTypeEnum = pgEnum("document_type", [
  "drivers_license",
  "paystub",
  "bank_statement",
  "tax_return",
  "credit_report",
  "other",
]);
export const approvalStateEnum = pgEnum("approval_state", [
  "pending",
  "approved",
  "edited",
  "questioned",
]);
export const provenanceEventTypeEnum = pgEnum("provenance_event_type", [
  "ai_extracted",
  "attorney_approved",
  "attorney_edited",
  "attorney_questioned",
  "system_computed",
  "credit_imported",
]);

export const firms = pgTable("firms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  clerkOrgId: text("clerk_org_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    role: text("role").notNull().default("attorney"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("users_firm_id_idx").on(table.firmId)]
);

export const matters = pgTable(
  "matters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    chapter: chapterEnum("chapter").notNull().default("7"),
    district: districtEnum("district").notNull().default("CACB"),
    status: matterStatusEnum("status").notNull().default("intake"),
    caseNumber: text("case_number"),
    debtorDisplayName: text("debtor_display_name"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("matters_firm_id_idx").on(table.firmId),
    index("matters_status_idx").on(table.status),
  ]
);

export const parties = pgTable(
  "parties",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // debtor1, debtor2, codebtor, spouse
    firstName: text("first_name"),
    middleName: text("middle_name"),
    lastName: text("last_name"),
    suffix: text("suffix"),
    ssnToken: text("ssn_token"), // tokenized, never raw SSN
    ssnLast4: text("ssn_last4"),
    dateOfBirth: text("date_of_birth"), // tokenized or redacted
    address: jsonb("address").$type<{
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
    }>(),
    phone: text("phone"),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("parties_matter_id_idx").on(table.matterId),
    index("parties_firm_id_idx").on(table.firmId),
  ]
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id),
    documentType: documentTypeEnum("document_type").notNull().default("other"),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    storageKey: text("storage_key").notNull(),
    encryptionKeyId: text("encryption_key_id").notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    sha256Hash: text("sha256_hash").notNull(),
    parsedAt: timestamp("parsed_at", { withTimezone: true }),
    parseMetadata: jsonb("parse_metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("documents_matter_id_idx").on(table.matterId),
    index("documents_firm_id_idx").on(table.firmId),
  ]
);

export const formInstances = pgTable(
  "form_instances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    formId: text("form_id").notNull(),
    formVersion: text("form_version").notNull(),
    schemaHash: text("schema_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("form_instances_matter_form_idx").on(table.matterId, table.formId),
    index("form_instances_firm_id_idx").on(table.firmId),
  ]
);

export const formFields = pgTable(
  "form_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formInstanceId: uuid("form_instance_id")
      .notNull()
      .references(() => formInstances.id, { onDelete: "cascade" }),
    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    fieldPath: text("field_path").notNull(),
    proposedValue: jsonb("proposed_value").notNull(),
    approvedValue: jsonb("approved_value"),
    approvalState: approvalStateEnum("approval_state").notNull().default("pending"),
    confidence: numeric("confidence", { precision: 5, scale: 4 }),
    approvedByUserId: uuid("approved_by_user_id").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("form_fields_form_instance_id_idx").on(table.formInstanceId),
    index("form_fields_matter_id_idx").on(table.matterId),
    index("form_fields_firm_id_idx").on(table.firmId),
    index("form_fields_approval_state_idx").on(table.approvalState),
    uniqueIndex("form_fields_instance_path_idx").on(table.formInstanceId, table.fieldPath),
  ]
);

export const provenanceEvents = pgTable(
  "provenance_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formFieldId: uuid("form_field_id")
      .notNull()
      .references(() => formFields.id, { onDelete: "cascade" }),
    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    eventType: provenanceEventTypeEnum("event_type").notNull(),
    previousValue: jsonb("previous_value"),
    newValue: jsonb("new_value").notNull(),
    sourceDocumentId: uuid("source_document_id").references(() => documents.id),
    boundingBox: jsonb("bounding_box").$type<{
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }>(),
    modelName: text("model_name"),
    modelVersion: text("model_version"),
    promptHash: text("prompt_hash"),
    confidence: numeric("confidence", { precision: 5, scale: 4 }),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("provenance_events_form_field_id_idx").on(table.formFieldId),
    index("provenance_events_matter_id_idx").on(table.matterId),
    index("provenance_events_firm_id_idx").on(table.firmId),
    index("provenance_events_created_at_idx").on(table.createdAt),
  ]
);

export const creditTradelines = pgTable(
  "credit_tradelines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    creditorName: text("creditor_name").notNull(),
    accountNumberLast4: text("account_number_last4"),
    balance: numeric("balance", { precision: 14, scale: 2 }).notNull(),
    monthlyPayment: numeric("monthly_payment", { precision: 14, scale: 2 }),
    accountType: text("account_type"),
    scheduledTo: text("scheduled_to"), // D, E, F, G
    classificationConfidence: numeric("classification_confidence", {
      precision: 5,
      scale: 4,
    }),
    rawTradeline: jsonb("raw_tradeline").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("credit_tradelines_matter_id_idx").on(table.matterId),
    index("credit_tradelines_firm_id_idx").on(table.firmId),
  ]
);

export const extractionJobs = pgTable(
  "extraction_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matterId: uuid("matter_id")
      .notNull()
      .references(() => matters.id, { onDelete: "cascade" }),
    firmId: uuid("firm_id")
      .notNull()
      .references(() => firms.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    documentIds: jsonb("document_ids").$type<string[]>().notNull(),
    targetForms: jsonb("target_forms").$type<string[]>().notNull(),
    fieldsExtracted: integer("fields_extracted").default(0),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("extraction_jobs_matter_id_idx").on(table.matterId),
    index("extraction_jobs_status_idx").on(table.status),
  ]
);

export const firmsRelations = relations(firms, ({ many }) => ({
  users: many(users),
  matters: many(matters),
}));

export const mattersRelations = relations(matters, ({ one, many }) => ({
  firm: one(firms, { fields: [matters.firmId], references: [firms.id] }),
  parties: many(parties),
  documents: many(documents),
  formInstances: many(formInstances),
  formFields: many(formFields),
}));

export const formFieldsRelations = relations(formFields, ({ one, many }) => ({
  formInstance: one(formInstances, {
    fields: [formFields.formInstanceId],
    references: [formInstances.id],
  }),
  provenanceEvents: many(provenanceEvents),
}));

export const provenanceEventsRelations = relations(provenanceEvents, ({ one }) => ({
  formField: one(formFields, {
    fields: [provenanceEvents.formFieldId],
    references: [formFields.id],
  }),
  sourceDocument: one(documents, {
    fields: [provenanceEvents.sourceDocumentId],
    references: [documents.id],
  }),
}));
