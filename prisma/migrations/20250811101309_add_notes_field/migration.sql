-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('REGULAR', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('CREDENTIALS', 'GOOGLE');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('VERIFICATION', 'TWO_FACTOR', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED');

-- CreateEnum
CREATE TYPE "MediaSource" AS ENUM ('TMDB', 'GOOGLE_BOOKS', 'MAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ModerationType" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MEDIA_REQUEST_NEW', 'MEDIA_REQUEST_UPDATED', 'MEDIA_REQUEST_APPROVED', 'MEDIA_REQUEST_REJECTED', 'SYSTEM_MESSAGE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "picture" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'REGULAR',
    "method" "AuthMethod" NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "expires_in" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "source" "MediaSource" NOT NULL DEFAULT 'CUSTOM',
    "externalId" TEXT,
    "mediaData" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "searchable_title" TEXT NOT NULL,
    "externalIds" JSONB,
    "category_id" TEXT NOT NULL,
    "added_by_id" TEXT,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_library" (
    "id" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PLANNED',
    "rating" SMALLINT,
    "notes" VARCHAR(500),
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,

    CONSTRAINT "user_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "media_request_id" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_requests" (
    "id" TEXT NOT NULL,
    "status" "ModerationType" NOT NULL DEFAULT 'PENDING',
    "mediaData" JSONB NOT NULL,
    "searchable_title" TEXT NOT NULL,
    "externalIds" JSONB,
    "comment" TEXT,
    "moderatorNote" TEXT,
    "duplicate_check_status" TEXT,
    "possible_duplicates" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "moderated_by_id" TEXT,
    "approved_media_id" TEXT,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "media_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "media_searchable_title_idx" ON "media"("searchable_title");

-- CreateIndex
CREATE INDEX "user_library_user_id_status_idx" ON "user_library"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_library_media_id_idx" ON "user_library"("media_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_library_user_id_media_id_key" ON "user_library"("user_id", "media_id");

-- CreateIndex
CREATE INDEX "reviews_media_id_idx" ON "reviews"("media_id");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_media_id_key" ON "reviews"("user_id", "media_id");

-- CreateIndex
CREATE INDEX "media_requests_searchable_title_idx" ON "media_requests"("searchable_title");

-- CreateIndex
CREATE INDEX "media_requests_status_idx" ON "media_requests"("status");

-- CreateIndex
CREATE INDEX "media_requests_requested_by_id_idx" ON "media_requests"("requested_by_id");

-- CreateIndex
CREATE INDEX "media_requests_created_at_idx" ON "media_requests"("created_at");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_library" ADD CONSTRAINT "user_library_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_library" ADD CONSTRAINT "user_library_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_media_request_id_fkey" FOREIGN KEY ("media_request_id") REFERENCES "media_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_requests" ADD CONSTRAINT "media_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_requests" ADD CONSTRAINT "media_requests_moderated_by_id_fkey" FOREIGN KEY ("moderated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_requests" ADD CONSTRAINT "media_requests_approved_media_id_fkey" FOREIGN KEY ("approved_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_requests" ADD CONSTRAINT "media_requests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
