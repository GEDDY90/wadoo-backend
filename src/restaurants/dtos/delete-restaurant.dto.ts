import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "../../common/dtos/output.dto";

@InputType()
export class DeleteRestaurantInput {
    @Field(type=>Int)
    restaurantId: number
}

@ObjectType()
export class DeleteRestaurantOutput extends CoreOutput {}