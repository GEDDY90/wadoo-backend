import { Test, TestingModule } from '@nestjs/testing';
import { Restaurant } from './entities/restaurant.entity';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateRestaurantInput } from './dtos/create-restaurant.dto';
import { EditRestaurantInput } from './dtos/edit-restaurant.dto';
import { DeleteRestaurantInput } from './dtos/delete-restaurant.dto';
import { RestaurantInput } from './dtos/restaurant.dto';
import { SearchRestaurantInput } from './dtos/search-restaurant.dto';
import { RestaurantService } from './restaurants.service';

describe('RestaurantService', () => {
  let service: RestaurantService;
  let restaurantRepository: Repository<Restaurant>;
  let categoryRepository: Repository<Category>;
  let dishRepository: Repository<Dish>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantService,
        {
          provide: getRepositoryToken(Restaurant),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Category),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Dish),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
    restaurantRepository = module.get<Repository<Restaurant>>(getRepositoryToken(Restaurant));
    categoryRepository = module.get<Repository<Category>>(getRepositoryToken(Category));
    dishRepository = module.get<Repository<Dish>>(getRepositoryToken(Dish));
  });

  describe('createRestaurant', () => {
    it('should create a restaurant successfully', async () => {
      const input: CreateRestaurantInput = {
        name: 'Test Restaurant',
        categoryName: 'Test Category',
        coverImg: 'test.jpg',
        address: '123 Test St',
        description: 'A test restaurant',
      };

      const mockCategory: Category = { id: 1, name: 'Test Category' } as Category;
      const mockRestaurant: Restaurant = {
        id: 1,
        name: input.name,
        coverImg: input.coverImg,
        address: input.address,
        description: input.description,
        category: mockCategory,
        owner: null,
        ownerId: null,
        isPromoted: false,
        promotedUntil: null,
      } as Restaurant;

      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      jest.spyOn(categoryRepository, 'save').mockResolvedValue(mockCategory);
      jest.spyOn(restaurantRepository, 'save').mockResolvedValue(mockRestaurant);

      const result = await service.createRestaurant(null as any, input);

      expect(result).toEqual({ ok: true });
      expect(restaurantRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        name: input.name,
        coverImg: input.coverImg,
        address: input.address,
        description: input.description,
        category: mockCategory,
      }));
    });

    it('should handle creation failure', async () => {
      const input: CreateRestaurantInput = {
        name: 'Test Restaurant',
        categoryName: 'Test Category',
        coverImg: 'test.jpg',
        address: '123 Test St',
        description: 'A test restaurant',
      };

      jest.spyOn(categoryRepository, 'findOne').mockResolvedValue(null);
      const result = await service.createRestaurant(null as any, input);

      expect(result).toEqual({ ok: false, error: 'Vous ne pouvez pas créer un restaurant' });
    });
  });

  describe('editRestaurant', () => {
    it('should edit a restaurant successfully', async () => {
      const input: EditRestaurantInput = {
        restaurantId: 1,
        name: 'Updated Restaurant',
        // ... autres champs nécessaires
      };

      const mockRestaurant: Restaurant = { id: 1, name: 'Old Restaurant' } as Restaurant;

      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(mockRestaurant);
      jest.spyOn(restaurantRepository, 'save').mockResolvedValue({ ...mockRestaurant, ...input });

      const result = await service.editRestaurant(null, input);

      expect(result).toEqual({ ok: true });
      expect(restaurantRepository.save).toHaveBeenCalledWith(expect.objectContaining(input));
    });

    it('should handle restaurant not found', async () => {
      const input: EditRestaurantInput = {
        restaurantId: 1,
        name: 'Updated Restaurant',
      };

      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(null);

      const result = await service.editRestaurant(null, input);

      expect(result).toEqual({ ok: false, error: 'Restaurant non trouvé' });
    });
  });

  describe('deleteRestaurant', () => {
    it('should delete a restaurant successfully', async () => {
      const input: DeleteRestaurantInput = {
        restaurantId: 1,
      };

      const mockRestaurant: Restaurant = { id: 1, name: 'Test Restaurant' } as Restaurant;

      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(mockRestaurant);
      jest.spyOn(restaurantRepository, 'remove').mockResolvedValue(mockRestaurant);

      const result = await service.deleteRestaurant(null, input);

      expect(result).toEqual({ ok: true });
      expect(restaurantRepository.remove).toHaveBeenCalledWith(mockRestaurant);
    });

    it('should handle restaurant not found', async () => {
      const input: DeleteRestaurantInput = {
        restaurantId: 1,
      };

      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(null);

      const result = await service.deleteRestaurant(null, input);

      expect(result).toEqual({ ok: false, error: 'Restaurant non trouvé' });
    });
  });

  describe('getAllRestaurants', () => {
    it('should return all restaurants with pagination', async () => {
      const mockRestaurants: Restaurant[] = [{ id: 1, name: 'Test Restaurant' }] as Restaurant[];
      jest.spyOn(restaurantRepository, 'findAndCount').mockResolvedValue([mockRestaurants, 1]);

      const result = await service.getAllRestaurants({ page: 1});

      expect(result).toEqual({ ok: true, restaurants: mockRestaurants, total: 1 });
      expect(restaurantRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getRestaurantById', () => {
    it('should return a restaurant by id', async () => {
      const input: RestaurantInput = { restaurantId: 1 };
      const mockRestaurant: Restaurant = { id: 1, name: 'Test Restaurant' } as Restaurant;

      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(mockRestaurant);

      const result = await service.getRestaurantById(input);

      expect(result).toEqual({ ok: true, restaurant: mockRestaurant });
    });

    it('should handle restaurant not found', async () => {
      const input: RestaurantInput = { restaurantId: 1 };

      jest.spyOn(restaurantRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getRestaurantById(input);

      expect(result).toEqual({ ok: false, error: 'Restaurant non trouvé' });
    });
  });

  describe('searchRestaurantByName', () => {
    it('should search restaurants by name', async () => {
      const input: SearchRestaurantInput = { query: 'Test', page:1 };
      const mockRestaurants: Restaurant[] = [{ id: 1, name: 'Test Restaurant' }] as Restaurant[];

      jest.spyOn(restaurantRepository, 'find').mockResolvedValue(mockRestaurants);

      const result = await service.searchRestaurantByName(input);

      expect(result).toEqual({ ok: true, restaurants: mockRestaurants });
      expect(restaurantRepository.find).toHaveBeenCalledWith({
        where: { name: expect.stringContaining('Test') },
      });
    });
  });
});
