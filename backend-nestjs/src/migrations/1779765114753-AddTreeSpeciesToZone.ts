import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTreeSpeciesToZone1779765114753 implements MigrationInterface {
  name = 'AddTreeSpeciesToZone1779765114753';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "zones" ADD "treeSpecies" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "zones" DROP COLUMN "treeSpecies"`);
  }
}
