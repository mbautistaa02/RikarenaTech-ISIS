BEGIN TRANSACTION;

-- ============================================================
-- MAIN TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "Crop" (
    "crop_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start_date" date NOT NULL,
    "harvest_date" date NOT NULL,
    "area" real NOT NULL,
    "crop_type" varchar(100) NOT NULL,
    "fertilizer_type" varchar(20) NOT NULL,
    "production_qty" real NOT NULL,
    "irrigation_method" varchar(20) NOT NULL,
    "notes" text NOT NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "product_id" bigint NOT NULL REFERENCES "Products" ("product_id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "Products" (
    "product_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" varchar(255) NOT NULL
);

-- ============================================================
-- ACCOUNT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "account_emailaddress" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "verified" bool NOT NULL,
    "primary" bool NOT NULL,
    "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "email" varchar(254) NOT NULL
);

CREATE TABLE IF NOT EXISTS "account_emailconfirmation" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created" datetime NOT NULL,
    "sent" datetime NULL,
    "key" varchar(64) NOT NULL UNIQUE,
    "email_address_id" integer NOT NULL REFERENCES "account_emailaddress" ("id") DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- ALERTS TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "alerts_alert" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "scope" varchar(20) NOT NULL,
    "alert_title" varchar(200) NOT NULL,
    "alert_message" text NOT NULL,
    "image" varchar(100) NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "created_by_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "department_id" bigint NULL REFERENCES "users_department" ("id") DEFERRABLE INITIALLY DEFERRED,
    "category_id" bigint NOT NULL REFERENCES "alerts_alertcategory" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "alerts_alertcategory" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category_name" varchar(100) NOT NULL UNIQUE,
    "description" text NULL,
    "created_at" datetime NOT NULL
);

CREATE TABLE IF NOT EXISTS "alerts_alertimage" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image" varchar(100) NOT NULL,
    "uploaded_at" datetime NOT NULL,
    "alert_id" bigint NOT NULL REFERENCES "alerts_alert" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "alerts_historicalalert" (
    "id" bigint NOT NULL,
    "scope" varchar(20) NOT NULL,
    "alert_title" varchar(200) NOT NULL,
    "alert_message" text NOT NULL,
    "image" varchar(100) NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "history_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "history_date" datetime NOT NULL,
    "history_change_reason" varchar(100) NULL,
    "history_type" varchar(1) NOT NULL,
    "category_id" bigint NULL,
    "created_by_id" integer NULL,
    "department_id" bigint NULL,
    "history_user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "alerts_historicalalertcategory" (
    "id" bigint NOT NULL,
    "category_name" varchar(100) NOT NULL,
    "description" text NULL,
    "created_at" datetime NOT NULL,
    "history_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "history_date" datetime NOT NULL,
    "history_change_reason" varchar(100) NULL,
    "history_type" varchar(1) NOT NULL,
    "history_user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "alerts_historicalalertimage" (
    "id" bigint NOT NULL,
    "image" varchar(100) NOT NULL,
    "uploaded_at" datetime NOT NULL,
    "history_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "history_date" datetime NOT NULL,
    "history_change_reason" varchar(100) NULL,
    "history_type" varchar(1) NOT NULL,
    "alert_id" bigint NULL,
    "history_user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- AUTH TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "auth_group" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" varchar(150) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "auth_group_permissions" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "group_id" integer NOT NULL REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED,
    "permission_id" integer NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "auth_permission" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content_type_id" integer NOT NULL REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED,
    "codename" varchar(100) NOT NULL,
    "name" varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS "auth_user" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "password" varchar(128) NOT NULL,
    "last_login" datetime NULL,
    "is_superuser" bool NOT NULL,
    "username" varchar(150) NOT NULL UNIQUE,
    "last_name" varchar(150) NOT NULL,
    "email" varchar(254) NOT NULL,
    "is_staff" bool NOT NULL,
    "is_active" bool NOT NULL,
    "date_joined" datetime NOT NULL,
    "first_name" varchar(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS "auth_user_groups" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "group_id" integer NOT NULL REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "auth_user_user_permissions" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "permission_id" integer NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- CROPS HISTORICAL TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "crops_historicalcrop" (
    "crop_id" bigint NOT NULL,
    "start_date" date NOT NULL,
    "harvest_date" date NOT NULL,
    "area" real NOT NULL,
    "crop_type" varchar(100) NOT NULL,
    "fertilizer_type" varchar(20) NOT NULL,
    "production_qty" real NOT NULL,
    "irrigation_method" varchar(20) NOT NULL,
    "notes" text NOT NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "history_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "history_date" datetime NOT NULL,
    "history_change_reason" varchar(100) NULL,
    "history_type" varchar(1) NOT NULL,
    "history_user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "user_id" integer NULL,
    "product_id" bigint NULL
);

CREATE TABLE IF NOT EXISTS "crops_historicalproduct" (
    "product_id" bigint NOT NULL,
    "name" varchar(255) NOT NULL,
    "history_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "history_date" datetime NOT NULL,
    "history_change_reason" varchar(100) NULL,
    "history_type" varchar(1) NOT NULL,
    "history_user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- DJANGO TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "django_admin_log" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "object_id" text NULL,
    "object_repr" varchar(200) NOT NULL,
    "action_flag" smallint unsigned NOT NULL CHECK ("action_flag" >= 0),
    "change_message" text NOT NULL,
    "content_type_id" integer NULL REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED,
    "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "action_time" datetime NOT NULL
);

CREATE TABLE IF NOT EXISTS "django_content_type" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "app_label" varchar(100) NOT NULL,
    "model" varchar(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS "django_migrations" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "app" varchar(255) NOT NULL,
    "name" varchar(255) NOT NULL,
    "applied" datetime NOT NULL
);

CREATE TABLE IF NOT EXISTS "django_session" (
    "session_key" varchar(40) NOT NULL PRIMARY KEY,
    "session_data" text NOT NULL,
    "expire_date" datetime NOT NULL
);

CREATE TABLE IF NOT EXISTS "django_site" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" varchar(50) NOT NULL,
    "domain" varchar(100) NOT NULL UNIQUE
);

-- ============================================================
-- POSTS TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "posts_category" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" varchar(100) NOT NULL UNIQUE,
    "description" text NOT NULL,
    "slug" varchar(50) NOT NULL UNIQUE,
    "is_active" bool NOT NULL,
    "created_at" datetime NOT NULL,
    "parent_id" bigint NULL REFERENCES "posts_category" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "posts_historicalcategory" (
    "id" bigint NOT NULL,
    "name" varchar(100) NOT NULL,
    "description" text NOT NULL,
    "slug" varchar(50) NOT NULL,
    "is_active" bool NOT NULL,
    "created_at" datetime NOT NULL,
    "history_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "history_date" datetime NOT NULL,
    "history_change_reason" varchar(100) NULL,
    "history_type" varchar(1) NOT NULL,
    "history_user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "parent_id" bigint NULL
);

CREATE TABLE IF NOT EXISTS "posts_historicalpost" (
    "id" bigint NOT NULL,
    "title" varchar(200) NOT NULL,
    "content" text NOT NULL,
    "slug" varchar(50) NOT NULL,
    "status" varchar(20) NOT NULL,
    "visibility" varchar(10) NOT NULL,
    "price" decimal NOT NULL,
    "quantity" decimal NOT NULL,
    "unit_of_measure" varchar(50) NOT NULL,
    "is_featured" bool NOT NULL,
    "view_count" integer unsigned NOT NULL CHECK ("view_count" >= 0),
    "expires_at" datetime NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "published_at" datetime NULL,
    "reviewed_at" datetime NULL,
    "review_notes" text NOT NULL,
    "history_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "history_date" datetime NOT NULL,
    "history_change_reason" varchar(100) NULL,
    "history_type" varchar(1) NOT NULL,
    "category_id" bigint NULL,
    "history_user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "municipality_id" bigint NULL,
    "reviewed_by_id" integer NULL,
    "user_id" integer NULL
);

CREATE TABLE IF NOT EXISTS "posts_historicalpostimage" (
    "id" bigint NOT NULL,
    "image" varchar(100) NOT NULL,
    "alt_text" varchar(200) NOT NULL,
    "caption" varchar(300) NOT NULL,
    "order" integer unsigned NOT NULL CHECK ("order" >= 0),
    "created_at" datetime NOT NULL,
    "history_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "history_date" datetime NOT NULL,
    "history_change_reason" varchar(100) NULL,
    "history_type" varchar(1) NOT NULL,
    "history_user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "post_id" bigint NULL
);

CREATE TABLE IF NOT EXISTS "posts_post" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" varchar(200) NOT NULL,
    "content" text NOT NULL,
    "slug" varchar(50) NOT NULL UNIQUE,
    "status" varchar(20) NOT NULL,
    "visibility" varchar(10) NOT NULL,
    "price" decimal NOT NULL,
    "quantity" decimal NOT NULL,
    "unit_of_measure" varchar(50) NOT NULL,
    "is_featured" bool NOT NULL,
    "view_count" integer unsigned NOT NULL CHECK ("view_count" >= 0),
    "expires_at" datetime NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "published_at" datetime NULL,
    "reviewed_at" datetime NULL,
    "review_notes" text NOT NULL,
    "category_id" bigint NULL REFERENCES "posts_category" ("id") DEFERRABLE INITIALLY DEFERRED,
    "municipality_id" bigint NULL REFERENCES "users_municipality" ("id") DEFERRABLE INITIALLY DEFERRED,
    "reviewed_by_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "posts_postimage" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "image" varchar(100) NOT NULL,
    "alt_text" varchar(200) NOT NULL,
    "caption" varchar(300) NOT NULL,
    "order" integer unsigned NOT NULL CHECK ("order" >= 0),
    "created_at" datetime NOT NULL,
    "post_id" bigint NOT NULL REFERENCES "posts_post" ("id") DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- SOCIAL ACCOUNT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "socialaccount_socialaccount" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "provider" varchar(200) NOT NULL,
    "uid" varchar(191) NOT NULL,
    "last_login" datetime NOT NULL,
    "date_joined" datetime NOT NULL,
    "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "extra_data" text NOT NULL CHECK ((JSON_VALID("extra_data") OR "extra_data" IS NULL))
);

CREATE TABLE IF NOT EXISTS "socialaccount_socialapp" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "provider" varchar(30) NOT NULL,
    "name" varchar(40) NOT NULL,
    "client_id" varchar(191) NOT NULL,
    "secret" varchar(191) NOT NULL,
    "key" varchar(191) NOT NULL,
    "provider_id" varchar(200) NOT NULL,
    "settings" text NOT NULL CHECK ((JSON_VALID("settings") OR "settings" IS NULL))
);

CREATE TABLE IF NOT EXISTS "socialaccount_socialapp_sites" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "socialapp_id" integer NOT NULL REFERENCES "socialaccount_socialapp" ("id") DEFERRABLE INITIALLY DEFERRED,
    "site_id" integer NOT NULL REFERENCES "django_site" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "socialaccount_socialtoken" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" text NOT NULL,
    "token_secret" text NOT NULL,
    "expires_at" datetime NULL,
    "account_id" integer NOT NULL REFERENCES "socialaccount_socialaccount" ("id") DEFERRABLE INITIALLY DEFERRED,
    "app_id" integer NULL REFERENCES "socialaccount_socialapp" ("id") DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- USERS TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "users_department" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" varchar(100) NOT NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL
);

CREATE TABLE IF NOT EXISTS "users_historicaldepartment" (
    "id" bigint NOT NULL,
    "name" varchar(100) NOT NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "history_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "history_date" datetime NOT NULL,
    "history_change_reason" varchar(100) NULL,
    "history_type" varchar(1) NOT NULL,
    "history_user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "users_historicalmunicipality" (
    "id" bigint NOT NULL,
    "name" varchar(100) NOT NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "history_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "history_date" datetime NOT NULL,
    "history_change_reason" varchar(100) NULL,
    "history_type" varchar(1) NOT NULL,
    "department_id" bigint NULL,
    "history_user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "users_historicalprofile" (
    "id" bigint NOT NULL,
    "cellphone_number" bigint NULL,
    "registration_date" datetime NOT NULL,
    "picture_url" varchar(200) NULL,
    "bio" text NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "history_id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "history_date" datetime NOT NULL,
    "history_change_reason" varchar(100) NULL,
    "history_type" varchar(1) NOT NULL,
    "history_user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
    "user_id" integer NULL,
    "municipality_id" bigint NULL
);

CREATE TABLE IF NOT EXISTS "users_municipality" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" varchar(100) NOT NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "department_id" bigint NOT NULL REFERENCES "users_department" ("id") DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "users_profile" (
    "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cellphone_number" bigint NULL UNIQUE,
    "registration_date" datetime NOT NULL,
    "picture_url" varchar(200) NULL,
    "bio" text NULL,
    "created_at" datetime NOT NULL,
    "updated_at" datetime NOT NULL,
    "municipality_id" bigint NULL REFERENCES "users_municipality" ("id") DEFERRABLE INITIALLY DEFERRED,
    "user_id" integer NOT NULL UNIQUE REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================
-- INDEXES - CROP
-- ============================================================

CREATE INDEX "Crop_harvest_eaa49a_idx" ON "Crop" ("harvest_date");
CREATE INDEX "Crop_product_77f3af_idx" ON "Crop" ("product_id");
CREATE INDEX "Crop_product_id_db737dfc" ON "Crop" ("product_id");
CREATE INDEX "Crop_start_d_3780b9_idx" ON "Crop" ("start_date");
CREATE INDEX "Crop_user_id_f254df_idx" ON "Crop" ("user_id");
CREATE INDEX "Crop_user_id_f483b0aa" ON "Crop" ("user_id");

-- ============================================================
-- INDEXES - ACCOUNT
-- ============================================================

CREATE INDEX "account_emailaddress_email_03be32b2" ON "account_emailaddress" ("email");
CREATE INDEX "account_emailaddress_user_id_2c513194" ON "account_emailaddress" ("user_id");
CREATE UNIQUE INDEX "account_emailaddress_user_id_email_987c8728_uniq" ON "account_emailaddress" ("user_id", "email");
CREATE INDEX "account_emailconfirmation_email_address_id_5b7f8c58" ON "account_emailconfirmation" ("email_address_id");

-- ============================================================
-- INDEXES - ALERTS
-- ============================================================

CREATE INDEX "alerts_aler_created_574618_idx" ON "alerts_alert" ("created_at" DESC);
CREATE INDEX "alerts_alert_category_id_760517cf" ON "alerts_alert" ("category_id");
CREATE INDEX "alerts_alert_created_by_id_520608c0" ON "alerts_alert" ("created_by_id");
CREATE INDEX "alerts_alert_department_id_f94c681a" ON "alerts_alert" ("department_id");
CREATE INDEX "alerts_alertimage_alert_id_d16a4374" ON "alerts_alertimage" ("alert_id");
CREATE INDEX "alerts_historicalalert_category_id_01bd7108" ON "alerts_historicalalert" ("category_id");
CREATE INDEX "alerts_historicalalert_created_by_id_8e6240d7" ON "alerts_historicalalert" ("created_by_id");
CREATE INDEX "alerts_historicalalert_department_id_f664fcf9" ON "alerts_historicalalert" ("department_id");
CREATE INDEX "alerts_historicalalert_history_date_747cbd27" ON "alerts_historicalalert" ("history_date");
CREATE INDEX "alerts_historicalalert_history_user_id_53580bb3" ON "alerts_historicalalert" ("history_user_id");
CREATE INDEX "alerts_historicalalert_id_2b3461fd" ON "alerts_historicalalert" ("id");
CREATE INDEX "alerts_historicalalertcategory_category_name_a973d6b8" ON "alerts_historicalalertcategory" ("category_name");
CREATE INDEX "alerts_historicalalertcategory_history_date_0cf8f764" ON "alerts_historicalalertcategory" ("history_date");
CREATE INDEX "alerts_historicalalertcategory_history_user_id_dea9c7f7" ON "alerts_historicalalertcategory" ("history_user_id");
CREATE INDEX "alerts_historicalalertcategory_id_0b402b27" ON "alerts_historicalalertcategory" ("id");
CREATE INDEX "alerts_historicalalertimage_alert_id_ed2f0e7b" ON "alerts_historicalalertimage" ("alert_id");
CREATE INDEX "alerts_historicalalertimage_history_date_db5a8bd1" ON "alerts_historicalalertimage" ("history_date");
CREATE INDEX "alerts_historicalalertimage_history_user_id_5f882748" ON "alerts_historicalalertimage" ("history_user_id");
CREATE INDEX "alerts_historicalalertimage_id_ccba41d5" ON "alerts_historicalalertimage" ("id");

-- ============================================================
-- INDEXES - AUTH
-- ============================================================

CREATE INDEX "auth_group_permissions_group_id_b120cbf9" ON "auth_group_permissions" ("group_id");
CREATE UNIQUE INDEX "auth_group_permissions_group_id_permission_id_0cd325b0_uniq" ON "auth_group_permissions" ("group_id", "permission_id");
CREATE INDEX "auth_group_permissions_permission_id_84c5c92e" ON "auth_group_permissions" ("permission_id");
CREATE INDEX "auth_permission_content_type_id_2f476e4b" ON "auth_permission" ("content_type_id");
CREATE UNIQUE INDEX "auth_permission_content_type_id_codename_01ab375a_uniq" ON "auth_permission" ("content_type_id", "codename");
CREATE INDEX "auth_user_groups_group_id_97559544" ON "auth_user_groups" ("group_id");
CREATE INDEX "auth_user_groups_user_id_6a12ed8b" ON "auth_user_groups" ("user_id");
CREATE UNIQUE INDEX "auth_user_groups_user_id_group_id_94350c0c_uniq" ON "auth_user_groups" ("user_id", "group_id");
CREATE INDEX "auth_user_user_permissions_permission_id_1fbb5f2c" ON "auth_user_user_permissions" ("permission_id");
CREATE INDEX "auth_user_user_permissions_user_id_a95ead1b" ON "auth_user_user_permissions" ("user_id");
CREATE UNIQUE INDEX "auth_user_user_permissions_user_id_permission_id_14a6b632_uniq" ON "auth_user_user_permissions" ("user_id", "permission_id");

-- ============================================================
-- INDEXES - CROPS HISTORICAL
-- ============================================================

CREATE INDEX "crops_historicalcrop_crop_id_c1e7484c" ON "crops_historicalcrop" ("crop_id");
CREATE INDEX "crops_historicalcrop_history_date_7da5ceae" ON "crops_historicalcrop" ("history_date");
CREATE INDEX "crops_historicalcrop_history_user_id_fe2720c9" ON "crops_historicalcrop" ("history_user_id");
CREATE INDEX "crops_historicalcrop_product_id_45e699e8" ON "crops_historicalcrop" ("product_id");
CREATE INDEX "crops_historicalcrop_user_id_54c49be9" ON "crops_historicalcrop" ("user_id");
CREATE INDEX "crops_historicalproduct_history_date_3322f871" ON "crops_historicalproduct" ("history_date");
CREATE INDEX "crops_historicalproduct_history_user_id_1929c6c1" ON "crops_historicalproduct" ("history_user_id");
CREATE INDEX "crops_historicalproduct_product_id_66366163" ON "crops_historicalproduct" ("product_id");

-- ============================================================
-- INDEXES - DJANGO
-- ============================================================

CREATE INDEX "django_admin_log_content_type_id_c4bce8eb" ON "django_admin_log" ("content_type_id");
CREATE INDEX "django_admin_log_user_id_c564eba6" ON "django_admin_log" ("user_id");
CREATE UNIQUE INDEX "django_content_type_app_label_model_76bd3d3b_uniq" ON "django_content_type" ("app_label", "model");
CREATE INDEX "django_session_expire_date_a5c62663" ON "django_session" ("expire_date");

-- ============================================================
-- INDEXES - POSTS
-- ============================================================

CREATE INDEX "posts_category_parent_id_b37ece90" ON "posts_category" ("parent_id");
CREATE INDEX "posts_historicalcategory_history_date_2a24a791" ON "posts_historicalcategory" ("history_date");
CREATE INDEX "posts_historicalcategory_history_user_id_e1e050f6" ON "posts_historicalcategory" ("history_user_id");
CREATE INDEX "posts_historicalcategory_id_76cd7912" ON "posts_historicalcategory" ("id");
CREATE INDEX "posts_historicalcategory_name_81e11e48" ON "posts_historicalcategory" ("name");
CREATE INDEX "posts_historicalcategory_parent_id_20974ef0" ON "posts_historicalcategory" ("parent_id");
CREATE INDEX "posts_historicalcategory_slug_f6dfd181" ON "posts_historicalcategory" ("slug");
CREATE INDEX "posts_historicalpost_category_id_a8040cce" ON "posts_historicalpost" ("category_id");
CREATE INDEX "posts_historicalpost_history_date_cd3cd0cc" ON "posts_historicalpost" ("history_date");
CREATE INDEX "posts_historicalpost_history_user_id_83ce1a2c" ON "posts_historicalpost" ("history_user_id");
CREATE INDEX "posts_historicalpost_id_0c5a0d46" ON "posts_historicalpost" ("id");
CREATE INDEX "posts_historicalpost_municipality_id_33f2b0ef" ON "posts_historicalpost" ("municipality_id");
CREATE INDEX "posts_historicalpost_reviewed_by_id_404353cb" ON "posts_historicalpost" ("reviewed_by_id");
CREATE INDEX "posts_historicalpost_slug_fd11a5f8" ON "posts_historicalpost" ("slug");
CREATE INDEX "posts_historicalpost_user_id_76944c00" ON "posts_historicalpost" ("user_id");
CREATE INDEX "posts_historicalpostimage_history_date_cf308bea" ON "posts_historicalpostimage" ("history_date");
CREATE INDEX "posts_historicalpostimage_history_user_id_ff4c858c" ON "posts_historicalpostimage" ("history_user_id");
CREATE INDEX "posts_historicalpostimage_id_0fb4047f" ON "posts_historicalpostimage" ("id");
CREATE INDEX "posts_historicalpostimage_post_id_dc7979ed" ON "posts_historicalpostimage" ("post_id");
CREATE INDEX "posts_post_categor_b4269f_idx" ON "posts_post" ("category_id", "status");
CREATE INDEX "posts_post_category_id_ab339803" ON "posts_post" ("category_id");
CREATE INDEX "posts_post_created_183a3b_idx" ON "posts_post" ("created_at" DESC);
CREATE INDEX "posts_post_municipality_id_7bef727e" ON "posts_post" ("municipality_id");
CREATE INDEX "posts_post_reviewed_by_id_c8c94119" ON "posts_post" ("reviewed_by_id");
CREATE INDEX "posts_post_status_18b052_idx" ON "posts_post" ("status", "visibility");
CREATE INDEX "posts_post_user_id_a4f40dc7" ON "posts_post" ("user_id");
CREATE INDEX "posts_post_user_status_idx" ON "posts_post" ("user_id", "status");
CREATE INDEX "posts_postimage_post_id_a2f20392" ON "posts_postimage" ("post_id");
CREATE UNIQUE INDEX "posts_postimage_post_id_order_fc256251_uniq" ON "posts_postimage" ("post_id", "order");

-- ============================================================
-- INDEXES - SOCIAL ACCOUNT
-- ============================================================

CREATE UNIQUE INDEX "socialaccount_socialaccount_provider_uid_fc810c6e_uniq" ON "socialaccount_socialaccount" ("provider", "uid");
CREATE INDEX "socialaccount_socialaccount_user_id_8146e70c" ON "socialaccount_socialaccount" ("user_id");
CREATE INDEX "socialaccount_socialapp_sites_site_id_2579dee5" ON "socialaccount_socialapp_sites" ("site_id");
CREATE INDEX "socialaccount_socialapp_sites_socialapp_id_97fb6e7d" ON "socialaccount_socialapp_sites" ("socialapp_id");
CREATE UNIQUE INDEX "socialaccount_socialapp_sites_socialapp_id_site_id_71a9a768_uniq" ON "socialaccount_socialapp_sites" ("socialapp_id", "site_id");
CREATE INDEX "socialaccount_socialtoken_account_id_951f210e" ON "socialaccount_socialtoken" ("account_id");
CREATE INDEX "socialaccount_socialtoken_app_id_636a42d7" ON "socialaccount_socialtoken" ("app_id");
CREATE UNIQUE INDEX "socialaccount_socialtoken_app_id_account_id_fca4e0ac_uniq" ON "socialaccount_socialtoken" ("app_id", "account_id");

-- ============================================================
-- INDEXES - UNIQUE CONSTRAINTS
-- ============================================================

CREATE UNIQUE INDEX "unique_primary_email" ON "account_emailaddress" ("user_id", "primary") WHERE "primary";
CREATE UNIQUE INDEX "unique_verified_email" ON "account_emailaddress" ("email") WHERE "verified";

-- ============================================================
-- INDEXES - USERS
-- ============================================================

CREATE INDEX "users_historicaldepartment_history_date_98db4b05" ON "users_historicaldepartment" ("history_date");
CREATE INDEX "users_historicaldepartment_history_user_id_5efe9a9c" ON "users_historicaldepartment" ("history_user_id");
CREATE INDEX "users_historicaldepartment_id_067fcc37" ON "users_historicaldepartment" ("id");
CREATE INDEX "users_historicalmunicipality_department_id_6dd90423" ON "users_historicalmunicipality" ("department_id");
CREATE INDEX "users_historicalmunicipality_history_date_d3ac03c8" ON "users_historicalmunicipality" ("history_date");
CREATE INDEX "users_historicalmunicipality_history_user_id_8c181725" ON "users_historicalmunicipality" ("history_user_id");
CREATE INDEX "users_historicalmunicipality_id_fbe4ec10" ON "users_historicalmunicipality" ("id");
CREATE INDEX "users_historicalprofile_cellphone_number_88095800" ON "users_historicalprofile" ("cellphone_number");
CREATE INDEX "users_historicalprofile_history_date_d7a82f49" ON "users_historicalprofile" ("history_date");
CREATE INDEX "users_historicalprofile_history_user_id_26bae392" ON "users_historicalprofile" ("history_user_id");
CREATE INDEX "users_historicalprofile_id_6cc2824a" ON "users_historicalprofile" ("id");
CREATE INDEX "users_historicalprofile_municipality_id_0f518c40" ON "users_historicalprofile" ("municipality_id");
CREATE INDEX "users_historicalprofile_user_id_abe6e551" ON "users_historicalprofile" ("user_id");
CREATE INDEX "users_municipality_department_id_312ee720" ON "users_municipality" ("department_id");
CREATE INDEX "users_profile_municipality_id_472cccb7" ON "users_profile" ("municipality_id");

COMMIT;
