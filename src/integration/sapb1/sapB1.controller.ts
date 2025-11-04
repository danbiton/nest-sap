import { Controller, Get } from '@nestjs/common';
import { SapB1Client } from './sapB1.client';
import { SapB1Service } from './sapB1.service';

@Controller('sapb1')
export class SapB1Controller {
  constructor(private readonly sapB1Client: SapB1Client,
     private readonly sapB1Service: SapB1Service ) {}

  @Get('login')
  async login() {
    console.log('Login request received...');
    
    const results = await this.sapB1Client.login();
    return results;
  }
  @Get('getPurchaseOrder')
    async purchaseOrder(){
        const results = await this.sapB1Service.getPurchaseOrder();
        return results;
    }
  @Get ('logout')
  async logout(){
    return this.sapB1Client.logout()
  }
}
