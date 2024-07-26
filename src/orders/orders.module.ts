import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';
import { Dish } from 'src/restaurants/entities/dish.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, Dish])],
    providers: [
        OrdersResolver,
        OrdersService
    ]
})
export class OrdersModule {}
