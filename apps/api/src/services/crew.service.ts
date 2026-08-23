import { crewRepository } from '../repositories/crew.repository';
import { gamificationRepository } from '../repositories/gamification.repository';
import { CrewRole } from '@vynk/database';

export const crewService = {
  listCrews: (category?: string) => crewRepository.listAll(category),

  getCrew: (id: string) => crewRepository.findById(id),

  createCrew: async (userId: string, data: any) => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    const crew = await crewRepository.create({
      ...data,
      slug,
      captainId: userId,
    });

    // Reward Captain XP (+100 XP)
    await gamificationRepository.addXPTransaction(userId, 100, `Formed crew ${crew.name}`, 'CREW_CREATION', crew.id);

    return crew;
  },

  joinCrew: async (crewId: string, userId: string, roleName: string) => {
    const member = await crewRepository.addMember(crewId, userId, CrewRole.CONTRIBUTOR, roleName);
    // Reward Join XP (+50 XP)
    await gamificationRepository.addXPTransaction(userId, 50, `Joined crew`, 'CREW_JOIN', crewId);
    return member;
  },

  updateAgreement: (crewId: string, data: any) => crewRepository.updateAgreement(crewId, data),
};
