import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizerContactToZone1779722358103 implements MigrationInterface {
  name = 'AddOrganizerContactToZone1779722358103';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "session" DROP CONSTRAINT "FK_session_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "FK_account_user"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_damage_reports_zoneId"`);
    await queryRunner.query(`DROP INDEX "public"."session_userId_idx"`);
    await queryRunner.query(`DROP INDEX "public"."account_userId_idx"`);
    await queryRunner.query(
      `DROP INDEX "public"."verification_identifier_idx"`,
    );
    await queryRunner.query(
      `ALTER TABLE "zones" ADD "organizerContact" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "zones" DROP COLUMN "photos"`);
    await queryRunner.query(`ALTER TABLE "zones" ADD "photos" text`);
    await queryRunner.query(
      `CREATE INDEX "IDX_7940b0d64329511647f379873f" ON "damage_reports" ("zoneId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3d2f174ef04fb312fdebd0ddc5" ON "session" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_60328bf27019ff5498c4b97742" ON "account" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_896e5902333fa9991d1733e5ee" ON "verification" ("identifier") `,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "FK_60328bf27019ff5498c4b977421" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "FK_60328bf27019ff5498c4b977421"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" DROP CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_896e5902333fa9991d1733e5ee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_60328bf27019ff5498c4b97742"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3d2f174ef04fb312fdebd0ddc5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7940b0d64329511647f379873f"`,
    );
    await queryRunner.query(`ALTER TABLE "zones" DROP COLUMN "photos"`);
    await queryRunner.query(`ALTER TABLE "zones" ADD "photos" text array`);
    await queryRunner.query(
      `ALTER TABLE "zones" DROP COLUMN "organizerContact"`,
    );
    await queryRunner.query(
      `CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier") `,
    );
    await queryRunner.query(
      `CREATE INDEX "account_userId_idx" ON "account" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "session_userId_idx" ON "session" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_damage_reports_zoneId" ON "damage_reports" ("zoneId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "FK_account_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD CONSTRAINT "FK_session_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
