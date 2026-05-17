import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1779007912420 implements MigrationInterface {
  name = 'CreateAuthTables1779007912420';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "user" (
            "id" text NOT NULL,
            "name" text NOT NULL,
            "email" text NOT NULL,
            "emailVerified" boolean NOT NULL DEFAULT false,
            "image" text,
            "createdAt" timestamp NOT NULL,
            "updatedAt" timestamp NOT NULL,
            "role" text NOT NULL DEFAULT 'volunteer',
            CONSTRAINT "PK_user" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_user_email" UNIQUE ("email")
        )`);

    await queryRunner.query(`CREATE TABLE "session" (
            "id" text NOT NULL,
            "expiresAt" timestamp NOT NULL,
            "token" text NOT NULL,
            "createdAt" timestamp NOT NULL,
            "updatedAt" timestamp NOT NULL,
            "ipAddress" text,
            "userAgent" text,
            "userId" text NOT NULL,
            CONSTRAINT "PK_session" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_session_token" UNIQUE ("token"),
            CONSTRAINT "FK_session_user" FOREIGN KEY ("userId")
                REFERENCES "user"("id") ON DELETE CASCADE
        )`);

    await queryRunner.query(`CREATE TABLE "account" (
            "id" text NOT NULL,
            "accountId" text NOT NULL,
            "providerId" text NOT NULL,
            "userId" text NOT NULL,
            "accessToken" text,
            "refreshToken" text,
            "idToken" text,
            "accessTokenExpiresAt" timestamp,
            "refreshTokenExpiresAt" timestamp,
            "scope" text,
            "password" text,
            "createdAt" timestamp NOT NULL,
            "updatedAt" timestamp NOT NULL,
            CONSTRAINT "PK_account" PRIMARY KEY ("id"),
            CONSTRAINT "FK_account_user" FOREIGN KEY ("userId")
                REFERENCES "user"("id") ON DELETE CASCADE
        )`);

    await queryRunner.query(`CREATE TABLE "verification" (
            "id" text NOT NULL,
            "identifier" text NOT NULL,
            "value" text NOT NULL,
            "expiresAt" timestamp NOT NULL,
            "createdAt" timestamp NOT NULL,
            "updatedAt" timestamp NOT NULL,
            CONSTRAINT "PK_verification" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(
      `CREATE INDEX "session_userId_idx" ON "session" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "account_userId_idx" ON "account" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "verification_identifier_idx"`);
    await queryRunner.query(`DROP INDEX "account_userId_idx"`);
    await queryRunner.query(`DROP INDEX "session_userId_idx"`);
    await queryRunner.query(`DROP TABLE "verification"`);
    await queryRunner.query(`DROP TABLE "account"`);
    await queryRunner.query(`DROP TABLE "session"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
