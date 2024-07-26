import { CoreOutput } from "src/common/dtos/output.dto";
import { Field, InputType, Int, ObjectType, PickType } from "@nestjs/graphql";
import { OrderItemsOption } from "../entities/order-item.entity";


@InputType()
class CreateOrderItemsInput {
    @Field(type=> Int)
    dishId: number;

    @Field(type=> OrderItemsOption, {nullable:true})
    options?: OrderItemsOption[];
}


@InputType()
export class CreateOrderInput {
    @Field(type=> Int)
    restaurantId: number;

    @Field(type=> [CreateOrderItemsInput])
    items : CreateOrderItemsInput[];
}

@ObjectType()
export class CreateOrderOutput extends CoreOutput {}