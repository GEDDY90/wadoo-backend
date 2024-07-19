import { Field, InputType, ObjectType, PartialType, PickType } from "@nestjs/graphql";
import { CoreOutput } from "../../common/dtos/output.dto";
import { User } from "../entities/user.entity";

@ObjectType()
export class EditProfileOutput extends CoreOutput {}

@InputType()
export class EditProfileIntput extends PartialType(
    PickType(User, ["email", "password"]) ){}