const fs = require('fs');
const path = require('path');

const crewServicePath = path.resolve(__dirname, '../apps/api/src/services/crew.service.ts');
const crewCtrlPath = path.resolve(__dirname, '../apps/api/src/controllers/crews.controller.ts');

const crewServiceContent = `
import { crewRepository } from '../repositories/crew.repository';
import { prisma } from '@vynk/database';

export const crewService = {
  listCrews: (category?: string) => crewRepository.listCrews(category),

  getCrew: (id: string) => crewRepository.findById(id),

  createCrew: async (captainId: string, data: any) => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await crewRepository.findBySlug(slug);
    if (existing) {
      throw new Error('Crew name is already taken. Please choose another unique squad name.');
    }

    const crew = await crewRepository.createCrew(captainId, data);

    // Initial Team Agreement digital acceptance by Captain
    if (crew.agreement) {
      await prisma.teamAgreement.update({
        where: { teamId: crew.id },
        data: {
          acceptedUserIds: [captainId],
        },
      });
    }

    return crew;
  },

  joinCrew: async (crewId: string, userId: string, roleName?: string) => {
    const crew = await crewRepository.findById(crewId);
    if (!crew) throw new Error('Crew not found');

    if (crew.members.length >= crew.maxMembers) {
      throw new Error('Crew roster is already at maximum capacity.');
    }

    const isMember = crew.members.some((m) => m.userId === userId);
    if (isMember) {
      throw new Error('You are already an active member of this crew squad.');
    }

    return crewRepository.addMember(crewId, userId, 'CONTRIBUTOR', roleName || 'Contributor');
  },

  updateAgreement: async (crewId: string, data: any) => {
    return crewRepository.updateAgreement(crewId, data);
  },

  signTeamAgreement: async (crewId: string, userId: string) => {
    const agreement = await prisma.teamAgreement.findUnique({
      where: { teamId: crewId },
    });

    if (!agreement) throw new Error('Team agreement not found for this crew.');

    const alreadyAccepted = agreement.acceptedUserIds.includes(userId);
    if (alreadyAccepted) return agreement;

    return prisma.teamAgreement.update({
      where: { teamId: crewId },
      data: {
        acceptedUserIds: [...agreement.acceptedUserIds, userId],
      },
    });
  },
};
`;

const crewCtrlContent = `
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { crewService } from '../services/crew.service';
import { createCrewSchema, updateTeamAgreementSchema } from '@vynk/validation';

export async function crewsController(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { category?: string } }>, reply: FastifyReply) => {
    const list = await crewService.listCrews(request.query.category);
    return reply.send({ success: true, data: list });
  });

  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const crew = await crewService.getCrew(request.params.id);
    if (!crew) return reply.status(404).send({ success: false, message: 'Crew not found' });
    return reply.send({ success: true, data: crew });
  });

  fastify.post('/', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createCrewSchema.parse(request.body);
    const crew = await crewService.createCrew(request.userPayload!.userId, parsed);
    return reply.status(201).send({ success: true, data: crew });
  });

  fastify.post('/:id/join', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string }; Body: { roleName: string } }>, reply: FastifyReply) => {
    const member = await crewService.joinCrew(request.params.id, request.userPayload!.userId, request.body.roleName || 'Contributor');
    return reply.status(201).send({ success: true, data: member });
  });

  fastify.patch('/:id/agreement', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = updateTeamAgreementSchema.parse(request.body);
    const updated = await crewService.updateAgreement(request.params.id, parsed);
    return reply.send({ success: true, data: updated });
  });

  fastify.post('/:id/sign-agreement', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const updated = await crewService.signTeamAgreement(request.params.id, request.userPayload!.userId);
    return reply.send({ success: true, data: updated, message: 'Team agreement signed successfully' });
  });
}
`;

fs.writeFileSync(crewServicePath, crewServiceContent.trim() + '\n', 'utf8');
fs.writeFileSync(crewCtrlPath, crewCtrlContent.trim() + '\n', 'utf8');
console.log('Updated crewService and crewsController with signTeamAgreement');
