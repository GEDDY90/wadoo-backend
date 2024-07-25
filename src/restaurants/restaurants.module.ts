import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantService } from './restaurants.service';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryResolver, DishResolver, RestaurantResolver } from './restaurants.resolver';
import { CategoryRepository } from './repository/category.repository';
import { Category } from './entities/category.entity';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/auth.guard';
import { Dish } from './entities/dish.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, Category, Dish]),
  ],
  providers: [
    RestaurantService,
    RestaurantResolver,
    CategoryRepository,
    CategoryResolver,
    DishResolver,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [RestaurantService], // Exporter le service si nécessaire
})
export class RestaurantsModule {}
