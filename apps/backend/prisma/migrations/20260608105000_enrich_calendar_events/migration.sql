CREATE TYPE "CalendarEventType" AS ENUM ('CARE', 'SCHOOL', 'HEALTH', 'ACTIVITY', 'PICKUP_DROPOFF', 'OTHER');

ALTER TABLE "CalendarEvent"
ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Evento familiar',
ADD COLUMN "type" "CalendarEventType" NOT NULL DEFAULT 'CARE',
ADD COLUMN "location" TEXT,
ADD COLUMN "notes" TEXT;
