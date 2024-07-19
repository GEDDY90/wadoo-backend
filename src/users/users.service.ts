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

    async createAccount({ email, password, role }: CreateAccountInput): Promise<CreateAccountOutput> {
        try {
            // Vérifie si l'utilisateur existe déjà
            const exists = await this.users.findOne({ where: { email } });
            if (exists) {
                return { ok: false, error: "Il y a déjà un utilisateur pour cette adresse e-mail" };
            }
    
            // Crée un nouvel utilisateur
            const user = await this.users.save(this.users.create({ email, password, role }));
    
            // Crée une vérification pour l'utilisateur
            const verification = await this.verifications.save(this.verifications.create({
                user,
            }));
    
            // Envoie un e-mail de vérification
            this.mailService.sendVerificationEmail(user.email, verification.code);
    
            return { ok: true };
        } catch (error) {
            // Gère les erreurs potentielles
            return { ok: false, error: "Le compte n'a pas été créé" };
        }
    }
    
    async login({ email, password }: LoginInput): Promise<LoginOutput> {
        try {
            // Recherche l'utilisateur par e-mail et sélectionne uniquement id et password
            const user = await this.users.findOne({ where: { email }, select: ["id", "password"] });
    
            // Vérifie si l'utilisateur existe
            if (!user) {
                return {
                    ok: false,
                    error: `Utilisateur non trouvé pour cette adresse email ${email}`,
                };
            }
    
            // Vérifie si le mot de passe est correct
            const passwordCorrect = await user.checkPassword(password);
            if (!passwordCorrect) {
                return {
                    ok: false,
                    error: "Mot de passe incorrect",
                };
            }
    
            // Si tout est bon, génère un token JWT
            const token = this.jwtService.sign(user.id);
            return {
                ok: true,
                token,
            };
        } catch (error) {
            // Gère les erreurs potentielles
            return {
                ok: false,
                error: "Vous ne pouvez pas vous connecter",
            };
        }
    }
    
    async findById(id: number): Promise<UserProfileOutput> {
        try {
            // Recherche un utilisateur par ID
            const user = await this.users.findOneOrFail({ where: { id } });
            return {
                ok: true,
                user,
            };
        } catch (error) {
            // Gère les erreurs potentielles si l'utilisateur n'est pas trouvé
            return { ok: false, error: "Utilisateur non trouvé" };
        }
    }
    
    async editProfile(id: number, { email, password }: EditProfileIntput): Promise<EditProfileOutput> {
        try {
            // Recherche l'utilisateur à modifier
            const user = await this.users.findOne({ where: { id } });
            if (!user) {
                return { ok: false, error: "Utilisateur non trouvé" };
            }
    
            // Met à jour l'e-mail si fourni, et marque comme non vérifié
            if (email) {
                user.email = email;
                user.verified = false;
    
                // Supprime les anciennes vérifications liées à l'utilisateur
                await this.verifications.delete({ user: { id: user.id } });
            }
    
            // Enregistre la nouvelle vérification
            const verification = await this.verifications.save(this.verifications.create({ user }));
            this.mailService.sendVerificationEmail(user.email, verification.code);
    
            // Met à jour le mot de passe si fourni
            if (password) {
                user.password = password;
            }
    
            // Enregistre les modifications de l'utilisateur
            await this.users.save(user);
    
            return {
                ok: true,
            };
        } catch (error) {
            // Gère les erreurs potentielles
            return { ok: false, error: "Le profil n'a pas été modifié" };
        }
    }
    
    async verifyEmail(code: string): Promise<VerifyEmailOutput> {
        try {
            // Recherche la vérification par le code, avec relation à l'utilisateur
            const verification = await this.verifications.findOne({ where: { code }, relations: ["user"] });
    
            if (verification) {
                // Marque l'utilisateur comme vérifié
                verification.user.verified = true;
                await this.users.save(verification.user);
    
                // Supprime la vérification utilisée
                await this.verifications.delete(verification.id);
    
                return { ok: true };
            }
    
            return { ok: false, error: "Vérification non trouvée" };
        } catch (error) {
            // Gère les erreurs potentielles
            return { ok: false, error: "Le mail n'est pas vérifié" };
        }
    }
    
    
} 



        