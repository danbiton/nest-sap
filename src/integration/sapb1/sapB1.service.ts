import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import { DocumentLines } from "./sapb1.types";
import { SapB1Client } from "./sapB1.client";


@Injectable()
export class SapB1Service {
    private baseUrl: string;

    constructor(private readonly httpService: HttpService,
        private configService: ConfigService,
        private readonly sapB1Client: SapB1Client) {
        this.baseUrl = this.configService.get<string>('SAPB1_BASE_URL') || '';
    }

    // and CardName eq '${VENDOR_DUNS}' DocNum eq ${PO_NUMBER} and
    async getPurchaseOrder(): Promise<DocumentLines[]> {
// and CardName eq '${VENDOR_DUNS}'
        try {

            // const PO_NUMBER = 25;
            const PO_NUMBER = 71201859;
            
            // const VENDOR_DUNS = "מתח סוכנויות"
            const VENDOR_DUNS = 'Samsung Electro'
          
            const response$ = await this.httpService.get(`${this.baseUrl}/PurchaseOrders?$filter=DocNum eq ${PO_NUMBER} and contains(CardName, '${VENDOR_DUNS}')`,
            // const response$ = await this.httpService.get(`${this.baseUrl}/PurchaseOrders/$count`,
                // const response$ = await this.httpService.get(`${this.baseUrl}/$metadata`,
                {
                    headers: {
                        Cookie: await this.sapB1Client.getSessionCookie(),
                    }
                })

            const response = await lastValueFrom(response$)
            // const documentLines: DocumentLines[] = response.data.value[0].DocumentLines   
            // console.log("First document line:", documentLines[0]);
            // const filtered =  this.filterOrderByStat(documentLines);
            return response.data;

        }
        catch (error: any) { 
            throw new InternalServerErrorException({
                message: "Purchase order fetch failed",
                details: error.response?.data || error.message,
            });

        }

    }
    filterOrderByStat(documentLines: DocumentLines[]): DocumentLines[] {

        const res = documentLines.filter((line: any) =>
            line.LineStatus === "bost_Close" 
            // (line.PickStatusEx === "dlps_NotPicked" || line.PickStatusEx === "dlps_PartiallyPicked")
        );

        return res

    }


}