# Wadoo Backend
Alerte ! Confirmez votre addresse e-mail

Confirmez votre compte Wadoo S'il vous plait

Hello {{username}} !

 Confirmez votre compte Wadoo

 href="http://127.0.0.1:3000/confirm?code={{code}}"


`
See categories
See Restos by category (Page)
See Restos (Page)
See Resto

EDIT, DELETE Resto

CREATE, EDIT, DELETE Dish

import { Injectable } from "@nestjs/common";
import { Restaurant } from "./entities/restaurant.entity";
import { InjectRepository } from "@nestjs/typeorm";
import {  Repository } from "typeorm";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { User } from "../users/entities/user.entity";
import { Category } from "./entities/category.entity";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { CategoryRepository } from "./repository/category.repository";

@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        private readonly categories: CategoryRepository,
    ) {}

    async createRestaurant(
        owner: User,
        createRestaurantInput: CreateRestaurantInput
    ): Promise<CreateRestaurantOutput> {
        try {
            // Création d'une nouvelle instance de restaurant
            const newRestaurant = this.restaurants.create(createRestaurantInput);
            newRestaurant.owner = owner;
    
            // Récupération ou création de la catégorie
            const category = await this.categories.getOrCreate(createRestaurantInput.categoryName);
            newRestaurant.category = category;
    
            // Sauvegarde du nouveau restaurant
            await this.restaurants.save(newRestaurant);
    
            return {
                ok: true,
            };
        } catch (error) {
            console.error("Erreur lors de la création du restaurant:", error);
            return {
                ok: false,
                error: "Vous ne pouvez pas créer un restaurant",
            };
        }
    }
    

    async editRestaurant(
        owner: User,
        editRestaurantInput: EditRestaurantInput
    ): Promise<EditRestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne({ where: { id: editRestaurantInput.restaurantId } });
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Resto non trouvé",
                };
            }
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: "Vous n'êtes pas le propriétaire de ce Resto",
                };
            }

            let category: Category | null = null;
            if (editRestaurantInput.categoryName) {
                category = await this.categories.getOrCreate(editRestaurantInput.categoryName);
            }

            // Mettre à jour les propriétés du restaurant
            Object.assign(restaurant, editRestaurantInput, { category });

            await this.restaurants.save(restaurant);

            return {
                ok: true,
            };
        } catch (error) {
            console.error("Erreur lors de l'édition du restaurant:", error);
            return {
                ok: false,
                error: "Vous ne pouvez pas éditer le restaurant",
            };
        }
    }
}
