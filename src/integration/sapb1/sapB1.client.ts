import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import * as https from "https"
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { lastValueFrom } from "rxjs";
import { ErpBaseClient } from "../erp/erp.base.client";
import { DocumentLines } from "./sapb1.types";


@Injectable()
export class SapB1Client extends ErpBaseClient {
    private baseUrl: string;
    private userName: string;
    private password: string;
    private companyDB: string;

    // private sessionCookie: string | null = null
    // private sessionTimestamp: number;
    // private readonly SESSION_TIMEOUT = 30 * 60 * 1000;

    constructor(private readonly httpService: HttpService,
        private configService: ConfigService,
        ) 
         {
        super();
        this.baseUrl = this.configService.get<string>('SAPB1_BASE_URL') || '';
        this.userName = this.configService.get<string>('USER_NAME') || ' ';
        this.password = this.configService.get<string>('PASSWORD') || '';
        this.companyDB = this.configService.get<string>('COMPANY_DB') || '';

    }
    async getSessionCookie(): Promise<string | null> {
        const currentTime = Date.now();
        if (!this.sessionCookie || (currentTime - this.sessionTimestamp) > this.SESSION_TIMEOUT) {
            this.sessionCookie = await this.login();
            this.sessionTimestamp = currentTime;
            console.log(this.sessionTimestamp)
        }
        return this.sessionCookie;
    }

    async clearSession(){
        this.sessionCookie = null;
        this.sessionTimestamp = 0;
    }

   
    async login(): Promise<string> {
           

        try {
            const config = {
                withCredentials: true,
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                headers: {
                    "User-Agent": "PostmanRuntime/7.32.0",
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            };

            const response$ = await this.httpService.post(`${this.baseUrl}/Login`, {
                UserName: this.userName,
                Password: this.password,
                CompanyDB: this.companyDB,
            }, config);

            console.log(this.baseUrl)

            const response = await lastValueFrom(response$)
            const rawCookies = response.headers["set-cookie"] || [];
            const sessionCookie = rawCookies.find((c) => c.startsWith("B1SESSION="));
            const routeCookie = rawCookies.find((c) => c.startsWith("ROUTEID="));
            const cookies = `${sessionCookie}; ${routeCookie}`;
            this.sessionCookie = cookies;

            console.log("SAP B1 Login successful!");
            console.log("Session Cookies:", cookies);
            console.log("Session Cookies:", response.data);

            return cookies;
            
        }
        catch (error: any) {

            throw new InternalServerErrorException({
                message: "Login to SAP B1 failed",
                details: error.response?.data || error.message,
            });
        }
    }

    async logout(): Promise<string> {
        try {

            const response$ = await this.httpService.post(`${this.baseUrl}/Logout`, null, {
                headers: {
                    Cookie: await this.getSessionCookie(),
                },
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            })


            const response = await lastValueFrom(response$)
            this.clearSession();
            console.log(response.status)
            if(response.status === 204){
                console.log("SAP B1 session logged out successfully");
                return response.statusText

            }
            else{
                throw new Error ("logout Failed")
            }
            

        } catch (error: any) {
            throw new InternalServerErrorException({
                message: "SAP B1 logout failed",
                details: error.response?.data || error.message,
            });
        }
    }

     async getPurchaseOrder(): Promise<DocumentLines[]> {
        
        return []; 
    }

    filterOrderByStat(documentLines: DocumentLines[]): DocumentLines[] {
        
        return documentLines; 
    }

}