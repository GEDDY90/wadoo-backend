import { ArgsType, Field, Int, ObjectType } from "@nestjs/graphql";
import { CoreOutput } from "../../common/dtos/output.dto";
import { User } from "../entities/user.entity";


@ArgsType()
export class UserProfileInput {
    @Field(type=>Int)
    userId: number;
}

@ObjectType()
export class UserProfileOutput extends CoreOutput{
    @Field(type =>User, {nullable:true})
    user?: User;
}