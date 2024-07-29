import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { JwtService } from "./jwt.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class JwtMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UsersService
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        if ("x-jwt" in req.headers) {
            const token = req.headers['x-jwt'];

            try {
                const decoded = this.jwtService.
                verify(token.toString());

                if (typeof decoded === 'object' 
                    && decoded.hasOwnProperty('id')) {
                    const { user } = await this.userService.
                    findById(decoded["id"]);
                    req['user'] = user; // Ajoute l'utilisateur à la requête
                }
            } catch (error) {
                console.error("Erreur lors de la vérification du token :", error.message);
                // Vous pouvez choisir de gérer l'erreur ici (par exemple, envoyer une réponse d'erreur) ou simplement la loguer
            }
        }

        next(); // Passe au middleware suivant
    }
}
