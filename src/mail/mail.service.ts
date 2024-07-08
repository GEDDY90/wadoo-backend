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

    private async sendMail(
        subject: string,
        template: string, 
        emailVars: EmailVar[]) {
        const form = new FormData();
        form.append("from", `Le CEO de Wadoo <mailgun@${this.options.domain}>`);
        form.append("to", `geddydossou@gmail.com`);
        form.append("subject", subject);
        form.append("template", template);
        emailVars.forEach(eVar => form.append(`${eVar.key}`, eVar.value));

        try {
            await axios.post(`https://api.mailgun.net/v3/${this.options.domain}/messages`, form, {
                headers: {
                    "Authorization": `Basic ${Buffer.from(`api:${this.options.apiKey}`).toString('base64')}`,
                    ...form.getHeaders(),
                },
            });

        } catch (error) {
            console.error('Error sending email:', error.response ? error.response.data : error.message);
        }
    }

    sendVerificationEmail(email: string, code: string){
        this.sendMail("Vérifiez Votre Email", "verify-email", [
            {key: 'code', value: code},
            {key: 'username', value: email},
        ])

    }
}
