import { Injectable, NotFoundException } from "@nestjs/common";
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
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(Verification) private readonly verifications: Repository<Verification>,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
    ) {}

    // Méthode pour créer un compte utilisateur
    async createAccount({ email, password, role }: CreateAccountInput): Promise<CreateAccountOutput> {
        try {
            // Vérifie si l'utilisateur existe déjà
            const exists = await this.users.findOne({ where: { email } });
            if (exists) {
                return { ok: false, error: "Il y a déjà un utilisateur pour cette adresse e-mail" };
            }

            // Crée un nouvel utilisateur avec le mot de passe hashé
            const newUser = this.users.create({ email, password, role });
            const user = await this.users.save(newUser);

            // Crée une vérification pour l'utilisateur
            const verification = await this.verifications.save(this.verifications.create({ user }));

            // Envoie un e-mail de vérification
            this.mailService.sendVerificationEmail(user.email, verification.code);

            return { ok: true };
        } catch (error) {
            // Gère les erreurs potentielles
            return { ok: false, error: "Le compte n'a pas été créé" };
        }
    }

    // Méthode pour connecter un utilisateur
    async login({ email, password }: LoginInput): Promise<LoginOutput> {
        try {
            // Recherche l'utilisateur par e-mail avec le mot de passe sélectionné
            const user = await this.users.findOne({ where: { email }, select: ["id", "password"] });
            if (!user) {
                return { ok: false, error: `Utilisateur non trouvé pour cette adresse email ${email}` };
            }

            // Vérifie si le mot de passe est correct en utilisant la méthode `checkPassword` de l'entité User
            const passwordCorrect = await user.checkPassword(password);
            if (!passwordCorrect) {
                return { ok: false, error: "Mot de passe incorrect" };
            }

            // Si tout est bon, génère un token JWT
            const token = this.jwtService.sign(user.id);
            return { ok: true, token };
        } catch (error) {
            // Gère les erreurs potentielles
            return { ok: false, error: "Vous ne pouvez pas vous connecter" };
        }
    }

    // Méthode pour modifier le profil utilisateur
    async editProfile(id: number, { email, password }: EditProfileIntput): Promise<EditProfileOutput> {
        try {
            // Recherche l'utilisateur à modifier
            const user = await this.users.findOneOrFail({where:{id}});
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

            // Met à jour le mot de passe si fourni, et re-hash le mot de passe avant sauvegarde
            if (password) {
                user.password = password;
                await user.hashPassword(); // Re-hash du mot de passe avant sauvegarde
            }

            // Enregistre l'utilisateur modifié
            await this.users.save(user);

            // Crée une nouvelle vérification pour l'e-mail modifié
            const verification = await this.verifications.save(this.verifications.create({ user }));
            this.mailService.sendVerificationEmail(user.email, verification.code);

            return { ok: true };
        } catch (error) {
            // Gère les erreurs potentielles
            return { ok: false, error: "Le profil n'a pas été modifié" };
        }
    }

    // Méthode pour trouver un utilisateur par ID
    async findById(id: number): Promise<UserProfileOutput> {
        try {
            // Recherche un utilisateur par ID ou lance une exception si non trouvé
            const user = await this.users.findOneOrFail({where:{id}});
            return { ok: true, user };
        } catch (error) {
            // Gère les erreurs potentielles si l'utilisateur n'est pas trouvé
            if (error instanceof NotFoundException) {
                return { ok: false, error: "Utilisateur non trouvé" };
            }
            return { ok: false, error: "Une erreur s'est produite" };
        }
    }

    // Méthode pour vérifier l'e-mail d'un utilisateur
    async verifyEmail(code: string): Promise<VerifyEmailOutput> {
        try {
            // Recherche la vérification par le code avec relation à l'utilisateur
            const verification = await this.verifications.findOne({ where: { code }, relations: ["user"] });
            if (!verification) {
                return { ok: false, error: "Vérification non trouvée" };
            }

            // Marque l'utilisateur comme vérifié
            verification.user.verified = true;
            await this.users.save(verification.user);

            // Supprime la vérification utilisée
            await this.verifications.delete(verification.id);

            return { ok: true };
        } catch (error) {
            // Gère les erreurs potentielles
            return { ok: false, error: "Le mail n'est pas vérifié" };
        }
    }
}
