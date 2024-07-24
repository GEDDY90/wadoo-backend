import { Test, TestingModule } from '@nestjs/testing';
import { Restaurant } from './entities/restaurant.entity';
import { Category } from './entities/category.entity';
import { User } from '../users/entities/user.entity';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto';
import { DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { CategoryRepository } from './repository/category.repository';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RestaurantService } from './restaurants.service';

describe('RestaurantService', () => {
  let service: RestaurantService;
  let categoryRepository: CategoryRepository;
  let restaurantRepository: Repository<Restaurant>;

  const mockRestaurantRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
  };

  const mockCategoryRepository = {
    getOrCreate: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantService,
        { provide: getRepositoryToken(Restaurant), useValue: mockRestaurantRepository },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepository },
      ],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
    categoryRepository = module.get<CategoryRepository>(getRepositoryToken(Category));
    restaurantRepository = module.get<Repository<Restaurant>>(getRepositoryToken(Restaurant));
  });

  describe('createRestaurant', () => {
    it('should successfully create a restaurant', async () => {
      const owner = new User(); // create a user instance
      owner.id = 1;

      const createRestaurantInput: CreateRestaurantInput = {
        name: 'Restaurant Test',
        description: 'Test Description',
        coverImg: 'test-img.jpg',
        address: 'Test Address',
        categoryName: 'Test Category',
      };

      const mockCategory = new Category();
      mockCategory.id = 1;

      jest.spyOn(categoryRepository, 'getOrCreate').mockResolvedValue(mockCategory);
      jest.spyOn(restaurantRepository, 'save').mockResolvedValue(new Restaurant());

      const result = await service.createRestaurant(owner, createRestaurantInput);
      expect(result).toEqual({ok: false, error: 'Vous ne pouvez pas créer un restaurant'});
    });

    it('should handle errors during restaurant creation', async () => {
      const owner = new User(); // create a user instance
      owner.id = 1;

      const createRestaurantInput: CreateRestaurantInput = {
        name: 'Restaurant Test',
        description: 'Test Description',
        coverImg: 'test-img.jpg',
        address: 'Test Address',
        categoryName: 'Test Category',
      };

      jest.spyOn(categoryRepository, 'getOrCreate').mockRejectedValue(new Error('Database Error'));

      const result = await service.createRestaurant(owner, createRestaurantInput);
      expect(result).toEqual({ ok: false, error: 'Vous ne pouvez pas créer un restaurant' });
    });
  });

  describe('editRestaurant', () => {
    it('should successfully edit a restaurant', async () => {
      const owner = new User(); // create a user instance
      owner.id = 1;

      const editRestaurantInput: EditRestaurantInput = {
        restaurantId: 1,
        name: 'Updated Restaurant',
        categoryName: 'Updated Category',
      };

      const mockRestaurant = new Restaurant();
      mockRestaurant.id = 1;
      mockRestaurant.ownerId = 1;

      const mockCategory = new Category();
      mockCategory.id = 1;

      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(mockRestaurant);
      jest.spyOn(categoryRepository, 'getOrCreate').mockResolvedValue(mockCategory);
      jest.spyOn(restaurantRepository, 'save').mockResolvedValue(mockRestaurant);

      const result = await service.editRestaurant(owner, editRestaurantInput);
      expect(result).toEqual({ ok: true });
    });

    it('should handle errors during restaurant edit', async () => {
      const owner = new User(); // create a user instance
      owner.id = 1;

      const editRestaurantInput: EditRestaurantInput = {
        restaurantId: 1,
        name: 'Updated Restaurant',
        categoryName: 'Updated Category',
      };

      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(null);

      const result = await service.editRestaurant(owner, editRestaurantInput);
      expect(result).toEqual({ ok: false, error: 'Restaurant non trouvé' });
    });

    it('should handle unauthorized edit attempt', async () => {
      const owner = new User(); // create a user instance
      owner.id = 2;

      const editRestaurantInput: EditRestaurantInput = {
        restaurantId: 1,
        name: 'Updated Restaurant',
      };

      const mockRestaurant = new Restaurant();
      mockRestaurant.id = 1;
      mockRestaurant.ownerId = 1;

      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(mockRestaurant);

      const result = await service.editRestaurant(owner, editRestaurantInput);
      expect(result).toEqual({ ok: false, error: 'Vous n\'êtes pas autorisé à modifier ce restaurant' });
    });
  });

  describe('getAllRestaurants', () => {
    it('should return all restaurants', async () => {
      const mockRestaurants = [new Restaurant(), new Restaurant()];
      jest.spyOn(restaurantRepository, 'find').mockResolvedValue(mockRestaurants);

      const result = await service.getAllRestaurants();
      expect(result).toEqual(mockRestaurants);
    });
  });

  describe('getRestaurantById', () => {
    it('should return a restaurant by ID', async () => {
      const mockRestaurant = new Restaurant();
      mockRestaurant.id = 1;
      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(mockRestaurant);

      const result = await service.getRestaurantById(1);
      expect(result).toEqual(mockRestaurant);
    });

    it('should throw NotFoundException if restaurant not found', async () => {
      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getRestaurantById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteRestaurant', () => {
    it('should successfully delete a restaurant', async () => {
      const owner = new User(); // create a user instance
      owner.id = 1;

      const mockRestaurant = new Restaurant();
      mockRestaurant.id = 1;
      mockRestaurant.ownerId = 1;

      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(mockRestaurant);
      jest.spyOn(restaurantRepository, 'remove').mockResolvedValue(mockRestaurant);

      const result = await service.deleteRestaurant(owner, 1);
      expect(result).toEqual({ ok: true });
    });

    it('should handle unauthorized delete attempt', async () => {
      const owner = new User(); // create a user instance
      owner.id = 2;

      const mockRestaurant = new Restaurant();
      mockRestaurant.id = 1;
      mockRestaurant.ownerId = 1;

      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(mockRestaurant);

      await expect(service.deleteRestaurant(owner, 1)).rejects.toThrow(UnauthorizedException);

      
    });

    it('should handle restaurant not found during delete', async () => {
      const owner = new User(); // create a user instance
      owner.id = 1;

      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(null);

      const result = await service.deleteRestaurant(owner, 1);
      expect(result).toEqual({ ok: false, error: 'Restaurant non trouvé' });
    });
  });

  describe('getRestaurantsByCategory', () => {
    it('should return restaurants by category with pagination', async () => {
      const mockCategory = new Category();
      mockCategory.id = 1;

      const mockRestaurants = [new Restaurant(), new Restaurant()];
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(restaurantRepository, 'find').mockResolvedValue(mockRestaurants);

      const result = await service.getRestaurantsByCategory('categorySlug', 1, 10);
      expect(result).toEqual(mockRestaurants);
    });

    it('should throw NotFoundException if category not found', async () => {
      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getRestaurantsByCategory('categorySlug', 1, 10)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = [new Category(), new Category()];
      jest.spyOn(categoryRepository, 'find').mockResolvedValue(mockCategories);

      const result = await service.getAllCategories();
      expect(result).toEqual(mockCategories);
    });
  });
});
