import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MerchantRole } from '../merchants/enums/merchant-role.enum';
import { QueueMetricsService } from './queue-metrics.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@ApiTags('admin/queues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MerchantRole.ADMIN)
@Controller('admin/queues')
export class QueueAdminController {
  constructor(
    private readonly queueMetricsService: QueueMetricsService,
    @InjectQueue('settlement') private readonly settlementQueue: Queue,
    @InjectQueue('webhook') private readonly webhookQueue: Queue,
    @InjectQueue('notification') private readonly notificationQueue: Queue,
    @InjectQueue('stellar-monitor') private readonly stellarMonitorQueue: Queue,
    @InjectQueue('soroban-event-dlq') private readonly sorobanEventDlqQueue: Queue,
  ) {}

  @Get('metrics')
  async getMetrics() {
    return this.queueMetricsService.getMetrics();
  }

  @Get(':name/failed')
  async getFailedJobs(@Param('name') name: string) {
    const queue = this.getQueue(name);
    const jobs = await queue.getFailed();
    return {
      jobs: jobs.map((j) => ({
        id: j.id,
        name: j.name,
        data: j.data,
        failedReason: j.failedReason,
        attemptsMade: j.attemptsMade,
      })),
      total: jobs.length,
    };
  }

  @Post(':name/failed/:id/retry')
  async retryFailedJob(@Param('name') name: string, @Param('id') id: string) {
    const queue = this.getQueue(name);
    const job = await queue.getJob(id);
    if (!job) {
      return { success: false, message: 'Job not found' };
    }
    await job.retry();
    return { success: true };
  }

  private getQueue(name: string): Queue {
    switch (name) {
      case 'settlement':
        return this.settlementQueue;
      case 'webhook':
        return this.webhookQueue;
      case 'notification':
        return this.notificationQueue;
      case 'stellar-monitor':
        return this.stellarMonitorQueue;
      case 'soroban-event-dlq':
        return this.sorobanEventDlqQueue;
      default:
        throw new Error(`Unknown queue: ${name}`);
    }
  }
}
