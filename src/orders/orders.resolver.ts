import { Args, Mutation, Resolver, Query, Subscription } from "@nestjs/graphql";
import { Order } from "./entities/order.entity";
import { OrdersService } from "./orders.service";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { User } from "../users/entities/user.entity";
import { AuthUser } from "../auth/auth-user.decorator";
import { Role } from "../auth/role.decorator";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/orders.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/order.dto";
import { NEW_COOKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB } from "src/common/common.constants";
import { Inject } from "@nestjs/common";
import { OrderUpdatesInput } from "./dtos/order-update.dto";
import { TakeOrderInput, TakeOrderOutput } from "./dtos/take-order.dto";
import { PubSub } from "graphql-subscriptions";


@Resolver(of=>Order)
export class OrdersResolver {
    restaurantService: any;
    constructor(
      private readonly ordersService: OrdersService,
      @Inject(PUB_SUB) private readonly pubSub: PubSub,
    ){}

    @Mutation(type=>CreateOrderOutput)
    @Role(['Client'])
    async createOrder(
      @AuthUser() customer: User,
      @Args('input') createOrderInput: CreateOrderInput,
    ){
      return this.restaurantService.
      createOrder(customer, createOrderInput);
    }

    @Mutation(type=>EditOrderOutput)
    @Role(['Any'])
    async editOrder(
      @AuthUser() customer: User,
      @Args('input') editOrderInput: EditOrderInput,
    ){
      return this.restaurantService.
      editOrder(customer, editOrderInput);
    }

    @Query(returns => GetOrdersOutput)
    @Role(['Any'])
    async getOrders(
      @AuthUser() user: User,
      @Args('input') getOrdersInput:GetOrdersInput,
    ): Promise<GetOrdersOutput>{
      return this.ordersService.
      getOrders(user, getOrdersInput)
    }

    @Query(returns => GetOrderOutput)
    @Role(['Any'])
    async getOrder(
      @AuthUser() user: User,
      @Args('input') getOrderInput:GetOrderInput,
    ): Promise<GetOrderOutput>{
      return this.ordersService.
      getOrder(user, getOrderInput)
    }

    @Mutation(returns => Boolean)
    async potatoReady(
      @Args('potatoId') potatoId: number,
    ){
      await this.pubSub.publish('hotPotatos', {
        readyPotato: potatoId,
      });
      return true;
    }

    @Subscription(returns=> Order, {
      filter: ({pendingOrders: {ownerId}}, _, {user})=>{
        console.log(ownerId, user.id);
        return ownerId===user.id;
      },
      resolve:({pendingOrders: {order}})=>order,
    })
    @Role(['Owner'])
    pendingOrders(){
      return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
    }

    @Subscription(returns=> Order)
    @Role(['Delivery'])
    cookedOrders(){
      return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
    }

    @Subscription(returns=> Order, {
      filter: (
        {orderUpdates: order}: {orderUpdates: Order}, 
        {input}: {input: OrderUpdatesInput}, 
        {user}: {user: User}, 
      )=>{
        console.log(order );

        if(order.driverId !== user.id &&
          order.customerId !== user.id &&
          order.restaurant.ownerId !== user.id
        ){
          return false;
        }
        return order.id === input.id;
      },
    })
    @Role(['Any'])
    orderUpdates(
      @Args('input') orderUpdatesInput: OrderUpdatesInput,
    ){
      return this.pubSub.asyncIterator(NEW_ORDER_UPDATE);
    }

    @Query(returns => TakeOrderOutput)
    @Role(['Delivery'])
    async takeOrder(
      @AuthUser() driver: User,
      @Args('input') takeOrderInput:TakeOrderInput,
    ): Promise<TakeOrderOutput>{
      return this.ordersService.
      takeOrder(driver, takeOrderInput)
    }

    /*@Subscription(returns => String, {
      filter:({readyPotato}, {potatoId})=>{
        return readyPotato===potatoId;
      }, 
      resolve:({readyPotato})=>{
        `Potato ${readyPotato} ready`
      }
    })
    @Role(['Any'])
    readyPotato(
      @Args('potatoId') potatoId: number,
    ){
      return this.pubSub.asyncIterator('hotPotatos');
    }*/
}


