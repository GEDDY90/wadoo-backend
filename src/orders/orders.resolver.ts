import { Args, Mutation, Resolver, Query } from "@nestjs/graphql";
import { Order } from "./entities/order.entity";
import { OrdersService } from "./orders.service";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { User } from "src/users/entities/user.entity";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { DeleteOrderInput, DeleteOrderOutput } from "./dtos/delete-order.dto";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/orders.dto";

@Resolver(of=>Order)
export class OrdersResolver {
    restaurantService: any;
    constructor(private readonly ordersService: OrdersService){}

    @Mutation(type=>CreateOrderOutput)
    @Role(['Client'])
    async createOrder(
      @AuthUser() customer: User,
      @Args('input') createOrderInput: CreateOrderInput,
    ){
      return this.restaurantService.createOrder(customer, createOrderInput);
    }

    @Mutation(type=>EditOrderOutput)
    @Role(['Client'])
    async editOrder(
      @AuthUser() customer: User,
      @Args('input') editOrderInput: EditOrderInput,
    ){
      return this.restaurantService.editOrder(customer, editOrderInput);
    }

    @Mutation(type=>DeleteOrderOutput)
    @Role(['Client'])
    async deleteOrder(
      @AuthUser() customer: User,
      @Args('input') deleteOrderInput: DeleteOrderInput,
    ){
      return this.restaurantService.deleteOrder(customer, deleteOrderInput);
    }

    @Query(returns => GetOrdersOutput)
    @Role(['Any'])
    async getOrders(
      @AuthUser() user: User,
      @Args('input') getOrdersInput:GetOrdersInput,
    ): Promise<GetOrdersOutput>{
      return this.ordersService.getOrders(user, getOrdersInput)
    }
}


