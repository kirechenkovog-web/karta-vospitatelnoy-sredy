-- Add passwordHash column (nullable first to handle existing rows)
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- Remove existing users (no real data yet, fresh start)
DELETE FROM "AIMessage";
DELETE FROM "FocusPlan";
DELETE FROM "AspectDeepDive";
DELETE FROM "AspectScore";
DELETE FROM "AssessmentSession";
DELETE FROM "User";

-- Now make passwordHash NOT NULL
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

-- Drop name column
ALTER TABLE "User" DROP COLUMN "name";
