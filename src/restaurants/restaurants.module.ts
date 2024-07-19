import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantService } from './restaurants.service';
import { Restaurant } from './entities/restaurant.entity';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repository/category.repository';
import { RestaurantResolver } from './restaurants.resolver';

@Module({
    imports: [
        TypeOrmModule.forFeature([Restaurant, Category]), // Assurez-vous que ces entités sont bien importées
    ],
    providers: [RestaurantService, RestaurantResolver, CategoryRepository],
})
export class RestaurantsModule {}
