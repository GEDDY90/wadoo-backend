import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { User } from '../users/entities/user.entity';
import { Category } from './entities/category.entity';
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto';
import { DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { CategoryRepository } from './repository/category.repository';

  @Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(CategoryRepository)
    private readonly categories: CategoryRepository,
  ) {
    // Ajoutez des logs pour vérifier l'injection
    console.log(categories);
  }

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);

      const category = await this.categories.getOrCreate(createRestaurantInput.categoryName);

      newRestaurant.owner = owner;
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);

      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, error: 'Vous ne pouvez pas créer un restaurant' };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      // Trouver le restaurant par son ID
      const restaurant = await this.restaurants.findOne({ where: { id: editRestaurantInput.restaurantId } });
      if (!restaurant) {
        return { ok: false, error: 'Restaurant non trouvé' };
      }
  
      // Vérifier si l'utilisateur est le propriétaire du restaurant
      if (restaurant.ownerId !== owner.id) {
        return { ok: false, error: 'Vous n\'êtes pas autorisé à modifier ce restaurant' };
      }
  
      // Si une nouvelle catégorie est spécifiée, obtenir ou créer cette catégorie
      if (editRestaurantInput.categoryName) {
        const category = await this.categories.getOrCreate(editRestaurantInput.categoryName);
        restaurant.category = category;
      }
  
      // Mettre à jour les propriétés du restaurant
      Object.assign(restaurant, editRestaurantInput);
      
      // Sauvegarder les modifications
      await this.restaurants.save(restaurant);
  
      return { ok: true };
    } catch (error) {
      console.error('Erreur lors de l\'édition du restaurant:', error);
      return { ok: false, error: 'Une erreur est survenue lors de l\'édition du restaurant' };
    }
  }
  

  // Méthode pour récupérer tous les restaurants
  async getAllRestaurants(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  // Méthode pour récupérer un restaurant par son ID
  async getRestaurantById(id: number): Promise<Restaurant> {
    const restaurant = await this.restaurants.findOne({ where: { id } });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
    return restaurant;
  }

  // Méthode pour supprimer un restaurant
  async deleteRestaurant(owner: User, id: number): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({ where: { id } });
      if (!restaurant) {
        return { ok: false, error: 'Restaurant non trouvé' };
      }

      if (restaurant.ownerId !== owner.id) {
        throw new UnauthorizedException('Vous n\'êtes pas autorisé à supprimer ce restaurant');
      }

      await this.restaurants.remove(restaurant);

      return { ok: true };
    } catch (error) {
      console.error('Erreur lors de la suppression du restaurant:', error);
      return { ok: false, error: 'Une erreur est survenue lors de la suppression du restaurant' };
    }
  }

  // Méthode pour récupérer les restaurants par catégorie avec pagination
  async getRestaurantsByCategory(categorySlug: string, page: number = 1, limit: number = 10): Promise<Restaurant[]> {
    const category = await this.categories.findOne({ where: { slug: categorySlug } });
    if (!category) {
      throw new NotFoundException(`Category with slug ${categorySlug} not found`);
    }

    return this.restaurants.find({
      where: { category: { id: category.id } },
      skip: (page - 1) * limit,
      take: limit,
    });

  }

  // Méthode pour récupérer toutes les catégories
  async getAllCategories(): Promise<Category[]> {
    return this.categories.find();
  }
}
