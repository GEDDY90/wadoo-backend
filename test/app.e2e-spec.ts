import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/entities/user.entity';


const GRAPHQL_ENDPOINT = '/graphql';
const testUser = {
  email: "geddy@dxos.com",
  password: "12345"
}
describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let jwToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });
  describe('createAccount', ()=> {

    /*it("should create account", ()=> {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
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
      }).expect(200)
        .expect(res => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);

        })

    });*/

    it("should fail if account already exist", ()=> {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
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
      }).expect(200)
        .expect(res => {
          expect(res.body.data.createAccount.ok).toBe(false);
          expect(res.body.data.createAccount.error).toBe("Il y a déjà un utilisateur pour cette adresse e-mail");

        })
    })
  });
  
  describe('login', ()=> {
    it("should login with correct credentials", () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
        mutation {
          login(input: {
            email: "${testUser.email}",
            password: "${testUser.password}",
          }) {
            ok
            error
            token
          }
        }`,
      }).expect(200)
      .expect(res=>{
        const {
          body: {
            data:{login},
          },
        } = res;
        expect(login.ok).toBe(true);
        expect(login.error).toBe(null);
        expect(login.token).toEqual(expect.any(String));
        jwToken = login.token;
      })

    });


    it("should not be able to login with wrong credentials", ()=> {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
        query: `
        mutation {
          login(input: {
            email: "${testUser.email}",
            password: "12345688",
          }) {
            ok
            error
            token
          }
        }`,
      }).expect(200)
      .expect(res=>{
        const {
          body: {
            data:{login},
          },
        } = res;
        expect(login.ok).toBe(false);
        expect(login.error).toBe("Mot de passe incorrect");
        expect(login.token).toBe(null);
      })
    })
  });

  describe('editProfile', ()=> {
    beforeAll(async()=>{
      console.log(await usersRepository.find());
    });
    it("should see a user profile", ()=>{

    });

   /* it.todo("should not find user profile", ()=>{

    });*/
  });
  it.todo('me');
  it.todo('userProfile');
  it.todo('verifyEmail');

});
