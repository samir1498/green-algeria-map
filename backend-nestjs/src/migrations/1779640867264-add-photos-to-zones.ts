import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhotosToZones1779640867264 implements MigrationInterface {
  name = 'AddPhotosToZones1779640867264';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "zones" ADD COLUMN "photos" text[]`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "zones" DROP COLUMN "photos"`);
  }
}
