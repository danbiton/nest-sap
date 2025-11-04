import { DocumentLines } from "../sapb1/sapb1.types";
import { IErpClient } from "./erp.interface";

export abstract class ErpBaseClient implements IErpClient{
    abstract login(): Promise<string>;
    abstract logout(): Promise<string>;
    abstract getPurchaseOrder(): Promise<DocumentLines[]>;
    abstract filterOrderByStat(documentLines: DocumentLines[]): DocumentLines[];

    protected sessionCookie: string | null = null
    protected sessionTimestamp: number;
    protected readonly SESSION_TIMEOUT = 30 * 60 * 1000;
        
    
}