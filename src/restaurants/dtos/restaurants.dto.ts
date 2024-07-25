import { ArgsType, Field, Int, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "src/common/dtos/output.dto";
import { PaginationInput } from "src/common/dtos/pagination.dto";
import { Restaurant } from "../entities/restaurant.entity";
import { Category } from "../entities/category.entity";


@ArgsType()
export class RestaurantsInput extends PaginationInput{
    @Field(type => Int, {defaultValue:1})
    page: number;  

}

@ObjectType()
export class RestaurantsOutput extends CoreOutput {

    @Field(type => [Category], { nullable: true })
    category?: Category[];

    @Field(type => [Restaurant], { nullable: true })
    results?: Restaurant[];

    @Field(type=> Int, {nullable:true})
    totalPages?: number;

    @Field(type=> Int, {nullable:true})
    totalResults?: number;

    
}