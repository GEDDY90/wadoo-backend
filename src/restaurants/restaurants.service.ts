import { Injectable } from "@nestjs/common";
import { Restaurant } from "./entities/restaurant.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { User } from "../users/entities/user.entity";
import { Category } from "./entities/category.entity";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";



@Injectable()
export class RestaurantService{
    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurants:Repository<Restaurant>,
        @InjectRepository(Category)
        private readonly categories: Repository<Category>
    ){}
   
    async createRestaurant(
        owner: User,
        createRestaurantInput: CreateRestaurantInput
    ): Promise<CreateRestaurantOutput> {
        try {
            const newRestaurant = this.restaurants.create(createRestaurantInput);
            newRestaurant.owner = owner;
    
            const categoryName = createRestaurantInput.categoryName.trim().toLowerCase();
            const categorySlug = categoryName.replace(/ /g, "-");
    
            let category = await this.categories.findOne({ where: { slug: categorySlug } });
            if (!category) {
                category = await this.categories.save(this.categories.create({
                    slug: categorySlug,
                    name: categoryName,
                }));
            }
    
            newRestaurant.category = category;  // Associer la catégorie
            await this.restaurants.save(newRestaurant);
    
            return {
                ok: true,
            };
        } catch (error) {
            console.error(error);
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
            const restaurant = await this.restaurants.findOne({where:{id:editRestaurantInput.restaurantId}});
            if (!restaurant) {
                return {
                    ok: false,
                    error: "Restaurant non trouvé",
                };
            }

            // Vérifie que l'utilisateur est le propriétaire du restaurant
            if (restaurant.owner.id !== owner.id) {
                return {
                    ok: false,
                    error: "Vous n'êtes pas autorisé à modifier ce restaurant",
                };
            }

            let category: Category | undefined;
            if (editRestaurantInput.categoryName) {
                const categoryName = editRestaurantInput.categoryName.trim().toLowerCase();
                const categorySlug = categoryName.replace(/ /g, "-");

                category = await this.categories.findOne({ where: { slug: categorySlug } });
                if (!category) {
                    category = await this.categories.save(this.categories.create({
                        slug: categorySlug,
                        name: categoryName,
                    }));
                }
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
                error: "Une erreur est survenue lors de l'édition du restaurant",
            };
        }
    }
   
} 