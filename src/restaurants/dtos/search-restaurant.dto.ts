import { ArgsType, Field, Int, ObjectType } from "@nestjs/graphql";
import { Restaurant } from "../entities/restaurant.entity";
import { PaginationInput, PaginationOutput } from "../../common/dtos/pagination.dto";


@ArgsType()
export class SearchRestaurantInput extends PaginationInput{
    @Field(type => String)
    query : string;  

}

@ObjectType()
export class SearchRestaurantOutput extends PaginationOutput {
    @Field(type => [Restaurant], { nullable: true })
    restaurants?: Restaurant[];

    @Field(type=> Int, {nullable:true})
    totalResults?: number;
}