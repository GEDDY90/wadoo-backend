import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItems } from './entities/order-item.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, Restaurant, OrderItems, Dish])],
    providers: [
        OrdersResolver,
        OrdersService
    ]
})
export class OrdersModule {}
