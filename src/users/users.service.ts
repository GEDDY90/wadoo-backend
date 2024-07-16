import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { CreateAccountInput, CreateAccountOutput } from "./dtos/create-account.dtos";
import { LoginInput, LoginOutput } from "./dtos/login.tdo";
import { JwtService } from "../jwt/jwt.service";
import { EditProfileIntput, EditProfileOutput } from "./dtos/edit-profile.dto";
import { Verification } from "./entities/verification.entity";
import { VerifyEmailOutput } from "./dtos/verify-email.dto";
import { MailService } from "../mail/mail.service";
import { UserProfileOutput } from "./dtos/user-profile.dto";


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) 
        private readonly users: Repository<User>,
        @InjectRepository(Verification) 
        private readonly verifications: Repository<Verification>,
        private readonly jwtService : JwtService,
        private readonly mailService: MailService,
    ) {}

    async createAccount({email, password, role}: CreateAccountInput): Promise<CreateAccountOutput> {
        try {
            const exists = await this.users.findOne({ where: { email} });
            if (exists) { 
                return { ok: false, error: "Il y a déjà un utilisateur pour cette adresse e-mail"};
            }
            const user = await this.users.save(this.users.create({email, password, role}),);

            const verification = await this.verifications.save(this.verifications.create({
                user,
            }),
        );
        this.mailService.sendVerificationEmail(user.email, verification.code);
            return {ok : true};
        }   catch(e){
            return {ok:false, error: "Le compte n'est pas créer"};
        }
    }

    async login({email, password}: LoginInput) : Promise<LoginOutput>{
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
                    error: "Vous ne pouvez pas vous connecter",
                }
            }
    }

    async findById(id:number): Promise<UserProfileOutput> {
        try {
            const user = await this.users.findOneOrFail({ where : {id} });
            return {
                ok: true,
                user,
            }
        }catch (error){
            return {ok: false, error: "Utilisateur non trouvé"}
        }
    }

    async editProfile(id: number, {email, password} : EditProfileIntput): Promise<EditProfileOutput> {
        try {
            const user = await this.users.findOne({ where : {id} });
            if (email){
                user.email = email;
                user.verified = false;
                }
                const verification = await this.verifications.save(this.verifications.create({user}),     
            );
                this.mailService.sendVerificationEmail(user.email, verification.code);
            if (password) {
                user.password = password;
            }
            await this.users.save(user);
            return {
                ok:true,
            };

        } catch(error) {
            return {ok: false, error: "le profile n'a pas été modifié"}
        }
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
            return {ok: false, error: "Le mail n'est pas vérifié"};
        }
    }
    
} 



        