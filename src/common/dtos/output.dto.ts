import { Field, ObjectType } from "@nestjs/graphql";
import { Order } from "src/orders/entities/order.entity";

@ObjectType()
export class CoreOutput {
    @Field(type=> String, {nullable: true})
    error?: string;

    @Field(type=> Boolean)
    ok: boolean;
    
}