CREATE TYPE "public"."business_type" AS ENUM('retailer', 'wholesaler', 'processor', 'restaurant', 'institution', 'individual');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('active', 'sold', 'expired', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."quality_grade" AS ENUM('Grade A', 'Grade B', 'Grade C');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'confirmed', 'completed', 'cancelled', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('farmer', 'buyer', 'admin');--> statement-breakpoint
CREATE TABLE "buyer_profiles" (
	"profile_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "buyer_profiles_profile_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"business_name" varchar(150),
	"business_type" "business_type",
	"delivery_address" text,
	"preferred_commodities" text,
	CONSTRAINT "buyer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "commodity_categories" (
	"category_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "commodity_categories_category_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"category_name" varchar(100) NOT NULL,
	CONSTRAINT "commodity_categories_category_name_unique" UNIQUE("category_name")
);
--> statement-breakpoint
CREATE TABLE "farmer_profiles" (
	"profile_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "farmer_profiles_profile_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"lga" varchar(100),
	"ward" varchar(100),
	"farm_size_hectares" numeric(5, 2),
	"primary_commodities" text,
	"years_experience" integer,
	CONSTRAINT "farmer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "market_prices" (
	"price_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "market_prices_price_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"commodity_name" varchar(150) NOT NULL,
	"market_name" varchar(100) NOT NULL,
	"price_per_kg_low" numeric(10, 2) NOT NULL,
	"price_per_kg_high" numeric(10, 2) NOT NULL,
	"recorded_date" date NOT NULL,
	"data_source" varchar(200)
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"message_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "messages_message_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"listing_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"message_body" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "produce_listings" (
	"listing_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "produce_listings_listing_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"farmer_id" integer NOT NULL,
	"category_id" integer,
	"commodity_name" varchar(150) NOT NULL,
	"quantity_available_kg" numeric(10, 2) NOT NULL,
	"asking_price_per_kg" numeric(10, 2) NOT NULL,
	"quality_grade" "quality_grade" DEFAULT 'Grade B' NOT NULL,
	"quality_description" text,
	"harvest_date" date,
	"available_from" date,
	"image_urls" text[],
	"listing_status" "listing_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_notifications" (
	"notification_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "system_notifications_notification_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"notification_type" varchar(50) NOT NULL,
	"notification_message" text NOT NULL,
	"related_entity_id" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"transaction_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "transactions_transaction_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"listing_id" integer NOT NULL,
	"buyer_id" integer NOT NULL,
	"farmer_id" integer NOT NULL,
	"quantity_agreed_kg" numeric(10, 2) NOT NULL,
	"agreed_price_per_kg" numeric(10, 2) NOT NULL,
	"total_value" numeric(12, 2) NOT NULL,
	"payment_method" varchar(50),
	"transaction_status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_ratings" (
	"rating_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_ratings_rating_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"transaction_id" integer NOT NULL,
	"rater_id" integer NOT NULL,
	"ratee_id" integer NOT NULL,
	"rating_score" smallint NOT NULL,
	"review_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_ratings_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"full_name" varchar(150) NOT NULL,
	"phone" varchar(30),
	"email" varchar(150) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"user_type" "user_type" NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"verification_token" varchar(255),
	"reset_token" varchar(255),
	"reset_token_expiry" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_profiles" ADD CONSTRAINT "farmer_profiles_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_listing_id_produce_listings_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."produce_listings"("listing_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produce_listings" ADD CONSTRAINT "produce_listings_farmer_id_users_user_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produce_listings" ADD CONSTRAINT "produce_listings_category_id_commodity_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."commodity_categories"("category_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_notifications" ADD CONSTRAINT "system_notifications_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_listing_id_produce_listings_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."produce_listings"("listing_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buyer_id_users_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_farmer_id_users_user_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ratings" ADD CONSTRAINT "user_ratings_transaction_id_transactions_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("transaction_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ratings" ADD CONSTRAINT "user_ratings_rater_id_users_user_id_fk" FOREIGN KEY ("rater_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ratings" ADD CONSTRAINT "user_ratings_ratee_id_users_user_id_fk" FOREIGN KEY ("ratee_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_message_recipient" ON "messages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_listing_status" ON "produce_listings" USING btree ("listing_status");--> statement-breakpoint
CREATE INDEX "idx_listing_farmer" ON "produce_listings" USING btree ("farmer_id");--> statement-breakpoint
CREATE INDEX "idx_notification_user" ON "system_notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_rating_ratee" ON "user_ratings" USING btree ("ratee_id");