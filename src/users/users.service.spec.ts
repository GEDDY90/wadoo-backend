import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from '../jwt/jwt.service';
import { MailService } from '../mail/mail.service';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dtos';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { LoginInput } from './dtos/login.tdo';
import { NotFoundException } from '@nestjs/common';

const mockUserRepository = () => ({
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const mockVerificationRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;
  let jwtService: JwtService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository() },
        { provide: getRepositoryToken(Verification), useValue: mockVerificationRepository() },
        { provide: JwtService, useValue: mockJwtService() },
        { provide: MailService, useValue: mockMailService() },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    verificationRepository = module.get(getRepositoryToken(Verification));
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  describe('createAccount', () => {
    it('should create a new account', async () => {
      const input: CreateAccountInput = { email: 'test@test.com', password: 'password', role: UserRole.Owner };
      const user = { id: 1, ...input };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'save').mockResolvedValue(user as any);
      jest.spyOn(verificationRepository, 'save').mockResolvedValue({ code: 'verification-code', user } as any);
      jest.spyOn(mailService, 'sendVerificationEmail').mockResolvedValue(undefined);

      const result = await service.createAccount(input);
      expect(result).toEqual({ ok: true });
    });

    it('should return an error if user already exists', async () => {
      const input: CreateAccountInput = { email: 'test@test.com', password: 'password', role: UserRole.Client };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue({} as any);

      const result = await service.createAccount(input);
      expect(result).toEqual({ ok: false, error: "Il y a déjà un utilisateur pour cette adresse e-mail" });
    });
  });

  describe('login', () => {
    it('should return a token on successful login', async () => {
      const input: LoginInput = { email: 'test@test.com', password: 'password' };
      const user = { id: 1, password: 'hashed-password', checkPassword: jest.fn().mockResolvedValue(true) };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('jwt-token');

      const result = await service.login(input);
      expect(result).toEqual({ ok: true, token: 'jwt-token' });
    });

    it('should return an error if login fails', async () => {
      const input: LoginInput = { email: 'test@test.com', password: 'password' };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.login(input);
      expect(result).toEqual({ ok: false, error: "Utilisateur non trouvé pour cette adresse email test@test.com" });
    });
  });

  describe('editProfile', () => {
    it('should edit the user profile successfully', async () => {
      const input: EditProfileInput = { email: 'new@test.com', password: 'newpassword' };
      const user = { id: 1, email: 'old@test.com', password: 'oldpassword', hashPassword: jest.fn().mockResolvedValue(undefined) };
      jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValue(user as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue({ ...user, ...input } as any);
      jest.spyOn(verificationRepository, 'save').mockResolvedValue({ code: 'verification-code', user } as any);
      jest.spyOn(mailService, 'sendVerificationEmail').mockResolvedValue(undefined);

      const result = await service.editProfile(1, input);
      expect(result).toEqual({ ok: true });
    });

    it('should handle errors when editing profile', async () => {
      const input: EditProfileInput = { email: 'new@test.com', password: 'newpassword' };
      jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValue(new Error());

      const result = await service.editProfile(1, input);
      expect(result).toEqual({ ok: false, error: "Le profil n'a pas été modifié" });
    });
  });

  describe('findById', () => {
    it('should return the user profile by ID', async () => {
      const user = { id: 1, email: 'test@test.com' };
      jest.spyOn(userRepository, 'findOneOrFail').mockResolvedValue(user as any);

      const result = await service.findById(1);
      expect(result).toEqual({ ok: true, user });
    });

    it('should handle user not found', async () => {
      jest.spyOn(userRepository, 'findOneOrFail').mockRejectedValue(new NotFoundException());

      const result = await service.findById(1);
      expect(result).toEqual({ ok: false, error: "Utilisateur non trouvé" });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const code = 'verification-code';
      const user = { id: 1, verified: false };
      const verification = { code, user };
      jest.spyOn(verificationRepository, 'findOne').mockResolvedValue(verification as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue({ ...user, verified: true } as any);
      jest.spyOn(verificationRepository, 'delete').mockResolvedValue(undefined);

      const result = await service.verifyEmail(code);
      expect(result).toEqual({ ok: true });
    });

    it('should handle errors during email verification', async () => {
      const code = 'verification-code';
      jest.spyOn(verificationRepository, 'findOne').mockResolvedValue(null);

      const result = await service.verifyEmail(code);
      expect(result).toEqual({ ok: false, error: "Vérification non trouvée" });
    });
  });
});
