import { crewRepository } from '../repositories/crew.repository';
import { prisma } from '@vynk/database';
import { eventService } from './event.service';

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

    await eventService.publish({
      eventType: 'CREW_CREATED',
      userId: captainId,
      payload: {
        crewId: crew.id,
        name: crew.name,
        category: crew.category,
        captainId,
        targetHackathon: crew.targetHackathon,
        maxMembers: crew.maxMembers,
      },
    });

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

    const member = await crewRepository.addMember(crewId, userId, 'CONTRIBUTOR', roleName || 'Contributor');

    await eventService.publish({
      eventType: 'CREW_MEMBER_JOINED',
      userId,
      payload: {
        crewId,
        userId,
        roleName: roleName || 'Contributor',
      },
    });

    return member;
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
