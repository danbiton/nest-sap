import { Body, Controller, Get, Headers, Logger, Post, Query, Res } from "@nestjs/common";
import { GraphService } from "./graph.service";
import type { Response } from "express";
@Controller('webhook')

export class WebhookController {

    private readonly logger = new Logger(WebhookController.name)
    constructor(private readonly graphService: GraphService) { }

    @Get()
    verifyWebhook(@Query('validationToken') validationToken: string, @Res() res: Response) {
        if (validationToken) {
            this.logger.log(`Received validationToken: ${validationToken}`);
            return res.status(200).send(validationToken);
        }
        return res.status(200).send('OK');
    }

    @Post()
    async handleWebhook(@Body() body: any, @Headers('clientstate') clientState: string) {
        this.logger.log('Received webhook notification', JSON.stringify(body));
      
        if (clientState && clientState !== 'secretClientValue') {
            this.logger.warn('Invalid clientState, ignoring notification');
            return { status: 'ignored' };
        }

        if (!body && !body.value || !body.value.length) {
            this.logger.log('No new messages in notification');
            return { status: 'ignored' };
        }

        for (const notification of body.value) {
            
            const messageId = notification.resourceData?.id;
            if (!messageId) continue;

            const message:any = await this.graphService.getMessageById(messageId);

            if (!message?.subject?.toLowerCase().includes('order')) {
                this.logger.log('Email subject does not contain "order", ignoring.');
                continue;
            }

            this.logger.log('Email subject contains "order", processing SAP opportunities...');
            await this.graphService.getOpportunitiesSap();
        }

        return { status: 'processed' };
    }

}