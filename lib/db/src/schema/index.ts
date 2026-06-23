import {
  pgTable,
  text,
  boolean,
  integer,
  real,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  color: text("color"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subcategories = pgTable(
  "subcategories",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("subcategories_category_slug_idx").on(t.categoryId, t.slug),
    index("subcategories_category_id_idx").on(t.categoryId),
  ]
);

export const tags = pgTable(
  "tags",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("tags_slug_idx").on(t.slug)]
);

export const entities = pgTable(
  "entities",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    subcategoryId: text("subcategory_id").references(() => subcategories.id, { onDelete: "set null" }),
    difficulty: real("difficulty").notNull().default(1.0),
    popularity: integer("popularity").notNull().default(50),
    tagCache: text("tag_cache").notNull().default(""),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("entities_category_slug_idx").on(t.categoryId, t.slug),
    index("entities_category_id_idx").on(t.categoryId),
    index("entities_subcategory_id_idx").on(t.subcategoryId),
    index("entities_name_idx").on(t.name),
  ]
);

export const entityTags = pgTable(
  "entity_tags",
  {
    entityId: text("entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
    tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
    weight: real("weight").notNull().default(1.0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.entityId, t.tagId] }),
    index("entity_tags_tag_id_idx").on(t.tagId),
    index("entity_tags_entity_id_idx").on(t.entityId),
  ]
);

export const questions = pgTable(
  "questions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    text: text("text").notNull(),
    primaryTagId: text("primary_tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    inverted: boolean("inverted").notNull().default(false),
    timesAsked: integer("times_asked").notNull().default(0),
    successCount: integer("success_count").notNull().default(0),
    failCount: integer("fail_count").notNull().default(0),
    avgInfoGain: real("avg_info_gain").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("questions_primary_tag_id_idx").on(t.primaryTagId),
    index("questions_category_id_idx").on(t.categoryId),
  ]
);

export const gameSessions = pgTable(
  "game_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    categoryFilter: text("category_filter"),
    scoreboard: text("scoreboard").notNull().default("[]"),
    history: text("history").notNull().default("[]"),
    askedIds: text("asked_ids").notNull().default("[]"),
    status: text("status").notNull().default("playing"),
    guessesMade: text("guesses_made").notNull().default("[]"),
    questionCount: integer("question_count").notNull().default(0),
    currentGuess: text("current_guess"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("game_sessions_status_idx").on(t.status),
    index("game_sessions_created_at_idx").on(t.createdAt),
  ]
);

export const gameResults = pgTable(
  "game_results",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    category: text("category"),
    questionCount: integer("question_count").notNull(),
    won: boolean("won").notNull(),
    guessedEntity: text("guessed_entity").notNull(),
    correctEntity: text("correct_entity"),
    durationSec: integer("duration_sec").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("game_results_won_idx").on(t.won),
    index("game_results_category_idx").on(t.category),
    index("game_results_created_at_idx").on(t.createdAt),
  ]
);

export const learnings = pgTable(
  "learnings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    correctAnswer: text("correct_answer").notNull(),
    category: text("category"),
    description: text("description"),
    existingEntityId: text("existing_entity_id"),
    history: text("history").notNull(),
    aiGuesses: text("ai_guesses").notNull(),
    status: text("status").notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("learnings_status_idx").on(t.status),
    index("learnings_created_at_idx").on(t.createdAt),
  ]
);

export const feedback = pgTable(
  "feedback",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    type: text("type").notNull(),
    message: text("message").notNull(),
    context: text("context"),
    rating: integer("rating"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("feedback_type_idx").on(t.type)]
);

export const settings = pgTable("settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  type: text("type").notNull().default("string"),
  group: text("group").notNull().default("game"),
  label: text("label"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ageSessions = pgTable(
  "age_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    minAge: integer("min_age").notNull().default(0),
    maxAge: integer("max_age").notNull().default(100),
    history: text("history").notNull().default("[]"),
    askedIds: text("asked_ids").notNull().default("[]"),
    status: text("status").notNull().default("playing"),
    questionCount: integer("question_count").notNull().default(0),
    finalGuess: integer("final_guess"),
    finalMin: integer("final_min"),
    finalMax: integer("final_max"),
    confidence: integer("confidence"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("age_sessions_status_idx").on(t.status),
    index("age_sessions_created_at_idx").on(t.createdAt),
  ]
);

export const ageResults = pgTable(
  "age_results",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    questionCount: integer("question_count").notNull(),
    won: boolean("won").notNull(),
    guessedAge: integer("guessed_age").notNull(),
    guessedMin: integer("guessed_min").notNull(),
    guessedMax: integer("guessed_max").notNull(),
    actualAge: integer("actual_age"),
    durationSec: integer("duration_sec").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("age_results_won_idx").on(t.won),
    index("age_results_created_at_idx").on(t.createdAt),
  ]
);

export const ageQuestions = pgTable(
  "age_questions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    text: text("text").notNull(),
    tag: text("tag").notNull(),
    category: text("category").notNull().default("life_event"),
    yesMin: integer("yes_min").notNull().default(0),
    yesMax: integer("yes_max").notNull().default(100),
    noMin: integer("no_min").notNull().default(0),
    noMax: integer("no_max").notNull().default(100),
    isActive: boolean("is_active").notNull().default(true),
    timesAsked: integer("times_asked").notNull().default(0),
    successCount: integer("success_count").notNull().default(0),
    avgInfoGain: real("avg_info_gain").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("age_questions_tag_idx").on(t.tag),
    index("age_questions_category_idx").on(t.category),
    index("age_questions_is_active_idx").on(t.isActive),
  ]
);

export const ageLearnings = pgTable(
  "age_learnings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    guessedAge: integer("guessed_age").notNull(),
    guessedMin: integer("guessed_min").notNull(),
    guessedMax: integer("guessed_max").notNull(),
    actualAge: integer("actual_age").notNull(),
    history: text("history").notNull(),
    status: text("status").notNull().default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("age_learnings_status_idx").on(t.status),
    index("age_learnings_created_at_idx").on(t.createdAt),
  ]
);

export type Category = typeof categories.$inferSelect;
export type Entity = typeof entities.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type EntityTag = typeof entityTags.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type GameResult = typeof gameResults.$inferSelect;
export type Learning = typeof learnings.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type AgeSession = typeof ageSessions.$inferSelect;
export type AgeQuestion = typeof ageQuestions.$inferSelect;