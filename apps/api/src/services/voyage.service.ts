import { voyageRepository } from '../repositories/voyage.repository';
import { gamificationRepository } from '../repositories/gamification.repository';

export const voyageService = {
  listVoyages: (category?: string) => voyageRepository.listAll(category),

  getVoyage: (id: string) => voyageRepository.findById(id),

  createVoyage: async (userId: string, data: any) => {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    const voyage = await voyageRepository.create({
      ...data,
      slug,
      creatorId: userId,
    });

    // Reward Voyage Showcase XP (+250 XP)
    await gamificationRepository.addXPTransaction(userId, 250, `Published Voyage: ${voyage.title}`, 'VOYAGE_LAUNCH', voyage.id);

    return voyage;
  },

  likeVoyage: (id: string) => voyageRepository.like(id),
};
