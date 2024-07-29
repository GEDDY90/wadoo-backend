import { InputType, PartialType, ObjectType, Field, Int } from "@nestjs/graphql";
import { CoreOutput } from "../../common/dtos/output.dto";
import { CreateDishInput } from "./create-dish.dto";



@InputType()
export class EditDishInput extends PartialType(
    CreateDishInput){
    @Field(type=>Int)
    dishId: number
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
