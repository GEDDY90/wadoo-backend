import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { User } from '../users/entities/user.entity';
import { Category } from './entities/category.entity';
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto';
import { DeleteRestaurantInput, DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { CategoryRepository } from './repository/category.repository';
import { AllCategoriesOutput } from './dtos/allcategories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { SearchRestaurantInput, SearchRestaurantOutput } from './dtos/search-restaurant.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { Dish } from './entities/dish.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';

  @Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(CategoryRepository)
    private readonly categories: CategoryRepository,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>
    
  ){}
    

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.
      create(createRestaurantInput);

      const category = await this.categories.
      getOrCreate(createRestaurantInput.categoryName);

      newRestaurant.owner = owner;
      newRestaurant.category = category;
      await this.restaurants.
      save(newRestaurant);

      return { ok: true };
    } catch (error) {
      console.log(error)
      return { 
        ok: false, 
        error: 'Vous ne pouvez pas créer un restaurant' 
      };
    }
  }
  async editRestaurant(
  owner: User,
  editRestaurantInput: EditRestaurantInput,
): Promise<EditRestaurantOutput> {
  try {
    // Trouver le restaurant par son ID
    const restaurant = await this.restaurants.
    findOne({ where: 
      { id: editRestaurantInput.restaurantId }, 
    });
    if (!restaurant) {
      return { 
        ok: false, 
        error: 'Restaurant non trouvé' };
    }
    // Vérifier si l'utilisateur est le propriétaire du restaurant
    if (restaurant.ownerId !== owner.id) {
      return { 
        ok: false, 
        error: 'Vous n\'êtes pas autorisé à modifier ce restaurant' 
      };
    }
    // Si une nouvelle catégorie est spécifiée, obtenir ou créer cette catégorie
    if (editRestaurantInput.categoryName) {
      const category = await this.categories.
      getOrCreate(editRestaurantInput.categoryName);
      restaurant.category = category;
    }
    // Mettre à jour les propriétés du restaurant
    Object.assign(restaurant, editRestaurantInput);
    // Sauvegarder les modifications
    await this.restaurants.
    save(restaurant);
    return { ok: true };
  } catch (e) {
    console.log(e);
    return { 
      ok: false, 
      error: 'Une erreur est survenue lors de l\'édition du restaurant' 
    };
  }
  }
  // Méthode pour supprimer un restaurant
  async deleteRestaurant(
    owner: User, 
    {restaurantId}: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.
      findOne({ where: 
        { id: restaurantId } 
      });
      if (!restaurant) {
        return { 
          ok: false, 
          error: 'Restaurant non trouvé' 
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return{
          ok: false,
          error: "Vous n'êtes pas autorisé"
        }
      }
      await this.restaurants.
      remove(restaurant);
      return { ok: true };
    } catch (error) {
      if (error instanceof NotFoundException || 
        error instanceof UnauthorizedException) {
        throw error;
      }
      return { 
        ok: false, 
        error: 'Une erreur est survenue lors de la suppression du restaurant' 
      };
    }
  }
  // Méthode pour récupérer toutes les catégories
  async getAllCategories()
  : Promise<AllCategoriesOutput> {
    try{
      const categories = await this.categories.find();
      return {
        ok:true,
        categories,
      }
    }catch{
      return {
        ok:false,
        error: "Peux pas charger la liste de categorie"
      }
    }
  }
  countRestaurants(
    category: Category,
  ){
    console.log(this.restaurants)
    return this.restaurants.
    count(
      {where: 
        {category : {slug: category.slug},
      },
      });
  }
  // Méthode pour récupérer tous les restaurants
  async getAllRestaurants(
    {page}: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
      try{
        const [restaurants, totalResults] 
        = await this.restaurants.findAndCount({
          skip:(page - 1)*25,
          take:25,
          order: {
            isPromoted: "DESC"
          }
          });
        return{
          ok: true,
          results: restaurants,
          totalPages: Math.ceil(totalResults/25),
          totalResults
        }
      }catch{
        return{
          ok: false,
          error: "Restaurant non chargé"
        }
      }
  }
  // Méthode pour récupérer les restaurants par slug
  async getRestaurantsBySlug(
    { slug, page }: CategoryInput,
  ): Promise<CategoryOutput> {
    try {
      // Récupère la catégorie correspondant au slug fourni
      const category = await this.categories.findOne({
        where: { slug },
      });
      // Vérifie si la catégorie existe
      if (!category) {
        return {
          ok: false,
          error: "Catégorie non trouvée" // Correction du message d'erreur
        };
      }
      // Récupère les restaurants associés à la catégorie avec pagination
      const restaurants 
      = await this.restaurants.find({
        where: { 
          category: {slug: category.slug} 
        },
        order: {
          isPromoted: "DESC"
        },
        take: 25, // Nombre d'éléments par page
        skip: (page - 1) * 25 // Calcul du décalage pour la pagination
      });
      // Associe les restaurants récupérés à la catégorie
      category.restaurants = restaurants;
      const totalResults = await this.
      countRestaurants(category);
      // Retourne les données avec un statut de succès
      return {
        ok: true,
        category:[category],
        totalPages: Math.ceil(totalResults/25),
      };

    } catch (error) { // Capture l'erreur spécifique
      console.error("Erreur lors du chargement de la catégorie:", error); // Journalise l'erreur pour le débogage
      return {
        ok: false,
        error: "Impossible de charger la catégorie" // Correction du message d'erreur
      };
    }
  }
  async getRestaurantById(
    {restaurantId}: RestaurantInput,
  ): Promise <RestaurantOutput> {
    try{
      const restaurant = await this.restaurants.findOne({
        where:
        { id: restaurantId}, 
        relations:['menu'],
      })
      if(!restaurant){
        return{
          ok: false,
          error: "Restaurant non trouvé"
        }
      };
      return{
        ok: true,
        restaurant: [restaurant],
      };

    }catch{
      return{
        ok: false,
        error: "Restaurant non trouvé"
      }
    }
  }
  async searchRestaurantByName(
    {query, page}: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    try{
      const [restaurants, totalResults]
      = await this.restaurants.findAndCount({
        where: {name: ILike(`%${query}%`)},
        skip:(page - 1)*25,
        take:25,
      });
      return {
        ok: true,
        restaurants,
        totalPages: Math.ceil(totalResults/25),
        totalResults,
      };

    }catch{
      return{
        ok: false,
        error: "Restaurant non trouvé"
      }
    }

  }
  async createDish(
    owner: User, 
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try{
      const restaurant = await this.restaurants.
      findOne({where: {id: createDishInput.restaurantId}})
      if (!restaurant){
        return{
          ok:false,
          error:"Dish non trouvé",
        }
      };
      if(owner.id!==restaurant.ownerId){
        return{
          ok:false,
          error:"Vous ne pouvez pas créer de dish pour ce resto"
        }
      };
      const dish = this.dishes.
      create(createDishInput);
      dish.restaurant = restaurant;
      await this.dishes.save(dish);
      return {ok: true};
    }catch(e){
      console.log(e)
      return{
        ok:false,
        error:"Dish non créé"
      }
    }
  }
  async editDish(
    owner: User, 
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try{
      const dish = await this.dishes.findOne({
        where: {
        id: editDishInput.dishId},
        relations: ['restaurant'], // Charger la relation restaurant
      })
      if (!dish){
        return{
          ok:false,
          error:"Dish non trouvé",
        }
      };
      if(owner.id!== dish.restaurant.ownerId){
        return{
          ok:false,
          error:"Vous ne pouvez pas modifier de dish pour ce resto"
        }
      };
      Object.assign(dish, editDishInput);
      await this.dishes.save(dish);
      return {ok: true};
    }catch(e){
      console.log(e)
      return{
        ok:false,
        error:"Dish non créé"
      }
    }
  }
  async deleteDish(
    owner: User, 
    deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try{
      const dish = await this.dishes.findOne({
        where:{
        id:deleteDishInput.dishId}, 
        relations: ['restaurant'],
      });
      if(!dish){
        return{
          ok: false,
          error: "Dish non trouvé"
        };
      }
      if(dish.restaurant.ownerId !== owner.id){
        return{
          ok: false,
          error: "Vous n'êtes le proprio de cette dish"
        };
      }
      await this.dishes.remove(dish);
      return {
        ok:true,
      }
    }catch(e){
      console.log(e)
      return{
        ok:false,
        error:"Dish non supprimé"
      }
    }
  }
}
