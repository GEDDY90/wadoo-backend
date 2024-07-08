import axios from 'axios';
import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
    constructor(
        @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions
    ) {
        this.sendMail("testing", 'test');
    }

    async sendMail(subject: string, content: string) {
        const form = new FormData();
        form.append("from", `Excited User <mailgun@${this.options.domain}>`);
        form.append("to", `geddydossou@gmail.com`);
        form.append("subject", subject);
        form.append("text", content);

        try {
            const response = await axios.post(`https://api.mailgun.net/v3/${this.options.domain}/messages`, form, {
                headers: {
                    "Authorization": `Basic ${Buffer.from(`api:${this.options.apiKey}`).toString('base64')}`,
                    ...form.getHeaders(),
                },
            });

            console.log(response.data);
        } catch (error) {
            console.error('Error sending email:', error.response ? error.response.data : error.message);
        }
    }
}
