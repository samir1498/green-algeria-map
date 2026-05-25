import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizerContactToZone1779800000000
  implements MigrationInterface
{
  name = 'AddOrganizerContactToZone1779800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "zones" ADD "organizerContact" character varying`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "zones" DROP COLUMN "organizerContact"`,
    );
  }
}
