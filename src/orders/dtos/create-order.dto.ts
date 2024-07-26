import { CoreOutput } from "src/common/dtos/output.dto";
import { Order } from "../entities/order.entity";
import { Field, InputType, Int, ObjectType, PickType } from "@nestjs/graphql";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";

@InputType()
export class CreateOrderInput extends PickType(Order, ['items']){
    @Field(type=> Int)
    restaurantId: number;
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}