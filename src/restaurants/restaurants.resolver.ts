import { Resolver, Query, Args, Mutation } from "@nestjs/graphql";
import { Restaurant } from "./entities/restaurant.entity";
import { CreateRestaurantInput } from "./dtos/create-restaurant.dto";
import { RestaurantService } from "./restaurants.service";
import { AuthUser } from "../auth/auth-user.decorator";
import { User, UserRole } from "../users/entities/user.entity";
import { CreateAccountOutput } from "src/users/dtos/create-account.dtos";
import { SetMetadata } from "@nestjs/common";
import { Role } from "src/auth/role.decorator";

@Resolver(of=>[Restaurant])
export class RestaurantResolver{
    constructor(private readonly restaurantService: RestaurantService){}
   
    @Mutation(returns=> CreateAccountOutput)
    @Role(['Owner'])
    async createRestaurant(
        @AuthUser() AuthUser: User,
        @Args('input')createRestaurantInput: CreateRestaurantInput,): Promise<CreateAccountOutput> {
            return this.restaurantService.createRestaurant(
                AuthUser,
                 createRestaurantInput);
    };
}
