CREATE TYPE "public"."company_kind" AS ENUM('buyer', 'supplier');--> statement-breakpoint
CREATE TYPE "public"."company_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('buyer', 'supplier', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"label" varchar(80) NOT NULL,
	"recipient_name" varchar(120) NOT NULL,
	"phone" varchar(24) NOT NULL,
	"street" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"province" varchar(100) NOT NULL,
	"postal_code" varchar(5) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addresses_postal_code_valid" CHECK ("addresses"."postal_code" ~ '^[0-9]{5}$'),
	CONSTRAINT "addresses_required_text" CHECK (length(trim("addresses"."label")) > 0 AND length(trim("addresses"."recipient_name")) > 0 AND length(trim("addresses"."phone")) > 0 AND length(trim("addresses"."street")) > 0 AND length(trim("addresses"."city")) > 0 AND length(trim("addresses"."province")) > 0)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug"),
	CONSTRAINT "categories_name_not_blank" CHECK (length(trim("categories"."name")) > 0),
	CONSTRAINT "categories_slug_valid" CHECK ("categories"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"kind" "company_kind" NOT NULL,
	"status" "company_status" DEFAULT 'active' NOT NULL,
	"city" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_id_kind_unique" UNIQUE("id","kind"),
	CONSTRAINT "companies_name_not_blank" CHECK (length(trim("companies"."name")) > 0),
	CONSTRAINT "companies_city_not_blank" CHECK (length(trim("companies"."city")) > 0)
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"supplier_company_id" uuid NOT NULL,
	"on_hand" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_quantities_valid" CHECK ("inventory"."on_hand" >= 0 AND "inventory"."reserved" >= 0 AND "inventory"."reserved" <= "inventory"."on_hand")
);
--> statement-breakpoint
CREATE TABLE "product_price_tiers" (
	"product_id" uuid NOT NULL,
	"supplier_company_id" uuid NOT NULL,
	"minimum_quantity" integer NOT NULL,
	"unit_price_idr" integer NOT NULL,
	CONSTRAINT "product_price_tiers_product_id_minimum_quantity_pk" PRIMARY KEY("product_id","minimum_quantity"),
	CONSTRAINT "tiers_quantity_positive" CHECK ("product_price_tiers"."minimum_quantity" > 0),
	CONSTRAINT "tiers_price_positive" CHECK ("product_price_tiers"."unit_price_idr" > 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_company_id" uuid NOT NULL,
	"supplier_kind" "company_kind" DEFAULT 'supplier' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"creator_role" "user_role" DEFAULT 'supplier' NOT NULL,
	"category_id" uuid NOT NULL,
	"sku" varchar(64) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"unit" varchar(24) DEFAULT 'pcs' NOT NULL,
	"minimum_order_quantity" integer NOT NULL,
	"quantity_step" integer DEFAULT 1 NOT NULL,
	"base_price_idr" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR' NOT NULL,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"image_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_supplier_sku_unique" UNIQUE("supplier_company_id","sku"),
	CONSTRAINT "products_id_supplier_unique" UNIQUE("id","supplier_company_id"),
	CONSTRAINT "products_supplier_only" CHECK ("products"."supplier_kind" = 'supplier' AND "products"."creator_role" = 'supplier'),
	CONSTRAINT "products_sku_valid" CHECK ("products"."sku" ~ '^[A-Z0-9][A-Z0-9._-]{1,63}$'),
	CONSTRAINT "products_slug_valid" CHECK ("products"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "products_required_text" CHECK (length(trim("products"."name")) > 0 AND length(trim("products"."description")) > 0 AND length(trim("products"."unit")) > 0),
	CONSTRAINT "products_quantity_valid" CHECK ("products"."minimum_order_quantity" > 0 AND "products"."quantity_step" > 0 AND "products"."minimum_order_quantity" % "products"."quantity_step" = 0),
	CONSTRAINT "products_price_positive" CHECK ("products"."base_price_idr" > 0),
	CONSTRAINT "products_currency_idr" CHECK ("products"."currency" = 'IDR')
);
--> statement-breakpoint
CREATE TABLE "supplier_verifications" (
	"company_id" uuid PRIMARY KEY NOT NULL,
	"company_kind" "company_kind" DEFAULT 'supplier' NOT NULL,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"document_reference" text,
	"reviewed_by_user_id" uuid,
	"reviewer_role" "user_role" DEFAULT 'admin' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verifications_supplier_only" CHECK ("supplier_verifications"."company_kind" = 'supplier'),
	CONSTRAINT "verifications_admin_only" CHECK ("supplier_verifications"."reviewer_role" = 'admin'),
	CONSTRAINT "verifications_review_recorded" CHECK ("supplier_verifications"."status" = 'pending' OR ("supplier_verifications"."reviewed_by_user_id" IS NOT NULL AND "supplier_verifications"."reviewed_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"company_kind" "company_kind",
	"role" "user_role" NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_id_role_unique" UNIQUE("id","role"),
	CONSTRAINT "users_id_company_unique" UNIQUE("id","company_id"),
	CONSTRAINT "users_id_company_role_unique" UNIQUE("id","company_id","role"),
	CONSTRAINT "users_role_company_matches" CHECK (("users"."role" = 'admin' AND "users"."company_id" IS NULL AND "users"."company_kind" IS NULL)
        OR ("users"."role" = 'buyer' AND "users"."company_id" IS NOT NULL AND "users"."company_kind" IS NOT NULL AND "users"."company_kind" = 'buyer')
        OR ("users"."role" = 'supplier' AND "users"."company_id" IS NOT NULL AND "users"."company_kind" IS NOT NULL AND "users"."company_kind" = 'supplier')),
	CONSTRAINT "users_name_not_blank" CHECK (length(trim("users"."name")) > 0),
	CONSTRAINT "users_email_normalized" CHECK ("users"."email" = lower(trim("users"."email")) AND "users"."email" LIKE '%_@_%._%')
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_creator_company_fk" FOREIGN KEY ("created_by_user_id","company_id") REFERENCES "public"."users"("id","company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_supplier_fk" FOREIGN KEY ("product_id","supplier_company_id") REFERENCES "public"."products"("id","supplier_company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_tiers" ADD CONSTRAINT "tiers_product_supplier_fk" FOREIGN KEY ("product_id","supplier_company_id") REFERENCES "public"."products"("id","supplier_company_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_company_fk" FOREIGN KEY ("supplier_company_id","supplier_kind") REFERENCES "public"."companies"("id","kind") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_creator_company_role_fk" FOREIGN KEY ("created_by_user_id","supplier_company_id","creator_role") REFERENCES "public"."users"("id","company_id","role") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_verifications" ADD CONSTRAINT "verifications_supplier_company_fk" FOREIGN KEY ("company_id","company_kind") REFERENCES "public"."companies"("id","kind") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_verifications" ADD CONSTRAINT "verifications_admin_reviewer_fk" FOREIGN KEY ("reviewed_by_user_id","reviewer_role") REFERENCES "public"."users"("id","role") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_kind_fk" FOREIGN KEY ("company_id","company_kind") REFERENCES "public"."companies"("id","kind") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "addresses_one_default_per_company" ON "addresses" USING btree ("company_id") WHERE "addresses"."is_default";--> statement-breakpoint
CREATE INDEX "products_catalog_idx" ON "products" USING btree ("status","category_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));