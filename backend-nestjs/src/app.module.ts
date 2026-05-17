import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth';
import { ZonesModule } from './modules/zones/zones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'greenalgeria'),
        password: config.get('DB_PASSWORD', 'greenalgeria'),
        database: config.get('DB_NAME', 'greenalgeria'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    AuthModule.forRoot({ auth }),
    ZonesModule,
  ],
})
export class AppModule {}
