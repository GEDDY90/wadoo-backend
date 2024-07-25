import { ArgsType, Field, Int, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "src/common/dtos/output.dto";
import { Restaurant } from "../entities/restaurant.entity";


@ArgsType()
export class RestaurantInput{
    @Field(type => Int, {defaultValue:1})
    restaurantId: number;  

}

@ObjectType()
export class RestaurantOutput extends CoreOutput {
    @Field(type => [Restaurant], { nullable: true })
    restaurant?: Restaurant[];

}