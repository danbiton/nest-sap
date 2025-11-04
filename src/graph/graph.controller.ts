import { Controller, Get } from '@nestjs/common';
import { GraphService } from './graph.service';

@Controller('graph')
export class GraphController {
    constructor(private readonly graphService: GraphService){

    }

    @Get()
    async getAll(){
        return this.graphService.getAllEmails();

    }
    @Get('order')
    async findOrder(){
        return this.graphService.findOrderEmails()
    }
    @Get('sapSales')
    async getAllSap(){
        return this.graphService.getOpportunitiesSap()
    }
    // @Get('subscription')
    // async createSubscription(){
    //     return this.graphService.createSubscription()
    // }
    
   

}
