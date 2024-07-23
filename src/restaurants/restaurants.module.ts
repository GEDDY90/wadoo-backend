import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantService } from './restaurants.service';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantResolver } from './restaurants.resolver';
import { CategoryRepository } from './repository/category.repository';
import { Category } from './entities/category.entity';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, Category]), // Inclure les entités ici
  ],
  providers: [
    RestaurantService,
    RestaurantResolver,
    CategoryRepository,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [RestaurantService], // Exporter le service si nécessaire
})
export class RestaurantsModule {}
