import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { Repository } from "typeorm";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { DeleteOrderInput, DeleteOrderOutput } from "./dtos/delete-order.dto";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { User, UserRole } from "src/users/entities/user.entity";
import { OrderItems } from "./entities/order-item.entity";
import { Dish, DishOption } from "src/restaurants/entities/dish.entity";
import { GetOrdersInput } from "./dtos/orders.dto";

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
 
  ) {}


  async createOrder(
    customer: User, 
    {restaurantId, items}: CreateOrderInput
  ): Promise<CreateOrderOutput>{
    try{
      const restaurant = await this.restaurants.findOne({where:{id: restaurantId}})
      if(!restaurant){
        return{
          ok:false,
          error: "Restaurant non trouvé"
      };     
    }
    let orderFinalPrice = 0
    const orderItems : OrderItems[] = [];
    for (const item of items){
      const dish = await this.dishes.findOne({where:{id: item.dishId}});
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

  async editOrder(editOrderInput: EditOrderInput) : Promise<EditOrderOutput>{
    try{

    }catch(e){
      console.log(e)
      return{
        ok:false,
        error:"La commande n'est pas créée"
      }
    }
  }

  async deleteOrder(deleteOrderInput: DeleteOrderInput) : Promise<DeleteOrderOutput>{
    try{

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
  ) : Promise<EditOrderOutput>{
    try{
      if(user.role === UserRole.Client){
        const orders = await this.orders.find({
          where: {
            customer: user,
          }
        })
      }else if (user.role === UserRole.Delivery){
        const orders = await this.orders.find({
          where: {
            driver: user,
          }
        })
      }else if (user.role === UserRole.Owner){
        const orders = await this.restaurants.find({
          where: {
            owner: user,
          },
          select: ['orders'],
          relations: ['orders'],
        });
        console.log(orders); 
      }
     
    }catch(e){
      console.log(e)
      return{
        ok:false,
        error:"La commande n'est pas créée"
      }
    }
  }
}