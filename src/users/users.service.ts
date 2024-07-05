import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { CreateAccountInput } from "./dtos/create-account.dtos";
import { LoginInput } from "./dtos/login.tdo";
import { JwtService } from "src/jwt/jwt.service";
import { EditProfileIntput } from "./dtos/edit-profile.dto";
import { Verification } from "./entities/verification.entity";
import { VerifyEmailOutput } from "./dtos/verify-email.dto";
import { UserProfileOuput } from "./dtos/user-profile.dto";


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) 
        private readonly users: Repository<User>,
        @InjectRepository(Verification) 
        private readonly verifications: Repository<Verification>,
        private readonly jwtService : JwtService,
    ) {}

    async createAccount({email, password, role}: CreateAccountInput): Promise<{ ok: boolean, error?: string}> {
        try {
            const exists = await this.users.findOne({ where: { email} });
            if (exists) { 
                return { ok: false, error: "Il y a déjà un utilisateur pour cette adresse e-mail"};
            }
            const user = await this.users.save(this.users.create({email, password, role}));
            await this.verifications.save(this.verifications.create({
                user
            }))
            return {ok : true};
        }   catch(e){
            return {ok:false, error: "Le compte n'est pas créer"};
        }
    }
    async login({email, password}: LoginInput) : Promise<{ ok: boolean, error?: string; token?: string}>{
        try{
            //trouver email      
            const user = await this.users.findOne({where: {email}, select: ["id", "password"]});
            if (!user) {
                return {
                    ok: false,
                    error: (`Utilisateur non trouvé pour cette adresse email ${email}`),
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
            const token = this.jwtService.sign(user.id);
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

    async findById(id:number): Promise<User> {
        return this.users.findOne({ where : {id} })
    }

    async editProfile(id: number, {email, password} : EditProfileIntput): Promise<User> {
        const user = await this.users.findOne({ where : {id} });
        if (email){
            user.email = email;
            user.verified = false;
            await this.verifications.save(this.verifications.create({user}));
        }
        if (password) {
            user.password = password;
        }
        console.log(EditProfileIntput)
        return this.users.save(user);

    }

    async verifyEmail(code: string): Promise<VerifyEmailOutput> {
        try{
            const verification = await this.verifications.findOne(
                { where: {code},
                 relations: ["user"]});
            if(verification){
            verification.user.verified = true;
            await this.users.save(verification.user);
            await this.verifications.delete(verification.id);
            return {ok: true};
            }
            return {ok: false, error: "Vérification non trouvé"}

        }catch(error){
            return {ok: false, error};
        }
    }
    
} 



        