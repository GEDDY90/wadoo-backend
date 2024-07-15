import { Test } from "@nestjs/testing";
import { MailService } from "./mail.service"
import { CONFIG_OPTIONS } from "src/common/common.constants";
import axios from "axios";
const FormData = require('form-data');


global.FormData = FormData;
jest.mock('axios');


describe("MailService", ()=> {
    let service : MailService;
    const TEST_DOMAIN = "test-domain"
    beforeEach(async()=> {
        jest.clearAllMocks(); // Réinitialiser les espions avant chaque test
        const module = await Test.createTestingModule({
            providers: [MailService, {
                provide: CONFIG_OPTIONS,
                useValue: {
                    apiKey :"test-apiKey",
                    domain : TEST_DOMAIN,
                    fromEmail : "test-fromEmail",
                }
            }],
        }).compile();
        service = module.get<MailService>(MailService);
    })

    it("should be defined", ()=>{
        expect(service).toBeDefined();
    });

    describe("sendVerificationEmail", ()=> {
        it("should call sendMail", ()=> {
            const sendVerificationEmailrgs = {
                email: 'email',
                code: 'code',
            };
            jest.spyOn(service, "sendMail").getMockImplementation()
            service.sendVerificationEmail(
                sendVerificationEmailrgs.email,
                sendVerificationEmailrgs.code
            );
            expect(service.sendMail).toHaveBeenCalledTimes(1);
            expect(service.sendMail).toHaveBeenCalledWith(
                "Vérifiez Votre Email",
                 "verify-email", 
                [
                {key: 'code', value: sendVerificationEmailrgs.code},
                {key: 'username', value: sendVerificationEmailrgs.email}
                ]
            );
        })

    })

    describe("sendMail", ()=> {
        it("devrait envoyer un mail", async () => {
    const formSpy = jest.spyOn(FormData.prototype, "append");
    jest.mock('axios');

    const ok = await service.sendMail('Sujet Test', 'templateTest', [{ key: 'name', value: 'John Doe' }]);

    expect(formSpy).toHaveBeenCalled(); // Vérifiez si append a été appelé
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
        `https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`,
        expect.any(FormData), // Validation de FormData
        expect.objectContaining({
            headers: expect.objectContaining({
                Authorization: expect.any(String),
                'content-type': expect.stringContaining('multipart/form-data'),
            }),
        })
    );
    expect(ok).toEqual(true);
});


        it("fails on error", async()=> {
            jest.spyOn(axios, 'post').mockImplementation(()=>{
                throw new Error();
            });

            const ok = await service.sendMail('','',[]);
            expect(ok).toEqual(false);
        })

    });

    
})