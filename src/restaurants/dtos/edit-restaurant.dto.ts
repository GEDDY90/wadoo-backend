import { InputType, PartialType, ObjectType, Field, Int } from "@nestjs/graphql";
import { CreateRestaurantInput } from "./create-restaurant.dto";
import { CoreOutput } from "../../common/dtos/output.dto";


@InputType()
export class EditRestaurantInput extends PartialType(CreateRestaurantInput){
    @Field(type=>Int)
    restaurantId: number
}

@ObjectType()
export class EditRestaurantOutput extends CoreOutput {}
