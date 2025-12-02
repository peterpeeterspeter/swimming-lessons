-- CreateEnum
CREATE TYPE "public"."EnrollmentStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'COMPLETED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "public"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE');

-- CreateTable
CREATE TABLE "public"."Swimmer" (
    "id" TEXT NOT NULL,
    "parentId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "currentLevel" TEXT,
    "medicalNotes" TEXT,
    "emergencyContacts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Swimmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Enrollment" (
    "id" TEXT NOT NULL,
    "swimmerId" TEXT NOT NULL,
    "eventTypeId" INTEGER NOT NULL,
    "status" "public"."EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "bookingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttendanceRecord" (
    "id" TEXT NOT NULL,
    "swimmerId" TEXT NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "status" "public"."AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "markedById" INTEGER,
    "markedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProgressNote" (
    "id" TEXT NOT NULL,
    "swimmerId" TEXT NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "instructorId" INTEGER,
    "note" TEXT,
    "skills" JSONB,
    "visibleToParent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Swimmer_parentId_idx" ON "public"."Swimmer"("parentId");

-- CreateIndex
CREATE INDEX "Swimmer_teamId_idx" ON "public"."Swimmer"("teamId");

-- CreateIndex
CREATE INDEX "Enrollment_eventTypeId_idx" ON "public"."Enrollment"("eventTypeId");

-- CreateIndex
CREATE INDEX "Enrollment_bookingId_idx" ON "public"."Enrollment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_swimmerId_eventTypeId_key" ON "public"."Enrollment"("swimmerId", "eventTypeId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_bookingId_idx" ON "public"."AttendanceRecord"("bookingId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_markedById_idx" ON "public"."AttendanceRecord"("markedById");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_swimmerId_bookingId_key" ON "public"."AttendanceRecord"("swimmerId", "bookingId");

-- CreateIndex
CREATE INDEX "ProgressNote_bookingId_idx" ON "public"."ProgressNote"("bookingId");

-- CreateIndex
CREATE INDEX "ProgressNote_instructorId_idx" ON "public"."ProgressNote"("instructorId");

-- AddForeignKey
ALTER TABLE "public"."Swimmer" ADD CONSTRAINT "Swimmer_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Swimmer" ADD CONSTRAINT "Swimmer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_swimmerId_fkey" FOREIGN KEY ("swimmerId") REFERENCES "public"."Swimmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "public"."EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_swimmerId_fkey" FOREIGN KEY ("swimmerId") REFERENCES "public"."Swimmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgressNote" ADD CONSTRAINT "ProgressNote_swimmerId_fkey" FOREIGN KEY ("swimmerId") REFERENCES "public"."Swimmer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgressNote" ADD CONSTRAINT "ProgressNote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProgressNote" ADD CONSTRAINT "ProgressNote_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
