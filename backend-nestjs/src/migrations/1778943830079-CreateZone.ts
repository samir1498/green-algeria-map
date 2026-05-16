import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateZone1778943830079 implements MigrationInterface {
    name = 'CreateZone1778943830079'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "zones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" character varying NOT NULL, "status" character varying NOT NULL, "lat" double precision NOT NULL, "lng" double precision NOT NULL, "targetCount" integer, "currentCount" integer, "description" text NOT NULL, CONSTRAINT "PK_880484a43ca311707b05895bd4a" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "zones"`);
    }

}
