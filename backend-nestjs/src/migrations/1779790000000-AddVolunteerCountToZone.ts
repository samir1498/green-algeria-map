import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVolunteerCountToZone1779790000000 implements MigrationInterface {
  name = 'AddVolunteerCountToZone1779790000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "zones" ADD "volunteerCount" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "zones" DROP COLUMN "volunteerCount"`);
  }
}
