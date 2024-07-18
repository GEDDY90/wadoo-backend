import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';
import { Verification } from '../src/users/entities/verification.entity';
import { query } from 'express';

const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
  email: 'nicol@nex.com',
  password: "12345"
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationsRepository: Repository<Verification>;
  let jwToken: string;


  const baseTest = ()=> request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({query});
  const privateTest =(query:string)=>
    baseTest()
      .set('X-JWT', jwToken)
      .send({query});
  
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationsRepository = module.get<Repository<Verification>>(getRepositoryToken(Verification));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createAccount', () => {

    it("should create account", () => {
      return publicTest( `
        mutation {
          createAccount(input: {
            email: "${testUser.email}",
            password: "${testUser.password}",
            role: Owner
          }) {
            ok
            error
          }
        }`,
      ).expect(200)
        .expect(res => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it("should fail if account already exists", () => {
      return publicTest( `
        mutation {
          createAccount(input: {
            email: "${testUser.email}",
            password: "${testUser.password}",
            role: Owner
          }) {
            ok
            error
          }
        }`,
      ).expect(200)
        .expect(res => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toBe("Il y a déjà un utilisateur pour cette adresse e-mail");
        });
    });
  });
  
  describe('login', () => {
    it("should login with correct credentials", () => {
      return publicTest( `
        mutation {
          login(input: {
            email: "${testUser.email}",
            password: "${testUser.password}"
          }) {
            ok
            error
            token
          }
        }`,
      ).expect(200)
      .expect(res => {
        const {
          body: {
            data: { login },
          },
        } = res;
        expect(login.ok).toBe(true);
        expect(login.error).toBe(null);
        expect(login.token).toEqual(expect.any(String));
        jwToken = login.token;
      });
    });

    it("should not be able to login with wrong credentials", () => {
      return publicTest(`
        mutation {
          login(input: {
            email: "${testUser.email}",
            password: "wrongpassword"
          }) {
            ok
            error
            token
          }
        }`,
      ).expect(200)
      .expect(res => {
        const {
          body: {
            data: { login },
          },
        } = res;
        expect(login.ok).toBe(false);
        expect(login.error).toBe("Mot de passe incorrect");
        expect(login.token).toBe(null);
      });
    });
  });

  describe('userProfile', () => {
    let userId: number;

    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    it("should see a user profile", () => {
      return privateTest( `
          {
            userProfile(userId: ${userId}) {
              ok
              error
              user {
                id
              }
            }
          }`,
        )
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;

          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it("should not find user profile with invalid ID", () => {
      return privateTest(`
          {
            userProfile(userId: "invalid_id") {
              ok
              error
              user {
                id
              }
            }
          }`,
        )
        .expect(400)
        .expect(res => {
          expect(res.body.errors).toBeDefined();
        });
    });
  });

  describe('me', () => {
    it('should find my profile', () => {
      return privateTest( `{
            me {
              email
            }
          }`
        )
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(testUser.email);
        });
    });

    it('should not allow logged out user', () => {
      return publicTest( `{
            me {
              email
            }
          }`
        )
        .expect(200)
        .expect(res => {
          const { body: { errors } } = res;
          expect(errors).toBeDefined();
        });
    });
  });
  
  describe('editProfile', () => {
    const NEW_EMAIL = 'nicoool@nex.com';
    
    it('should change email', async () => {
      privateTest (`
          mutation {
            editProfile(input: {
              email: "${NEW_EMAIL}"
            }) {
              ok
              error
            }
          }`,
        )
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editProfile: { ok, error},
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should have a new email', async () => {
      privateTest( `{
            me {
              email
            }
          }`,
        )
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email},
              },
            },
          } = res;
          expect(email).toBe(NEW_EMAIL);
        });
    });
  });
    
  describe('verifyEmail', () => {
    let verificationCode: string;

    beforeAll(async () => {
      const [verification] = await verificationsRepository.find();
      verificationCode = verification.code;
    });

    it('should verify email', () => {
      return privateTest(`mutation {
            verifyEmail(input: { code: "${verificationCode}" }) {
              ok
              error
            }
          }`
        )
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should fail on wrong verification code', () => {
      return privateTest(`mutation {
            verifyEmail(input: { code: "wrong_code" }) {
              ok
              error
            }
          }`
        )
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe("Vérification non trouvé");
        });
    });
  });
});
