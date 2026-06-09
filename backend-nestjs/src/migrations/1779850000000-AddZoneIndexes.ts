import { MigrationInterface, QueryRunner } from "typeorm";

export class AddZoneIndexes1779850000000 implements MigrationInterface {
  name = "AddZoneIndexes1779850000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zones_name" ON "zones" ("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zones_type" ON "zones" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_zones_status" ON "zones" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_zones_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_zones_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_zones_status"`);
  }
}
