ALTER TABLE "addresses" DROP CONSTRAINT "addresses_required_text";--> statement-breakpoint
ALTER TABLE "companies" DROP CONSTRAINT "companies_name_not_blank";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_sku_valid";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_required_text";--> statement-breakpoint
ALTER TABLE "supplier_verifications" DROP CONSTRAINT "verifications_review_recorded";--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM "companies"
		WHERE length(trim("name")) NOT BETWEEN 3 AND 120
	) THEN
		RAISE EXCEPTION 'Cannot migrate companies: name must contain 3-120 characters';
	END IF;
	IF EXISTS (
		SELECT 1 FROM "addresses"
		WHERE length(trim("label")) NOT BETWEEN 2 AND 40
			OR length(trim("recipient_name")) NOT BETWEEN 2 AND 100
			OR "phone" !~ '^[+]?[0-9]{8,15}$'
			OR length(trim("street")) NOT BETWEEN 10 AND 250
	) THEN
		RAISE EXCEPTION 'Cannot migrate addresses: legacy values violate FSD field limits';
	END IF;
	IF EXISTS (
		SELECT 1 FROM "products"
		WHERE "sku" !~ '^[A-Z0-9-]{1,64}$'
			OR length(trim("name")) NOT BETWEEN 5 AND 140
			OR length(trim("description")) NOT BETWEEN 1 AND 4000
			OR "unit" <> 'pcs'
	) THEN
		RAISE EXCEPTION 'Cannot migrate products: legacy values violate FSD field limits';
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "supplier_verifications" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "supplier_verifications" ALTER COLUMN "status" SET DATA TYPE text USING "status"::text;--> statement-breakpoint
UPDATE "supplier_verifications" SET "status" = CASE "status" WHEN 'pending' THEN 'pending_review' WHEN 'rejected' THEN 'changes_requested' ELSE "status" END;--> statement-breakpoint
UPDATE "supplier_verifications" SET "review_note" = 'Dimigrasikan dari status verifikasi lama.' WHERE "status" <> 'pending_review' AND ("review_note" IS NULL OR length(trim("review_note")) = 0);--> statement-breakpoint
DROP TYPE "public"."verification_status";--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending_review', 'approved', 'changes_requested');--> statement-breakpoint
ALTER TABLE "supplier_verifications" ALTER COLUMN "status" SET DATA TYPE "public"."verification_status" USING "status"::"public"."verification_status";--> statement-breakpoint
ALTER TABLE "supplier_verifications" ALTER COLUMN "status" SET DEFAULT 'pending_review'::"public"."verification_status";--> statement-breakpoint
DROP INDEX "addresses_one_default_per_company";--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "label" SET DATA TYPE varchar(40);--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "recipient_name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "phone" SET DATA TYPE varchar(16);--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "street" SET DATA TYPE varchar(250);--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "name" SET DATA TYPE varchar(120);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "name" SET DATA TYPE varchar(140);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "description" SET DATA TYPE varchar(4000);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "unit" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "unit" SET DEFAULT 'pcs';--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "responsible_person" varchar(100);--> statement-breakpoint
UPDATE "companies" SET "responsible_person" = left(trim("name"), 100);--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "responsible_person" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "description" varchar(1000);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "company_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "addresses_one_default_per_company" ON "addresses" USING btree ("company_id") WHERE "addresses"."is_default" AND "addresses"."archived_at" IS NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_phone_valid" CHECK ("addresses"."phone" ~ '^[+]?[0-9]{8,15}$');--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_required_text" CHECK (length(trim("addresses"."label")) >= 2 AND length(trim("addresses"."recipient_name")) >= 2 AND length(trim("addresses"."street")) >= 10 AND length(trim("addresses"."city")) > 0 AND length(trim("addresses"."province")) > 0);--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_name_valid" CHECK (length(trim("companies"."name")) >= 3);--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_responsible_person_valid" CHECK (length(trim("companies"."responsible_person")) >= 2);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sku_valid" CHECK ("products"."sku" ~ '^[A-Z0-9-]{1,64}$');--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_required_text" CHECK (length(trim("products"."name")) >= 5 AND length(trim("products"."description")) > 0 AND "products"."unit" = 'pcs');--> statement-breakpoint
ALTER TABLE "supplier_verifications" ADD CONSTRAINT "verifications_review_recorded" CHECK ("supplier_verifications"."status" = 'pending_review' OR ("supplier_verifications"."reviewed_by_user_id" IS NOT NULL AND "supplier_verifications"."reviewed_at" IS NOT NULL AND "supplier_verifications"."review_note" IS NOT NULL AND length(trim("supplier_verifications"."review_note")) > 0));
