import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { questService } from '../services/quest.service';
import { submitChallengeSchema, submitQuizSchema } from '@vynk/validation';

export async function questsController(fastify: FastifyInstance) {
  fastify.get('/daily-challenge', async (request: FastifyRequest, reply: FastifyReply) => {
    let userId: string | undefined;
    try {
      await request.jwtVerify();
      userId = (request.user as any)?.userId;
    } catch {}
    const challenge = await questService.getDailyChallenge(userId);
    return reply.send({ success: true, data: challenge });
  });

  fastify.post('/daily-challenge/submit', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = submitChallengeSchema.parse(request.body);
    const result = await questService.submitChallenge(request.userPayload!.userId, parsed.challengeId, parsed.selectedOptionIndex);
    return reply.send({ success: true, data: result });
  });

  fastify.get('/quizzes', async (request: FastifyRequest, reply: FastifyReply) => {
    const list = await questService.listQuizzes();
    return reply.send({ success: true, data: list });
  });

  fastify.get('/quizzes/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const quiz = await questService.getQuiz(request.params.id);
    if (!quiz) return reply.status(404).send({ success: false, message: 'Quiz not found' });
    return reply.send({ success: true, data: quiz });
  });

  fastify.post('/quizzes/submit', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = submitQuizSchema.parse(request.body);
    const result = await questService.submitQuiz(
      request.userPayload!.userId,
      parsed.quizId,
      parsed.timeSpentSeconds,
      parsed.answers.map((a: any) => ({ questionId: a.questionId, selectedOptionIndex: a.selectedIndex ?? a.selectedOptionIndex }))
    );
    return reply.send({ success: true, data: result });
  });
}
