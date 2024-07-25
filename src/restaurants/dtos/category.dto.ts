import { ArgsType, Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "src/common/dtos/output.dto";
import { Category } from "../entities/category.entity";
import { PaginationInput } from "src/common/dtos/pagination.dto";
import { Restaurant } from "../entities/restaurant.entity";


@ArgsType()
export class CategoryInput extends PaginationInput{
    @Field(type=>String)
    slug: string;
}

@ObjectType()
export class CategoryOutput extends CoreOutput {
    @Field(type => [Category], { nullable: true })
    category?: Category[];

    @Field(type => [Restaurant], { nullable: true })
    restaurants?: Restaurant[];

    @Field(type=> Int, {nullable:true})
    totalPages?: number;
}