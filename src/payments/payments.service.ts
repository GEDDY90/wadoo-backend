import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository } from "typeorm";
import { Payment } from "./entities/payments.entity";
import { Restaurant } from "src/restaurants/entities/restaurant.entity";
import { AuthUser } from "src/auth/auth-user.decorator";
import { User } from "src/users/entities/user.entity";
import { CreatePaymentInput, CreatePaymentOutput } from "./dtos/create-payment.dto";
import { GetPaymentOutput } from "./dtos/get-paiements.dto";
import { Interval, SchedulerRegistry } from "@nestjs/schedule";

@Injectable()
export class PaymentService {
    constructor(
        @InjectRepository(Payment)
        private readonly payments: Repository<Payment>,
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        private schedulerRegistry: SchedulerRegistry
    ) {}

    async createPayment(
        @AuthUser() owner: User, 
        { transactionId, restaurantId }: CreatePaymentInput,
    ): Promise<CreatePaymentOutput> {
        try {
            // Vérification de l'existence du restaurant
            const restaurant = await this.restaurants.findOne({ where: { id: restaurantId } });
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant not found",
                };
            }

            // Vérification des droits de l'utilisateur
            if (restaurant.ownerId !== owner.id) {
                return {
                    ok: false,
                    error: "You are not authorized to create a payment for this restaurant",
                };
            }

            // Création et sauvegarde du paiement
            await this.payments.save(
                this.payments.create({
                    transactionId,
                    user: owner,
                    restaurant,
                }),
            );
            restaurant.isPromoted = true;
            const date = new Date();
            date.setDate(date.getDate()+7);
            restaurant.promotedUntil = date;
            this.restaurants.save(restaurant);
            return {
                ok: true,
            };
        } catch (e) {
            console.error(e);
            return {
                ok: false,
                error: "Failed to create payment",
            };
        }
    }

    async getPayments(
        @AuthUser() user: User,
    ): Promise<GetPaymentOutput> {
        try {
            // Récupération des paiements pour l'utilisateur
            const payments = await this.payments.find({ where: { user: user } });

            return {
                ok: true,
                payments,
            };
        } catch (e) {
            console.error(e);
            return {
                ok: false,
                error: "Failed to retrieve payments",
            };
        }
    }

    @Interval(2000)
    async checkPromotedRestaurant() {
        const restaurants = await this.restaurants.find({where:
            {isPromoted: true,
                promotedUntil: LessThan(new Date)
            },
            });
            restaurants.forEach(async restaurant =>{
            restaurant.isPromoted = false;
            restaurant.promotedUntil = null;
            await this.restaurants.save(restaurant);
            })
    }
}

