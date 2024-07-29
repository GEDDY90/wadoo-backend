import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantService } from './restaurants.service';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryResolver, DishResolver, RestaurantResolver } from './restaurants.resolver';
import { CategoryRepository } from './repository/category.repository';
import { Category } from './entities/category.entity';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '../auth/auth.guard';
import { Dish } from './entities/dish.entity';
import { UsersModule } from 'src/users/users.module';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant, 
      Category, 
      Dish,
      CategoryRepository,
    ]),
    UsersModule,
  ],
  providers: [
    RestaurantService,
    RestaurantResolver,
    CategoryResolver,
    DishResolver,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [
    RestaurantService
  ],
})
export class RestaurantsModule {}
