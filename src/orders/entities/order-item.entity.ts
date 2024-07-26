import { Field, InputType, Int, ObjectType } from "@nestjs/graphql";
import { CoreEntity } from "src/common/entities/core.entity";
import { Dish, DishChoice } from "src/restaurants/entities/dish.entity";
import { Column, Entity, ManyToOne } from "typeorm";


@InputType('OrderItemsOptionsInputType',{isAbstract:true})
@ObjectType()
export class OrderItemsOption {
    @Field(type=>String)
    name: string;
    
    @Field(type=> String, {nullable:true})
    choice?: string;
}

@InputType('OrderItemsInputType',{isAbstract:true})
@ObjectType()
@Entity()
export class OrderItems extends CoreEntity {
    @Field(type=>Dish)
    @ManyToOne(type=>Dish, {nullable:true, onDelete:'CASCADE'})
    dish: Dish;
    
    @Field(type=> [OrderItemsOption], {nullable:true})
    @Column({type: 'json', nullable:true})
    options?: OrderItemsOption[];
}
