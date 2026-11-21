import { voyageRepository } from '../repositories/voyage.repository';
import { gamificationRepository } from '../repositories/gamification.repository';
import { eventService } from './event.service';
import { prisma } from '@vynk/database';

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

    await eventService.publish({
      eventType: 'VOYAGE_CREATED',
      userId,
      payload: {
        voyageId: voyage.id,
        title: voyage.title,
        category: voyage.category,
        technologies: voyage.technologies,
        demoUrl: voyage.demoUrl,
        githubUrl: voyage.githubUrl,
      },
    });

    return voyage;
  },

  likeVoyage: async (id: string, userId?: string) => {
    const result = await voyageRepository.like(id);

    await eventService.publish({
      eventType: 'VOYAGE_STARRED',
      userId,
      payload: {
        voyageId: id,
        userId,
      },
    });

    return result;
  },

  createJoinRequest: async (projectId: string, userId: string, data: { roleName: string; message: string; skills?: string[] }) => {
    const project: any = await voyageRepository.findById(projectId);
    if (!project) throw new Error('Voyage not found');

    const maxCapacity = project.maxCapacity || project.teamCapacity || 20;
    const members = project.members || [];
    if (members.length >= maxCapacity) {
      throw new Error(`This project has reached its maximum capacity of ${maxCapacity} members.`);
    }

    if (project.creatorId === userId || members.some((m: any) => m.userId === userId)) {
      throw new Error('You are already a member or creator of this project.');
    }

    const existingPending = await (prisma as any).projectJoinRequest.findFirst({
      where: { projectId, userId, status: 'PENDING' },
    });
    if (existingPending) {
      throw new Error('You already have a pending join request for this voyage.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const joinRequest = await (prisma as any).projectJoinRequest.create({
      data: {
        id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        projectId,
        userId,
        roleName: data.roleName,
        message: data.message,
        skills: data.skills || [],
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      include: { user: true },
    });

    // Record activity
    await (prisma as any).projectActivity.create({
      data: {
        id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `act_${Date.now()}`,
        projectId,
        userId,
        userName: user?.displayName || user?.username || 'Student',
        action: 'SUBMITTED_APPLICATION',
        details: `Applied for ${data.roleName}`,
        createdAt: new Date().toISOString(),
      },
    });

    await eventService.publish({
      eventType: 'VOYAGE_JOIN_REQUESTED',
      userId,
      payload: {
        projectId,
        requestId: joinRequest.id,
        roleName: data.roleName,
      },
    });

    return joinRequest;
  },

  getJoinRequests: async (projectId: string, userId: string) => {
    const project: any = await voyageRepository.findById(projectId);
    if (!project) throw new Error('Voyage not found');

    const isCreator = project.creatorId === userId;
    const members = project.members || [];
    const isMember = members.some((m: any) => m.userId === userId);

    if (isCreator || isMember) {
      return (prisma as any).projectJoinRequest.findMany({
        where: { projectId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Otherwise only return user's own requests
    return (prisma as any).projectJoinRequest.findMany({
      where: { projectId, userId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  respondToJoinRequest: async (projectId: string, requestId: string, reviewerId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const project: any = await voyageRepository.findById(projectId);
    if (!project) throw new Error('Voyage not found');

    if (project.creatorId !== reviewerId) {
      throw new Error('Only the voyage creator can review team join requests.');
    }

    const request = await (prisma as any).projectJoinRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });
    if (!request || request.projectId !== projectId) {
      throw new Error('Join request not found.');
    }

    const updated = await (prisma as any).projectJoinRequest.update({
      where: { id: requestId },
      data: {
        status,
        updatedAt: new Date().toISOString(),
      },
    });

    if (status === 'ACCEPTED') {
      // Add member to project
      await (prisma as any).projectMember.create({
        data: {
          id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `pm_${Date.now()}`,
          projectId,
          userId: request.userId,
          role: request.roleName,
          contributions: 'Team Collaborator',
        },
      });

      // Award XP (+100 XP)
      await gamificationRepository.addXPTransaction(
        request.userId,
        100,
        `Joined Voyage Team: ${project.title} as ${request.roleName}`,
        'VOYAGE_JOINED',
        projectId
      );

      // Record activity
      await (prisma as any).projectActivity.create({
        data: {
          id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `act_${Date.now()}`,
          projectId,
          userId: request.userId,
          userName: request.user?.displayName || request.user?.username || 'Collaborator',
          action: 'JOINED_TEAM',
          details: `Accepted as ${request.roleName}`,
          createdAt: new Date().toISOString(),
        },
      });

      await eventService.publish({
        eventType: 'VOYAGE_JOIN_ACCEPTED',
        userId: request.userId,
        payload: {
          projectId,
          requestId,
          roleName: request.roleName,
          reviewerId,
        },
      });
    } else {
      await eventService.publish({
        eventType: 'VOYAGE_JOIN_REJECTED',
        userId: request.userId,
        payload: {
          projectId,
          requestId,
          reviewerId,
        },
      });
    }

    return updated;
  },

  createTask: async (projectId: string, userId: string, data: any) => {
    const project = await voyageRepository.findById(projectId);
    if (!project) throw new Error('Voyage not found');

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const task = await (prisma as any).projectTask.create({
      data: {
        id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `task_${Date.now()}`,
        projectId,
        title: data.title,
        description: data.description || '',
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      include: { assignee: true },
    });

    await (prisma as any).projectActivity.create({
      data: {
        id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `act_${Date.now()}`,
        projectId,
        userId,
        userName: user?.displayName || user?.username || 'Team Member',
        action: 'CREATED_TASK',
        details: `Added task "${data.title}"`,
        createdAt: new Date().toISOString(),
      },
    });

    await eventService.publish({
      eventType: 'VOYAGE_TASK_CREATED',
      userId,
      payload: {
        projectId,
        taskId: task.id,
        title: task.title,
      },
    });

    return task;
  },

  updateTask: async (projectId: string, taskId: string, userId: string, data: any) => {
    const task = await (prisma as any).projectTask.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== projectId) throw new Error('Task not found');

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const updated = await (prisma as any).projectTask.update({
      where: { id: taskId },
      data: {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      include: { assignee: true },
    });

    if (data.status && data.status !== task.status) {
      await (prisma as any).projectActivity.create({
        data: {
          id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `act_${Date.now()}`,
          projectId,
          userId,
          userName: user?.displayName || user?.username || 'Team Member',
          action: 'UPDATED_TASK_STATUS',
          details: `Moved "${task.title}" to ${data.status}`,
          createdAt: new Date().toISOString(),
        },
      });

      if (data.status === 'COMPLETED') {
        // Award XP for completing task
        await gamificationRepository.addXPTransaction(
          userId,
          30,
          `Completed Task: ${task.title}`,
          'TASK_COMPLETED',
          taskId
        );
      }
    }

    await eventService.publish({
      eventType: 'VOYAGE_TASK_UPDATED',
      userId,
      payload: {
        projectId,
        taskId,
        newStatus: data.status,
      },
    });

    return updated;
  },

  deleteTask: async (projectId: string, taskId: string) => {
    return (prisma as any).projectTask.delete({ where: { id: taskId } });
  },

  createDiscussion: async (projectId: string, userId: string, content: string) => {
    const project = await voyageRepository.findById(projectId);
    if (!project) throw new Error('Voyage not found');

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const discussion = await (prisma as any).projectDiscussion.create({
      data: {
        id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `disc_${Date.now()}`,
        projectId,
        authorId: userId,
        content,
        isPinned: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      include: { author: true },
    });

    await (prisma as any).projectActivity.create({
      data: {
        id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `act_${Date.now()}`,
        projectId,
        userId,
        userName: user?.displayName || user?.username || 'Contributor',
        action: 'POSTED_DISCUSSION',
        details: content.length > 40 ? content.slice(0, 40) + '...' : content,
        createdAt: new Date().toISOString(),
      },
    });

    await eventService.publish({
      eventType: 'VOYAGE_DISCUSSION_POSTED',
      userId,
      payload: {
        projectId,
        discussionId: discussion.id,
      },
    });

    return discussion;
  },

  createMilestone: async (projectId: string, userId: string, data: any) => {
    const milestone = await (prisma as any).projectMilestone.create({
      data: {
        id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `mile_${Date.now()}`,
        projectId,
        title: data.title,
        description: data.description || '',
        isCompleted: false,
        dueDate: data.dueDate || null,
      },
    });

    return milestone;
  },

  updateMilestone: async (projectId: string, milestoneId: string, userId: string, data: any) => {
    const milestone = await (prisma as any).projectMilestone.update({
      where: { id: milestoneId },
      data,
    });

    if (data.isCompleted) {
      await gamificationRepository.addXPTransaction(
        userId,
        75,
        `Completed Milestone: ${milestone.title}`,
        'MILESTONE_COMPLETED',
        milestoneId
      );

      await eventService.publish({
        eventType: 'VOYAGE_MILESTONE_COMPLETED',
        userId,
        payload: {
          projectId,
          milestoneId,
          title: milestone.title,
        },
      });
    }

    return milestone;
  },
};


