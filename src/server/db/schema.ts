// Drizzle ORM schema — the 10-table relational model from §3.4 of the report,
// translated from MySQL to Postgres (Neon in production, PGlite locally).
//
// MySQL → Postgres mapping notes:
//   INT AUTO_INCREMENT      → integer generatedAlwaysAsIdentity()
//   ENUM(...)               → pgEnum(...)
//   TINYINT(1)              → boolean
//   TIMESTAMP               → timestamp({ withTimezone: true })  (timestamptz)
//   image columns (3x)      → text[]  (single array column — an improvement)

import {
  pgTable,
  pgEnum,
  integer,
  varchar,
  text,
  boolean,
  date,
  timestamp,
  numeric,
  smallint,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const userTypeEnum = pgEnum("user_type", ["farmer", "buyer", "admin"]);
export const businessTypeEnum = pgEnum("business_type", [
  "retailer",
  "wholesaler",
  "processor",
  "restaurant",
  "institution",
  "individual",
]);
export const qualityGradeEnum = pgEnum("quality_grade", ["Grade A", "Grade B", "Grade C"]);
export const listingStatusEnum = pgEnum("listing_status", [
  "active",
  "sold",
  "expired",
  "withdrawn",
]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "disputed",
]);

// ── 1. users (identity + auth) ────────────────────────────────────────────────
export const users = pgTable("users", {
  id: integer("user_id").primaryKey().generatedAlwaysAsIdentity(),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 150 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  userType: userTypeEnum("user_type").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  isSuspended: boolean("is_suspended").notNull().default(false),
  verificationToken: varchar("verification_token", { length: 255 }),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── 2. farmer_profiles ────────────────────────────────────────────────────────
export const farmerProfiles = pgTable("farmer_profiles", {
  id: integer("profile_id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  lga: varchar("lga", { length: 100 }),
  ward: varchar("ward", { length: 100 }),
  farmSizeHectares: numeric("farm_size_hectares", { precision: 5, scale: 2 }),
  primaryCommodities: text("primary_commodities"),
  yearsExperience: integer("years_experience"),
});

// ── 3. buyer_profiles ─────────────────────────────────────────────────────────
export const buyerProfiles = pgTable("buyer_profiles", {
  id: integer("profile_id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  businessName: varchar("business_name", { length: 150 }),
  businessType: businessTypeEnum("business_type"),
  deliveryAddress: text("delivery_address"),
  preferredCommodities: text("preferred_commodities"),
});

// ── 4. commodity_categories ───────────────────────────────────────────────────
export const commodityCategories = pgTable("commodity_categories", {
  id: integer("category_id").primaryKey().generatedAlwaysAsIdentity(),
  categoryName: varchar("category_name", { length: 100 }).notNull().unique(),
});

// ── 5. produce_listings (central transactional table) ─────────────────────────
export const produceListings = pgTable(
  "produce_listings",
  {
    id: integer("listing_id").primaryKey().generatedAlwaysAsIdentity(),
    farmerId: integer("farmer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").references(() => commodityCategories.id),
    commodityName: varchar("commodity_name", { length: 150 }).notNull(),
    quantityAvailableKg: numeric("quantity_available_kg", { precision: 10, scale: 2 }).notNull(),
    askingPricePerKg: numeric("asking_price_per_kg", { precision: 10, scale: 2 }).notNull(),
    qualityGrade: qualityGradeEnum("quality_grade").notNull().default("Grade B"),
    qualityDescription: text("quality_description"),
    harvestDate: date("harvest_date"),
    availableFrom: date("available_from"),
    imageUrls: text("image_urls").array(),
    listingStatus: listingStatusEnum("listing_status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_listing_status").on(t.listingStatus),
    index("idx_listing_farmer").on(t.farmerId),
  ],
);

// ── 6. market_prices ──────────────────────────────────────────────────────────
export const marketPrices = pgTable("market_prices", {
  id: integer("price_id").primaryKey().generatedAlwaysAsIdentity(),
  commodityName: varchar("commodity_name", { length: 150 }).notNull(),
  marketName: varchar("market_name", { length: 100 }).notNull(),
  pricePerKgLow: numeric("price_per_kg_low", { precision: 10, scale: 2 }).notNull(),
  pricePerKgHigh: numeric("price_per_kg_high", { precision: 10, scale: 2 }).notNull(),
  recordedDate: date("recorded_date").notNull(),
  dataSource: varchar("data_source", { length: 200 }),
});

// ── 7. messages ───────────────────────────────────────────────────────────────
export const messages = pgTable(
  "messages",
  {
    id: integer("message_id").primaryKey().generatedAlwaysAsIdentity(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => produceListings.id, { onDelete: "cascade" }),
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: integer("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    messageBody: text("message_body").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [index("idx_message_recipient").on(t.recipientId)],
);

// ── 8. transactions ───────────────────────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id: integer("transaction_id").primaryKey().generatedAlwaysAsIdentity(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => produceListings.id, { onDelete: "cascade" }),
  buyerId: integer("buyer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  farmerId: integer("farmer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quantityAgreedKg: numeric("quantity_agreed_kg", { precision: 10, scale: 2 }).notNull(),
  agreedPricePerKg: numeric("agreed_price_per_kg", { precision: 10, scale: 2 }).notNull(),
  totalValue: numeric("total_value", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionStatus: transactionStatusEnum("transaction_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ── 9. user_ratings ───────────────────────────────────────────────────────────
export const userRatings = pgTable(
  "user_ratings",
  {
    id: integer("rating_id").primaryKey().generatedAlwaysAsIdentity(),
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" })
      .unique(),
    raterId: integer("rater_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rateeId: integer("ratee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ratingScore: smallint("rating_score").notNull(),
    reviewText: text("review_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_rating_ratee").on(t.rateeId)],
);

// ── 10. system_notifications ──────────────────────────────────────────────────
export const systemNotifications = pgTable(
  "system_notifications",
  {
    id: integer("notification_id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationType: varchar("notification_type", { length: 50 }).notNull(),
    notificationMessage: text("notification_message").notNull(),
    relatedEntityId: integer("related_entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_notification_user").on(t.userId)],
);

// ── Relations (for typed joins) ───────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  farmerProfile: one(farmerProfiles, {
    fields: [users.id],
    references: [farmerProfiles.userId],
  }),
  buyerProfile: one(buyerProfiles, {
    fields: [users.id],
    references: [buyerProfiles.userId],
  }),
  listings: many(produceListings),
}));

export const listingRelations = relations(produceListings, ({ one, many }) => ({
  farmer: one(users, { fields: [produceListings.farmerId], references: [users.id] }),
  category: one(commodityCategories, {
    fields: [produceListings.categoryId],
    references: [commodityCategories.id],
  }),
  messages: many(messages),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ProduceListing = typeof produceListings.$inferSelect;
export type NewProduceListing = typeof produceListings.$inferInsert;
export type MarketPrice = typeof marketPrices.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type UserRating = typeof userRatings.$inferSelect;
export type SystemNotification = typeof systemNotifications.$inferSelect;
