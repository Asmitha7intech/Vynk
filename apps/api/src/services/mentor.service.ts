import { mentorRepository } from '../repositories/mentor.repository';
import { messageRepository } from '../repositories/message.repository';
import { MentorshipStatus } from '@vynk/database';

export const mentorService = {
  listMentors: (category?: string) => mentorRepository.listAll(category),

  getMentor: (id: string) => mentorRepository.findById(id),

  createProfile: (userId: string, data: any) => mentorRepository.createProfile(userId, data),

  requestMentorship: (studentId: string, data: any) => mentorRepository.createRequest(studentId, data),

  respondToRequest: async (mentorUserId: string, requestId: string, accept: boolean, note?: string) => {
    const status = accept ? MentorshipStatus.ACCEPTED : MentorshipStatus.DECLINED;
    const request = await mentorRepository.updateRequestStatus(requestId, status, note);

    // If accepted, automatically initialize dedicated mentorship conversation
    if (accept) {
      const conv = await messageRepository.createMentorConversation(
        requestId,
        `Mentorship: ${request.topic}`,
        request.studentId,
        mentorUserId
      );
      // Send initial welcome intro
      await messageRepository.createMessage(
        conv.id,
        mentorUserId,
        `Hello ${request.student.displayName}! I have accepted your mentorship request on "${request.topic}". Let's discuss your current blocker and schedule our sync.`
      );
    }

    return request;
  },
};
