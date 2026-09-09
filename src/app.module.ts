import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryModule } from './cases/categories/category.modules';
import { ProductModule } from './cases/products/product.modules';
import { Spot } from './cases/spots/spot.entity';
import { SpotModule } from './cases/spots/spot.modules';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const databaseURL = configService.get<string>('DATABASE_URL');
        const dbSchema = configService.get<string>('DATABASE_SCHEMA');

        if (!databaseURL) {
          throw new Error(
            'A variável de ambiente DATABASE_URL não foi encontrada',
          );
        }

        return {
          type: 'postgres' as const,
          url: databaseURL,
          schema: dbSchema,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    CategoryModule,
    ProductModule,
    SpotModule,
  ],

})
export class AppModule {}
