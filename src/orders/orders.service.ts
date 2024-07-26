import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { Repository } from "typeorm";
import { Dish } from "src/restaurants/entities/dish.entity";
import { CreateOrderInput, CreateOrderOutput } from "./dtos/create-order.dto";
import { EditOrderInput, EditOrderOutput } from "./dtos/edit-order.dto";
import { DeleteOrderInput, DeleteOrderOutput } from "./dtos/delete-order.dto";

  @Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>
  ) {}


  async createOrder(createOrderInput: CreateOrderInput) : Promise<CreateOrderOutput>{
    try{

    }catch(e){
      console.log(e)
      return{
        ok:false,
        error:"La commande n'est pas créée"
      }
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

}