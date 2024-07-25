import { Field, InputType, ObjectType, PartialType } from "@nestjs/graphql";
import { CoreOutput } from "../../common/dtos/output.dto";

@InputType()
export class DeleteRestaurantInput {
    @Field(type=>Number)
    restaurantId: number
}

@ObjectType()
export class DeleteRestaurantOutput extends CoreOutput {}