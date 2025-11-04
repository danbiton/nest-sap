import { DocumentLines } from "../sapb1/sapb1.types";

export interface IErpClient {
    login(): Promise<string>;
    logout(): Promise<string>;
    getPurchaseOrder(): Promise<DocumentLines[]>;
    filterOrderByStat(documentLines: DocumentLines[]): DocumentLines[];
}
