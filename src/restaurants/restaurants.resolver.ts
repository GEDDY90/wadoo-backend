import { Resolver, Mutation, Args, Query, Int } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { RestaurantService } from './restaurants.service';
import { AuthUser } from '../auth/auth-user.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../auth/role.decorator';
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto';
import { DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { Category } from './entities/category.entity';

@Resolver(() => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Role(['Owner']) // rôle requis pour cette mutation
  @Mutation(() => CreateRestaurantOutput)
  async createRestaurant(
    @AuthUser() owner: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantService.createRestaurant(owner, createRestaurantInput);
  }

  @Role(['Owner']) // rôle requis pour cette mutation
  @Mutation(() => EditRestaurantOutput)
  async editRestaurant(
    @AuthUser() owner: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantService.editRestaurant(owner, editRestaurantInput);
  }

  @Query(() => [Restaurant])
  async restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAllRestaurants();
  }

  @Query(() => Restaurant)
  async restaurant(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Restaurant> {
    return this.restaurantService.getRestaurantById(id);
  }

  @Role(['Owner']) // rôle requis pour cette mutation
  @Mutation(() => DeleteRestaurantOutput)
  async deleteRestaurant(
    @AuthUser() owner: User,
    @Args('id', { type: () => Int }) id: number,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.deleteRestaurant(owner, id);
  }

  @Query(() => [Restaurant])
  async getRestaurantsByCategory(
    @Args('categorySlug') categorySlug: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<Restaurant[]> {
    try {
      return this.restaurantService.getRestaurantsByCategory(categorySlug, page, limit);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Query(() => [Category])
  async getAllCategories(): Promise<Category[]> {
    return this.restaurantService.getAllCategories();
  }
}
