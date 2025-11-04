import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { Client } from "@microsoft/microsoft-graph-client"
import { ClientSecretCredential } from '@azure/identity';
import { OpportunityResponse } from './interface.res';
import axios from 'axios';

@Injectable()
export class GraphService {
    private readonly logger = new Logger(GraphService.name);
    private readonly userEmail: string;
    private graphClient: Client;
    constructor() {
        this.userEmail = process.env.USER_EMAIL || ''
    }

    async onModuleInit() {
        console.log('Initializing Graph and creating subscription...');
        await this.initGraphClient();
        await this.createSubscription();
    }
    async initGraphClient() {
        const tenantId = process.env.AZURE_TENANT_ID;
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        if (!tenantId || !clientId || !clientSecret) {
            throw new Error('Azure credentials are not defined in environment variables!');
        }
        const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        this.graphClient = Client.init({
            authProvider: async (done) => {
                try {
                    const token = await credential.getToken('https://graph.microsoft.com/.default');
                    done(null, token.token);
                } catch (err) {
                    done(err, null);
                }
            }
        })
    }

    async getAllEmails() {

        try {
            await this.initGraphClient();
            if (this.graphClient) {
                const response = await this.graphClient
                    .api(`/users/${this.userEmail}/mailFolders/SentItems/messages`)
                    .get();
                return response.value;
            }
        } catch (err) {
            console.warn('Graph API not available, using mock messages', err);
        }


    }
    async findOrderEmails() {
        const emails = await this.getAllEmails();
        this.logger.log("take the emails from the box folder")

        if (!emails?.length) {
            this.logger.log("No emails found");
            return [];
        }

        return emails.filter((email: any) =>
            email.subject.toLowerCase().includes('order'),
        );
    }

    async getOpportunitiesSap(): Promise<any[]> {
        this.logger.log("opportuniteis from sap")

        const username = process.env.USER;
        const password = process.env.PASSWORD_SAP;

        if (!username || !password) {
            throw new Error('SAP credentials are not defined!');
        }
        const url = "https://my1001209.de1.demo.crm.cloud.sap/sap/c4c/api/v1/opportunity-service/opportunities?$filter=salesPhase eq '001'"
        const res = await axios.get<OpportunityResponse>(url,
            {
                auth: { username, password }
            }
        )
        const listOfOpportunities = res.data.value
        const filtered = await this.updateSalesPhase(listOfOpportunities)
        return filtered;



    }
    extractBrandAndClient(emailResults: any[]): { client: string, brand: string } {
        this.logger.log("extract email")
        const subject: string = emailResults[0].subject;
        this.logger.log("subject", subject)
        const dashIndex = subject.indexOf('-');
        if (dashIndex === -1) {
            throw new Error('No dash found in subject');
        }
        const brand = subject.split(' ')[0];
        const client = subject.slice(dashIndex + 1).trim();
        return { brand, client };
    }

    async updateSalesPhase(opportunities: any[]): Promise<any[]> {
        this.logger.log("take list from sap that equal to brand and customer name from email")
        const emailResults = await this.findOrderEmails();
        const { client, brand } = this.extractBrandAndClient(emailResults);
        this.logger.log('Client:', client);
        this.logger.log("Brand:", brand)
        // console.log('Brand:', brand);

        // opportunities.forEach(opp => {
        //     console.log('opp.account.description:', opp.account?.description);
        //     console.log('opp.categoryDescription:', opp.categoryDescription);
        // });

        // const client = "מגדל חברה לביטוח";
        // const brand = "Z100";

        // console.log(opportunities)
        const filtered = opportunities.filter(
            (opp) =>
                opp.account?.description?.includes(client) &&
                opp.categoryDescription?.includes(brand)
        );
        this.logger.log("filtered:", filtered)
        // console.log(filtered)

        if (filtered.length > 0) {
            console.log(` Found ${filtered.length} matching opportunities`);
            const update = await this.patchSalesPhase(filtered);
            return update
        } else {
            console.log(" No opportunities found for this client and brand");
        }
        return filtered


    }

    async patchSalesPhase(filtered: any[]) {
        this.logger.log("patch the sales phase in sap sales cloud")
        const username = process.env.USER!;
        const password = process.env.PASSWORD_SAP!;
        const baseUrl =
            "https://my1001209.de1.demo.crm.cloud.sap/sap/c4c/api/v1/opportunity-service/opportunities";

        const updatedOpportunities: any[] = [];
        try {
            for (const obj of filtered) {

                const getRes = await axios.get(`${baseUrl}/${obj.id}`, {
                    auth: { username, password },
                });

                const etag = getRes.headers["etag"];
                console.log(`ETag for ${obj.id}:`, etag);

                if (!etag) {
                    throw new Error("ETag not found for this opportunity.");
                }

                // שלב 2 – PATCH לעדכון של השדה salesPhase
                const patchBody = { salesPhase: "002" };

                const patchRes = await axios.patch(`${baseUrl}/${obj.id}`, patchBody, {
                    auth: { username, password },
                    headers: {
                        "If-Match": etag,
                        "Content-Type": "application/json",
                    },
                });

                console.log(
                    `Sales Phase for opportunity ${obj.id} updated successfully (status: ${patchRes.status})`
                );
                const updatedRes = await axios.get(`${baseUrl}/${obj.id}`, {
                    auth: { username, password },
                });

                updatedOpportunities.push(updatedRes.data);

            }
            return updatedOpportunities;
        } catch (error: any) {
            console.error(" Failed to update opportunities:", error.message);
            throw new Error(
                JSON.stringify({
                    message: "Updating salesPhase failed",
                    details: error.response?.data || error.message,
                })
            );
        }
    }
    async getMessageById(messageId: string) {
        await this.initGraphClient();
        const response = await this.graphClient
            .api(`/users/${this.userEmail}/messages/${messageId}`)
            .get();
        return response;
    }
    async createSubscription() {
        try {
            const subscription = {
                changeType: 'created',
                notificationUrl: 'https://nest-sap.onrender.com/webhook',
                resource: `/users/${this.userEmail}/mailFolders/SentItem//messages`,
                expirationDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                clientState: 'secretClientValue',
            };

            const response = await this.graphClient.api('/subscriptions').post(subscription);
            this.logger.log(` Subscription created: ${response.id}`);
            return response;
        } catch (error) {
            this.logger.error(' Error creating subscription', error);
            throw error;
        }
    }




}