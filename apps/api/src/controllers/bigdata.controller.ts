import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { bigDataService } from '../services/bigdata.service';
import { trendingService } from '../services/trending.service';
import { dataLakeService } from '../services/data-lake.service';

export async function bigDataController(fastify: FastifyInstance) {
  fastify.get('/campus-heatmap', async (request: FastifyRequest<{ Querystring: { college?: string } }>, reply: FastifyReply) => {
    const data = await bigDataService.getCampusSkillHeatmap(request.query.college);
    return reply.send({ success: true, data });
  });

  fastify.get('/dept-collaboration', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await bigDataService.getDepartmentCollaborationMatrix();
    return reply.send({ success: true, data });
  });

  fastify.get('/skill-demand', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await bigDataService.getSkillDemandSupply();
    return reply.send({ success: true, data });
  });

  // Trending dashboard — time-decay scored content discovery
  fastify.get('/trending', async (request: FastifyRequest<{ Querystring: { department?: string } }>, reply: FastifyReply) => {
    const data = await trendingService.getTrendingDashboard(request.query.department);
    return reply.send({ success: true, data });
  });

  // Real-time event stream pulse (in-memory counters)
  fastify.get('/realtime-pulse', async (request: FastifyRequest, reply: FastifyReply) => {
    const metrics = dataLakeService.getRealtimeMetrics();
    const lakeStats = dataLakeService.getLakeStats();
    return reply.send({
      success: true,
      data: {
        ...metrics,
        lake: lakeStats,
        architecture: 'RAW → BRONZE → SILVER → GOLD',
      },
    });
  });

  // Event type distribution for admin/analytics view
  fastify.get('/event-distribution', async (request: FastifyRequest, reply: FastifyReply) => {
    const metrics = dataLakeService.getRealtimeMetrics();
    return reply.send({
      success: true,
      data: {
        totalEvents: metrics.totalEvents,
        activeUsers: metrics.activeUsers,
        byType: metrics.topEventTypes,
        byDepartment: metrics.topDepartments,
        byHour: metrics.recentHours,
        lastUpdated: metrics.lastUpdated,
      },
    });
  });
}

