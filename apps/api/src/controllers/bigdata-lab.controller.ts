import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { bigDataRunnerService } from '../services/bigdata-runner.service';
import { runBigDataJobSchema } from '@vynk/validation';

export async function bigDataLabController(fastify: FastifyInstance) {
  // Service health checks across HDFS, Hive, Pig, MapReduce, MongoDB, Database
  fastify.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    const health = await bigDataRunnerService.getHealthStatus();
    return reply.send({ success: true, data: health });
  });

  // Available sample datasets
  fastify.get('/datasets', async (_request: FastifyRequest, reply: FastifyReply) => {
    const datasets = bigDataRunnerService.getDatasets();
    return reply.send({ success: true, data: datasets });
  });

  // Concepts educational specifications & architecture diagrams
  fastify.get('/concepts', async (_request: FastifyRequest, reply: FastifyReply) => {
    const concepts = bigDataRunnerService.getConcepts();
    return reply.send({ success: true, data: concepts });
  });

  // Job history
  fastify.get('/jobs', async (_request: FastifyRequest, reply: FastifyReply) => {
    const jobs = await bigDataRunnerService.getRecentJobs(50);
    return reply.send({ success: true, data: jobs });
  });

  // Single job details
  fastify.get('/jobs/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const job = await bigDataRunnerService.getJobById(request.params.id);
    if (!job) {
      return reply.status(404).send({ success: false, message: 'Big Data job not found' });
    }
    return reply.send({ success: true, data: job });
  });

  // Run job dispatch
  fastify.post('/jobs/run', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = runBigDataJobSchema.parse(request.body);
    const result = await bigDataRunnerService.runJob(
      parsed.conceptId as any,
      parsed.jobId,
      parsed.datasetName,
      parsed.parameters
    );

    return reply.send({
      success: result.status === 'SUCCEEDED',
      data: result,
    });
  });
}
