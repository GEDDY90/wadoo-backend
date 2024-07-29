import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order, OrderStatus } from "./entities/order.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { Restaurant } from "../restaurants/entities/restaurant.entity";
import { User, UserRole } from "src/users/entities/user.entity";
import { OrderItems } from "./entities/order-item.entity";
import { Dish } from "../restaurants/entities/dish.entity";
import { GetOrdersInput, GetOrdersOutput } from "./dtos/orders.dto";
import { GetOrderInput, GetOrderOutput } from "./dtos/order.dto";
import { NEW_COOKED_ORDER, NEW_ORDER_UPDATE, NEW_PENDING_ORDER, PUB_SUB } from "src/common/common.constants";
import { TakeOrderInput, TakeOrderOutput } from "./dtos/take-order.dto";
import { OrderUpdatesInput } from "./dtos/order-update.dto";
import { PubSub } from "graphql-subscriptions";

  @Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    @InjectRepository(OrderItems)
    private readonly orderItems: Repository<OrderItems>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ){}

  async createOrder(
    customer: User, 
    {restaurantId, items}: CreateOrderInput
  ): Promise<CreateOrderOutput>{
    try{
      const restaurant = await this.restaurants.
      findOne({where:
        {id: restaurantId}
      });
      if(!restaurant){
        return{
          ok:false,
          error: "Restaurant non trouvé"
      };     
    }
    let orderFinalPrice = 0
    const orderItems : OrderItems[] = [];
    for (const item of items){
      const dish = await this.dishes.
      findOne({where:
        {id: item.dishId}
      });
      if (!dish){
        return{
          ok: false,
          error: "Dish non trouvée"
        };     
      }
      console.log( `Dish price: ${dish.price}`);

      let dishFinalPrice = dish.price;
        for(const itemOption of item.options){
        console.log(itemOption);
        const dishOption = dish.options.find(
          dishOptions=> dishOption.
          name === itemOption.name
        );

        console.log(dishOption.name, itemOption.name,);

        if(dishOption){
          if(dishOption.extra){
            console.log( `$USD + ${dishOption.extra}`);
            dishFinalPrice = dishFinalPrice + dishOption.extra;
          }else {
            const dishOptionChoice = dishOption.choices.find(
              optionChoice => optionChoice.
              name === itemOption.choice,
            );
            if(dishOptionChoice){
              if(dishOptionChoice.extra){
                console.log( `$USD + ${dishOptionChoice.extra}`);
                dishFinalPrice = dishFinalPrice + dishOption.extra;
              }
            }
            
          }
        }
      }
      orderFinalPrice = orderFinalPrice + dishFinalPrice;
      const orderItem = await this.orderItems.save(
        this.orderItems.create({
        dish,
        options: item.options,
      }),
    );
    orderItems.push(orderItem);
    }
    const order = await this.orders.save(
      this.orders.create({
        customer,
        restaurant,
        total: orderFinalPrice,
        items: orderItems,
      }),
    );
    await this.pubSub.publish(
      NEW_PENDING_ORDER, 
      {pendingOrders: {order, 
        ownerId: restaurant.ownerId,
      }});
    console.log(order)
    return{
      ok:true,
    }
  }catch(e){
    console.log(e)
    return{
      ok:false,
      error:"La commande n'est pas créée"
    };
  }
  }
  canSeeOrder(
    user: User,
    order: Order,
  ):boolean {
    let canSee = true;
      if(user.role === UserRole.Client 
        && order.customerId !== user.id){
        canSee = false;
      }
      if(user.role === UserRole.Delivery 
        && order.driverId !== user.id){
        canSee = false;
      }
      if(user.role === UserRole.Owner
        && order.restaurant.ownerId!== user.id){
          canSee = false;
      }
    return canSee;
  }
  async editOrder(
    user: User,
    {id: orderId, status}: EditOrderInput,
  ): Promise<EditOrderOutput>{
    try{
      const order = await this.orders.findOne({
        where:{id:orderId},
        relations: ['restaurant', 'customer', 'driver'],
      }
      );
      if(!order){
        return{
          ok:false,
          error:"La commande non trouvée"
        }
      }
      if(!this.canSeeOrder(user, order)){
        return{
          ok: false,
          error: "Vous n'êtes pas autorisé"
        };
      }
      let canEdit = true;
      if(user.role === UserRole.Client){
        canEdit= false;
      }
      if(user.role === UserRole.Owner){
        if(status !== OrderStatus.Cooking && 
          status !== OrderStatus.Cooked){
            canEdit= false;
          }
      }
      if(user.role === UserRole.Delivery){
        if(status !== OrderStatus.PickedUp && 
          status !== OrderStatus.Delivered){
            canEdit= false;
          }
      }
      if(!canEdit){
        return{
          ok: false,
          error: "Vous n'êtes pas autorisé"
        };
      }
      await this.orders.save({
        id: orderId,
        status,
      });
      const newOrder = { ...order, status};
      if(user.role === UserRole.Owner){
        if (status===OrderStatus.Cooked){
          await this.pubSub.publish(NEW_COOKED_ORDER, 
            {cookedOrders: newOrder},
          )
        }
      }
      await this.pubSub.publish(NEW_ORDER_UPDATE,
        {orderUpdates: newOrder},
      );
    return{
      ok: true,
    };
    }catch(e){
      console.log(e)
      return{
        ok:false,
        error:"La commande n'est pas créée"
      }
    }
  }
  async getOrders(
    user: User,
    {status}: GetOrdersInput,
  ) : Promise<GetOrdersOutput>{
    try{
      let orders: Order[]
      if(user.role === UserRole.Client){
        orders = await this.orders.find({
          where: {
            customer: user,
            ...(status && {status}),
          }
        })
      }else if (user.role === UserRole.Delivery){
        orders = await this.orders.find({
          where: {
            driver: user,
            ...(status && {status}),
          }
        })
      }else if (user.role === UserRole.Owner){
        const restaurants = await this.restaurants.find({
          where: {
            owner: user,
          },
          relations: ['orders'],
        });
        console.log(orders, restaurants=>
          restaurants.orders.flat());       
        orders = restaurants.map(restaurant=> 
          restaurant.orders).flat(1);
        if (status){
          orders = orders.filter(order => 
            order.status === status)
        }
      }
      return {
        ok: true,
        orders,
      };
      }catch(e){
        console.log(e)
        return{
          ok:false,
          error:"Commandes non chargées"
        };
    }
  }
  async getOrder(
    user: User,
    {id: orderId}: GetOrderInput,
  ) : Promise<GetOrderOutput>{
    try{
      const order = await this.orders.findOne({
        where:{id:orderId},
        relations: ['restaurant'],
      });
      if (!order){
        return{
          ok: false,
          error: "Commande non trouvé"
        };
      }
      if(!this.canSeeOrder(user, order)){
        return{
          ok: false,
          error: "Vous n'êtes pas autorisé"
        };
      }
      return{
        ok: true,
        order,
      }
    }catch(e){
      console.log(e)
      return{
        ok: false,
        error: "Commande non chargée"
      }
    }
  }

  async takeOrder(
    driver: User,
    {id: orderId}: TakeOrderInput,
  ): Promise<TakeOrderOutput>{
    try{
      const order = await this.orders.findOne(
        {where:{id:orderId}
      });
      if(!order){
        return {
          ok: false,
          error: "Commande non trouvé",
        }
      }
      if(order.driver){
        return{
          ok: false,
          error:"Commande déjà prise"
        }
      }
      await this.orders.save({
        id: orderId,
        driver,
      });
      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        OrderUpdates: {...order, driver }
      })
      return{
        ok: true,
      };
    }catch(e){
      console.log(e)
      return{
        ok: false,
        error: "La commande n'est pas prise"
      };
    }
  }
}