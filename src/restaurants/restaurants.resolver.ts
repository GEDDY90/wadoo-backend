import { Resolver, Mutation, Args } from "@nestjs/graphql";
import { Restaurant } from "./entities/restaurant.entity";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { RestaurantService } from "./restaurants.service";
import { AuthUser } from "../auth/auth-user.decorator";
import { User } from "../users/entities/user.entity";
import { Role } from "src/auth/role.decorator";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { CategoryRepository } from "./repository/category.repository";

@Resolver(of => Restaurant)  
    export class RestaurantResolver {
        constructor(
            private readonly restaurantService: RestaurantService,
            private readonly categories: CategoryRepository,
        ) {}
    
    @Mutation(() => CreateRestaurantOutput)
    @Role(['Owner'])
    async createRestaurant(
        @AuthUser() owner: User,
        @Args('input') createRestaurantInput: CreateRestaurantInput
    ): Promise<CreateRestaurantOutput> {
        console.log(this.categories)
        return this.restaurantService.createRestaurant(owner, createRestaurantInput);
        
    }
    

    @Mutation(returns => EditRestaurantOutput)
    @Role(['Owner'])
    async editRestaurant(
        @AuthUser() owner: User,
        @Args('input') editRestaurantInput: EditRestaurantInput
    ): Promise<EditRestaurantOutput> {
        return this.restaurantService.editRestaurant(owner, editRestaurantInput);
    }
}
