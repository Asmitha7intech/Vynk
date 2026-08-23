import { analyticsRepository } from '../repositories/analytics.repository';

export const analyticsService = {
  track: async (eventName: string, userId?: string, sessionId?: string, metadata?: any) => {
    return analyticsRepository.recordEvent(eventName, userId, sessionId, metadata);
  },

  getPlatformMetrics: async () => {
    return analyticsRepository.getMetrics();
  },
};
