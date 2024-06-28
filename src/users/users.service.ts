import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as jwt from "jsonwebtoken";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { CreateAccountInput } from "./dtos/create-account.dtos";
import { LoginInput } from "./dtos/login.tdo";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly users: Repository<User>,
        private readonly config: ConfigService,
        private readonly jwtService : JwtService,
    ) {
        this.jwtService.hello();
    }

    async createAccount({email, password, role}: CreateAccountInput): Promise<{ ok: boolean, error?: string}> {
        try {
            const exists = await this.users.findOne({ where: { email} });
            if (exists) { 
                return { ok: false, error: "Il y a déjà un utilisateur pour cet e-mail"};
            }
            await this.users.save(this.users.create({email, password, role}));
            return {ok : true};
        }   catch(e){
            return {ok:false, error: "Le compte n'est pas créer"};
        }
    }
    async login({email, password}: LoginInput) : Promise<{ ok: boolean, error?: string; token?: string}>{
        try{
            //trouver email      
            const user = await this.users.findOne({where: {email}});
            if (!user) {
                return {
                    ok: false,
                    error: "Utilisateur non trouvé pour cet e-mail.",
                };
            }
            //vérifier le pass
            const passwordCorrect = await user.checkPassword(password);
            if (!passwordCorrect) {
                return {
                    ok: false,
                    error: "Mot de passe incorrect",
                };
            }
            //fournir son cookies
            const token = jwt.sign({id:user.id}, 
            this.config.get('SECRET_KEY'))
            return {
                ok: true,
                token,
            }
            }catch(error){
                return {
                    ok: false,
                    error,
                }
            }
    }
} 



        