import { Resolver, Mutation, Args, Query, Int, ResolveField, Parent } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { RestaurantService } from './restaurants.service';
import { AuthUser } from '../auth/auth-user.decorator';
import { User } from '../users/entities/user.entity';
import { Role } from '../auth/role.decorator';
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto';
import { DeleteRestaurantInput, DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { Category } from './entities/category.entity';
import { AllCategoriesOutput } from './dtos/allcategories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { SearchRestaurantInput, SearchRestaurantOutput } from './dtos/search-restaurant.dto';
import { Dish } from './entities/dish.entity';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';

@Resolver(() => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation(() => CreateRestaurantOutput)
  @Role(['Owner'])
  async createRestaurant(
    @AuthUser() owner: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantService.createRestaurant(owner, createRestaurantInput);
  }

  @Mutation(() => EditRestaurantOutput)
  @Role(['Owner'])
  async editRestaurant(
    @AuthUser() owner: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantService.editRestaurant(owner, editRestaurantInput);
  }

  @Mutation(() => DeleteRestaurantOutput)
  @Role(['Owner'])
  async deleteRestaurant(
    @AuthUser() owner: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.deleteRestaurant(owner, deleteRestaurantInput);
  }

  @Query(() => RestaurantsOutput)
  async getRestaurants(
    @Args() restaurantsInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    return this.restaurantService.getAllRestaurants(restaurantsInput);
  }

  @Query(() => RestaurantOutput)
  async getRestaurant(
    @Args() restaurantInput: RestaurantInput,
  ): Promise<RestaurantOutput> {
    return this.restaurantService.getRestaurantById(restaurantInput);
  }

  @Query(() => SearchRestaurantOutput)
  async searchRestaurant(
    @Args() searchRestaurantInput: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    return this.restaurantService.searchRestaurantByName(searchRestaurantInput);
  }
}

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @ResolveField(() => Int)
  async restaurantCount(
    @Parent() category: Category,
  ): Promise<number> {
    return this.restaurantService.countRestaurantsByCategory(category);
  }

  @Query(() => AllCategoriesOutput)
  async getAllCategories(): Promise<AllCategoriesOutput> {
    return this.restaurantService.getAllCategories();
  }

  @Query(() => CategoryOutput)
  async getCategory(
    @Args() categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    return this.restaurantService.getRestaurantsBySlug(categoryInput);
  }
}

@Resolver(() => Dish)
export class DishResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Mutation(() => CreateDishOutput)
  @Role(['Owner'])
  async createDish(
    @AuthUser() owner: User,
    @Args('input') createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return this.restaurantService.createDish(owner, createDishInput);
  }

  @Mutation(() => EditDishOutput)
  @Role(['Owner'])
  async editDish(
    @AuthUser() owner: User,
    @Args('input') editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    return this.restaurantService.editDish(owner, editDishInput);
  }

  @Mutation(() => DeleteDishOutput)
  @Role(['Owner'])
  async deleteDish(
    @AuthUser() owner: User,
    @Args('input') deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    return this.restaurantService.deleteDish(owner, deleteDishInput);
  }
}
