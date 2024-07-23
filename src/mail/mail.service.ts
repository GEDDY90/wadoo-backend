import axios from 'axios';
import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
    constructor(
        @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions
    ) {}

    // Méthode pour envoyer un email avec Mailgun
    async sendMail(
        subject: string,
        template: string,
        emailVars: EmailVar[]
    ): Promise<boolean> {
        // Création d'un objet FormData pour construire les données du formulaire
        const form = new FormData();

        // Définition des champs du formulaire
        form.append("from", `Le CEO de Wadoo <mailgun@${this.options.domain}>`);
        form.append("to", `geddydossou@gmail.com`);
        form.append("subject", subject);
        form.append("template", template);

        // Ajout des variables de substitution au formulaire avec préfixe 'v:'
        emailVars.forEach(eVar => {
            form.append(`v:${eVar.key}`, eVar.value);
        });

        try {
            // Envoi de la requête POST à l'API Mailgun pour envoyer l'email
            const response = await axios.post(
                `https://api.mailgun.net/v3/${this.options.domain}/messages`, // URL de l'API Mailgun
                form, // Données du formulaire
                {
                    auth: {
                        username: 'api',
                        password: this.options.apiKey // Utilisation de l'API key pour l'authentification
                    },
                    headers: {
                        ...form.getHeaders() // Ajout des en-têtes nécessaires pour le type de contenu multipart
                    }
                }
            );

            // Vérification du statut de la réponse si nécessaire
            if (response.status === 200) {
                return true; // Succès : retourne vrai
            } else {
                return false; // Échec : retourne faux
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi de l'email :", error); // Log de l'erreur en cas d'échec
            return false; // Retourne faux en cas d'erreur
        }
    }

    // Méthode pour envoyer un email de vérification
    async sendVerificationEmail(email: string, code: string): Promise<boolean> {
        try {
            // Appel de la méthode sendMail pour envoyer l'email de vérification
            const result = await this.sendMail("Vérifiez Votre Email", "verify-email", [
                { key: 'code', value: code },
                { key: 'username', value: email },
            ]);
            return result; // Retourne le résultat de l'envoi de l'email
        } catch (error) {
            console.error("Erreur lors de l'envoi de l'email de vérification :", error); // Log de l'erreur en cas d'échec
            return false; // Retourne faux en cas d'erreur
        }
    }
}
