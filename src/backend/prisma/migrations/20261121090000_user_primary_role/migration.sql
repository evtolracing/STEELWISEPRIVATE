-- Role matrix, phase 4: a custom role as a person's main role.
-- Adds one table and removes nothing. It can be run more than once.
-- A login with no row here keeps the built-in role named in "User"."role", exactly as before.
CREATE TABLE IF NOT EXISTS "UserPrimaryRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "setById" TEXT,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPrimaryRole_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "UserPrimaryRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserPrimaryRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "UserPrimaryRole_roleId_idx" ON "UserPrimaryRole" ("roleId");

-- The application's own role (update 17) reads and writes rows of this table like any other.
DO $user_primary_role_grant$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'steelwise_runtime') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "UserPrimaryRole" TO steelwise_runtime;
  END IF;
END
$user_primary_role_grant$;
