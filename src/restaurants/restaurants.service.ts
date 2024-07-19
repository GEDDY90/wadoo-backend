import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Restaurant } from './entities/restaurant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    @InjectRepository(Category)
    private readonly categories: CategoryRepository,
  ) {}

  // Méthode pour créer un restaurant
  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;

      // Traitement de la catégorie du restaurant
      const categoryName = createRestaurantInput.categoryName.trim().toLowerCase();
      const categorySlug = categoryName.replace(/ /g, '-');

      // Recherche ou création de la catégorie associée
      let category = await this.categories.findOne({ where: { slug: categorySlug } });
      if (!category) {
        category = await this.categories.save(this.categories.create({
          slug: categorySlug,
          name: categoryName,
        }));
      }

      // Associer la catégorie au restaurant
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);

      return {
        ok: true,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: 'Vous ne pouvez pas créer un restaurant',
      };
    }
  }

  // Méthode pour éditer un restaurant
  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({ where: { id: editRestaurantInput.restaurantId } });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant non trouvé',
        };
      }

      // Vérification que l'utilisateur est bien le propriétaire du restaurant
      if (restaurant.owner.id !== owner.id) {
        return {
          ok: false,
          error: 'Vous n\'êtes pas autorisé à modifier ce restaurant',
        };
      }

      // Traitement de la catégorie si elle est modifiée
      let category: Category | undefined;
      if (editRestaurantInput.categoryName) {
        const categoryName = editRestaurantInput.categoryName.trim().toLowerCase();
        const categorySlug = categoryName.replace(/ /g, '-');

        // Recherche ou création de la nouvelle catégorie
        category = await this.categories.findOne({ where: { slug: categorySlug } });
        if (!category) {
          category = await this.categories.save(this.categories.create({
            slug: categorySlug,
            name: categoryName,
          }));
        }
      }

      // Met à jour les propriétés du restaurant avec les nouvelles données
      Object.assign(restaurant, editRestaurantInput, { category });
      await this.restaurants.save(restaurant);

      return {
        ok: true,
      };
    } catch (error) {
      console.error('Erreur lors de l\'édition du restaurant:', error);
      return {
        ok: false,
        error: 'Une erreur est survenue lors de l\'édition du restaurant',
      };
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
        return {
          ok: false,
          error: 'Restaurant non trouvé',
        };
      }

      // Vérification que l'utilisateur est bien le propriétaire du restaurant
      if (restaurant.owner.id !== owner.id) {
        throw new UnauthorizedException('Vous n\'êtes pas autorisé à supprimer ce restaurant');
      }

      // Suppression du restaurant
      await this.restaurants.remove(restaurant);

      return {
        ok: true,
      };
    } catch (error) {
      console.error('Erreur lors de la suppression du restaurant:', error);
      return {
        ok: false,
        error: 'Une erreur est survenue lors de la suppression du restaurant',
      };
    }
  }

  // Méthode pour récupérer les restaurants par catégorie avec pagination
async getRestaurantsByCategory(categorySlug: string, page: number = 1, limit: number = 10): Promise<Restaurant[]> {
    // Recherche de la catégorie dans la base de données en utilisant le slug fourni
    const category = await this.categories.findOne({ where: { slug: categorySlug } });
  
    // Vérification si la catégorie existe
    if (!category) {
      // Si la catégorie n'est pas trouvée, lance une exception NotFoundException avec un message approprié
      throw new NotFoundException(`Category with slug ${categorySlug} not found`);
    }
  
    // Récupération des restaurants appartenant à la catégorie trouvée, avec pagination
    const restaurants = await this.restaurants.find({
      where: { category },  // Condition : restaurants ayant cette catégorie
      skip: (page - 1) * limit,  // Calcul de l'offset pour la pagination
      take: limit,  // Nombre maximum de restaurants à récupérer pour cette page
    });
  
    return restaurants;  // Retourne la liste des restaurants correspondants
  }
  
  // Méthode pour récupérer toutes les catégories
  async getAllCategories(): Promise<Category[]> {
    // Récupération de toutes les catégories depuis la base de données
    return this.categories.find();
  }
  
}
