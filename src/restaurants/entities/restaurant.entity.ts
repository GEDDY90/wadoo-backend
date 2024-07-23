import { Field, InputType, ObjectType } from "@nestjs/graphql";
import { IsString, Length } from "class-validator";
import { CoreEntity } from "../../common/entities/core.entity";
import { Column, Entity, ManyToOne, RelationId } from "typeorm";
import { Category } from "./category.entity";
import { User } from "../../users/entities/user.entity";

@InputType('RestaurantInputType',{isAbstract:true})
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {

    @Field(type=>String)
    @Column()
    @IsString()
    @Length(5)
    name: string;

    @Field(type=>String)
    @Column()
    @IsString()
    description: string;

    @Field(type=>String)
    @Column()
    @IsString()
    coverImg: string;

    @Field(type=>String, {defaultValue: "Bénin"})
    @Column({default: "Bénin"})
    @IsString()
    address: string;

    @Field(type=> Category, {nullable: true})
    @ManyToOne(
        type=> Category,
        category => category.restaurants, {nullable: true, onDelete: 'SET NULL'})
    category: Category;

    @Field(type=> User, {nullable: true})
    @ManyToOne(
        type=> User,
        user => user.restaurants,
        {onDelete: "CASCADE"},
    ) 
    owner: User;

    @RelationId((restaurant: Restaurant)=> restaurant.owner)
    ownerId : number;
}
