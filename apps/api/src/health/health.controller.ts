import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { createClient } from 'redis';

/**
 * Health Controller
 * S6: Active connectivity checks for security-critical services
 */
@Controller('health')
export class HealthController {
    @Get('redis')
    async checkRedis(@Res() res: Response) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const client = createClient({ url: redisUrl });

        try {
            await client.connect();
            await client.ping();
            await client.disconnect();

            return res.status(HttpStatus.OK).json({
                status: 'ok',
                service: 'redis',
                message: 'Redis connectivity verified'
            });
        } catch (error) {
            return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
                status: 'error',
                service: 'redis',
                message: 'Redis connectivity failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    @Get('live')
    checkLiveness(@Res() res: Response) {
        return res.status(HttpStatus.OK).json({ status: 'ok' });
    }
}
