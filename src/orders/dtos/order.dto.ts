import { CoreOutput } from "src/common/dtos/output.dto";
import { Order } from "../entities/order.entity";
import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";

@InputType()
export class EditOrderInput extends Order{
    @Field(type=> Int)
    restaurantId: number;
}

@ObjectType()
export class EditOrderOutput extends CoreOutput {}