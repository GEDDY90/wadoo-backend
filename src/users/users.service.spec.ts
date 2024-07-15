import { Test } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Verification } from "./entities/verification.entity";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from 'src/mail/mail.service';
import { Repository } from "typeorm";

const mockRepository = () => ({
    findOne: jest.fn(),
    save: jest.fn().mockResolvedValue(User),
    create: jest.fn(),
    findOneOrFail: jest.fn(),
    delete: jest.fn(),

});

const mockJwtService = ()=> ({
    sign: jest.fn(()=>'signed-token-baby'),
    verify: jest.fn(),
});

const mockMailService = ()=> ({
    sendVerificationEmail: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
    let service: UsersService;
    let mailService: MailService;
    let jwtService: JwtService;
    let usersRepository: MockRepository<User>;
    let verificationsRepository: MockRepository<Verification>; 

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository(),
                },
                {
                    provide: getRepositoryToken(Verification),
                    useValue: mockRepository(),
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService(),
                },
                {
                    provide: MailService,
                    useValue: mockMailService(),
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        mailService = module.get<MailService>(MailService);
        jwtService = module.get<JwtService>(JwtService);
        usersRepository = module.get(getRepositoryToken(User));
        verificationsRepository = module.get(getRepositoryToken(Verification)); // 
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createAccount', () => {

        const createAccountArgs = {
            email: '',
            password: '',
            role: 0,
        };

        it('should fail if user exists', async () => {
            usersRepository.findOne.mockResolvedValue({
                id: 1,
                email: '',
            });

            const result = await service.createAccount(createAccountArgs);

            expect(result).toMatchObject({
                ok: false,
                error: "Il y a déjà un utilisateur pour cette adresse e-mail"
            });
        });

        it("should create a new user", async () => {
            usersRepository.findOne.mockResolvedValue(undefined);
            usersRepository.create.mockReturnValue(createAccountArgs);
            usersRepository.save.mockResolvedValue(createAccountArgs);
            verificationsRepository.create.mockReturnValue(createAccountArgs);
            verificationsRepository.save.mockResolvedValue({
                code: "code",
            });

            const result = await service.createAccount(createAccountArgs);

            expect(usersRepository.create).toHaveBeenCalledTimes(1);
            expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);

            expect(usersRepository.save).toHaveBeenCalledTimes(1);
            expect(usersRepository.save).toHaveBeenCalledWith<[{createAccountArgs}]>;

            expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
            expect(verificationsRepository.create).toHaveBeenCalledWith<[{createAccountArgs}]>;

            expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
            expect(verificationsRepository.save).toHaveBeenCalledWith(createAccountArgs);

            expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
            expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
                createAccountArgs.email,
                expect.any(String),
            );
            expect(result).toEqual({ok:true})
        });

        it('should fail on exception', async()=> {
            usersRepository.findOne.mockRejectedValue(new Error (':)')); 
            const result = await service.createAccount(createAccountArgs);
            expect(result).toEqual({ok: false, error: "Le compte n'est pas créer"});
        })
    });

    describe('login', ()=> {
        const loginArgs = {
            email: 'bg@mailService.com',
            password:'bs.password',
        };

        it("should fail if user does not exist", async()=> {
            usersRepository.findOne.mockResolvedValue(null);
            const result = await service.login(loginArgs);

            expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
            expect(usersRepository.findOne).toHaveBeenCalledWith<[{loginArgs}]>;

            expect(result).toEqual({
                    ok: false,
                    error: (`Utilisateur non trouvé pour cette adresse email ${loginArgs.email}`),
            });

        });

        it("should fail if the password is wrong", async()=> {
            const mockedUser = {
                id:1,
                checkPassword: jest.fn(()=> Promise.resolve(false))
            };
            usersRepository.findOne.mockResolvedValue(mockedUser);
            const result = await service.login(loginArgs);
            expect(result).toEqual({
                ok: false,
                error: "Mot de passe incorrect",
            });
        })

        it("should return token if password's correct", async()=> {
            jwtService;
            const mockedUser = {
                id:1,
                checkPassword: jest.fn(()=> Promise.resolve(true))
            };
            
            usersRepository.findOne.mockResolvedValue(mockedUser);
            const result = await service.login
            (loginArgs);
            console.log(result)
            expect(jwtService.sign).toHaveBeenCalledTimes(1);
            expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
            expect(result).toEqual({ ok: true, token: 'signed-token-baby' })

        })

        it('should fail on exception', async()=> {
            usersRepository.findOne.mockRejectedValue(new Error (':)')); 
            const result = await service.login(loginArgs);
            expect(result).toEqual({ok: false, error: "Vous ne pouvez pas vous connecter"});
        })


    });

    describe('findById', ()=> {
        const findByIdArgs = {
            id:1,
        }
        it('should return find an existing user', async ()=> {
            usersRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
            const result = await service.findById(1);
            expect(result).toEqual({
                ok: true,
                user: findByIdArgs,
            })

        })

        it("should fail if no user is found", async ()=> {
            usersRepository.findOneOrFail.mockRejectedValue (new Error ());
            const result = await service.findById(1);
            expect(result).toEqual({ok: false, error: "Utilisateur non trouvé"})
        })
    });

    describe('editProfile', ()=> {
        it("should change email", async()=> {
            const editProfileArgs = {
                userId: 1,
                input : {email : "bg@new.com"},
            }
            const oldUser = {
                email : "bg@old.com",
                verified: true,
            };
            const newverification = {
                code: "code",
            } 
            const newUser = {
                verified : false,
                email: editProfileArgs.input.email,
            }
            usersRepository.findOne.mockResolvedValue(oldUser);
            usersRepository.create.mockReturnValue(newverification);
            verificationsRepository.save.mockResolvedValue(newverification);

            await service.editProfile(editProfileArgs.userId, editProfileArgs.input);

            expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
            expect(usersRepository.findOne).toHaveBeenCalledWith<[{editProfileArgs:{userId}}]>;
            
            expect(verificationsRepository.create).toHaveBeenCalledWith({user: oldUser});
            expect(verificationsRepository.save).toHaveBeenCalledWith<[{user:{newUser}}]>;

            expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
                newUser.email,
                newverification.code,
            )

        })

        it("should change password", async () => {
            const editProfileArgs = {
                userId: 1,
                input: { password: 'new.password' },
            };
        
            const oldUser = {
                password: "old", // Mot de passe initial
            };
        
            usersRepository.findOne.mockResolvedValue(oldUser); // Simule le retour de findOne
        
            const result = await service.editProfile(editProfileArgs.userId, editProfileArgs.input); // Appelle la méthode
        
            // Vérifie que save a été appelé une fois
            expect(usersRepository.save).toHaveBeenCalledTimes(1);
        
            // Vérifie que save a été appelé avec l'utilisateur mis à jour
            expect(usersRepository.save).toHaveBeenCalledWith(expect.objectContaining({ password: "new.password" }));
        
            // Vérifie le résultat
            expect(result).toEqual({ ok: true });
        });
        
        

        it("should fail on exception", async ()=> {
            usersRepository.findOne.mockRejectedValue(new Error());
            const result = await service.editProfile(1, {email:'12'});
            expect(result).toEqual({ok: false, error: "le profile n'a pas été modifié"});
        })
    });

    describe('verifyEmail', ()=> {
        it("should verify email", async ()=> {
            const mockedverification = {
                user : {
                    verified: true,
                },
                id: 1,
            }
            verificationsRepository.findOne.mockResolvedValue(mockedverification);
            const result = await service.verifyEmail("verification-code");

            expect(verificationsRepository.findOne).toHaveBeenCalledTimes(1);


            expect(verificationsRepository.findOne).toHaveBeenCalledWith(
                {"relations": ["user"], 
                "where": {"code": "verification-code"}}
             );
             expect(usersRepository.save).toHaveBeenCalledTimes(1);
             expect(usersRepository.save).toHaveBeenCalledWith({
                ...mockedverification.user,verified:true});
             expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);
             expect(verificationsRepository.delete).toHaveBeenCalledWith(mockedverification.id);
             expect(result).toEqual({ok:true});

        })

        it("should fail on verification not found", async()=> {
            verificationsRepository.findOne.mockResolvedValue(undefined);
            const result = await service.verifyEmail("");
            expect(result).toEqual({ok: false, error: "Vérification non trouvé"});
        })
        
        it("should fail on exception", async()=> {
            verificationsRepository.findOne.mockRejectedValue(new Error());
            const result = await service.verifyEmail("");
            expect(result).toEqual({ok: false, error: "Le mail n'est pas vérifié"} );
        })

    });
});
