import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateDamageReport1779203377543 implements MigrationInterface {
  name = 'CreateDamageReport1779203377543'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "damage_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "zoneId" character varying NOT NULL, "type" character varying NOT NULL, "severity" character varying NOT NULL, "status" character varying NOT NULL, "lat" double precision NOT NULL, "lng" double precision NOT NULL, "description" text NOT NULL, "reportedBy" character varying NOT NULL, "reportedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_damage_reports" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_damage_reports_zoneId" ON "damage_reports" ("zoneId")`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_damage_reports_zoneId"`)
    await queryRunner.query(`DROP TABLE "damage_reports"`)
  }
}