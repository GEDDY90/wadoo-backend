import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from '../jwt/jwt.service';
import { MailService } from '../mail/mail.service';
import { CreateAccountInput } from './dtos/create-account.dtos';

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
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Verification),
          useClass: Repository,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'signed-token'),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(getRepositoryToken(Verification));
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailService>(MailService);
  });

  describe('createAccount', () => {
    it('should successfully create a new account', async () => {
      const createAccountInput: CreateAccountInput = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.Client,
      };

      const newUser = new User();
      newUser.email = createAccountInput.email;
      newUser.password = createAccountInput.password;
      newUser.role = createAccountInput.role;

      const verification = new Verification();
      verification.code = 'verificationCode';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(newUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(newUser);
      jest.spyOn(verificationRepository, 'create').mockReturnValue(verification);
      jest.spyOn(verificationRepository, 'save').mockResolvedValue(verification);

      const result = await service.createAccount(createAccountInput);
      expect(result).toEqual({ ok: true });
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(newUser.email, verification.code);
    });

    it('should fail if user already exists', async () => {
      const createAccountInput: CreateAccountInput = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.Client,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(new User());

      const result = await service.createAccount(createAccountInput);
      expect(result).toEqual({ ok: false, error: "Il y a déjà un utilisateur pour cette adresse e-mail" });
    });
  });

  describe('login', () => {
    it('should successfully login and return a JWT token', async () => {
      const loginInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = new User();
      user.id = 1;
      user.password = 'hashedPassword';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(user, 'checkPassword').mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('jwtToken');

      const result = await service.login(loginInput);
      expect(result).toEqual({ ok: true, token: 'jwtToken' });
    });

    it('should fail if user is not found', async () => {
      const loginInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.login(loginInput);
      expect(result).toEqual({ ok: false, error: `Utilisateur non trouvé pour cette adresse email ${loginInput.email}` });
    });

    it('should fail if password is incorrect', async () => {
      const loginInput = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = new User();
      user.id = 1;
      user.password = 'hashedPassword';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest.spyOn(user, 'checkPassword').mockResolvedValue(false);

      const result = await service.login(loginInput);
      expect(result).toEqual({ ok: false, error: "Mot de passe incorrect" });
    });
  });
});
