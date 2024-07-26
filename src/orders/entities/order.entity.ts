import { Field, Float, InputType, ObjectType, registerEnumType } from "@nestjs/graphql";
import { IsEnum, IsNumber, } from "class-validator";
import { CoreEntity } from "../../common/entities/core.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, RelationId } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { OrderItems } from "./order-item.entity";

export enum OrderStatus {
    Pending = 'Pending',
    Cooking = 'Cooking',
    PickedUp = 'PickedUp',
    Delivered = 'Delivered'
}

registerEnumType(OrderStatus, {name: "OrderStatus"})

@InputType('OrderInputType',{isAbstract:true})
@ObjectType()
@Entity()
export class Order extends CoreEntity {

    @Field(type=>User)
    @Field(type=> User, {nullable: true})
    @ManyToOne(
        type=> User,
        user => user.order,
        {onDelete: "SET NULL", nullable: true},
    ) 
    customer?: User;

    @Field(type=>User, {nullable: true})
    @ManyToOne(
        type=> User,
        user => user.rides,
        {onDelete: "SET NULL", nullable: true},
    )
    driver?: User;

    @Field(type=>Restaurant)
    @ManyToOne(
        type=> Restaurant,
        restaurant => restaurant.order,
        {onDelete: "SET NULL", nullable: true},
    )
    restaurant: Restaurant;

    @Field(type=>[OrderItems])
    @ManyToMany(type=> OrderItems)
    @JoinTable()
    items: OrderItems[];

    @Column()
    @Field(type=>Float, {nullable:true})
    @IsNumber()
    total?: number;

    @Column({type: 'enum', enum: OrderStatus, default: OrderStatus.Pending})
    @Field(type=>OrderStatus)
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @Field(type=> User, {nullable: true})
    @ManyToOne(
        type=> User,
        user => user.restaurants,
        {onDelete: "CASCADE"},
    ) 
    owner: User;

    

    
}
