import { prisma } from '@vynk/database';

export const voyageRepository = {
  listAll: (category?: string) => prisma.project.findMany({
    where: category ? { category } : undefined,
    include: {
      creator: true,
      members: { include: { user: true } },
      milestones: true,
    },
    orderBy: { likesCount: 'desc' },
  }),

  findById: async (id: string): Promise<any> => {
    return (prisma.project.findUnique as any)({
      where: { id },
      include: {
        creator: true,
        members: { include: { user: true } },
        milestones: true,
        posts: { include: { author: true } },
        joinRequests: { include: { user: true } },
        tasks: { include: { assignee: true } },
        discussions: { include: { author: true } },
        activities: true,
      },
    });
  },

  create: (data: any) => prisma.project.create({
    data: {
      title: data.title,
      slug: data.slug,
      tagline: data.tagline,
      description: data.description,
      category: data.category,
      technologies: data.technologies,
      githubUrl: data.githubUrl,
      demoUrl: data.demoUrl,
      videoUrl: data.videoUrl,
      coverImageUrl: data.coverImageUrl,
      screenshots: data.screenshots || [],
      status: data.status || 'IN_PROGRESS',
      creatorId: data.creatorId,
      crewId: data.crewId,
      members: {
        create: {
          userId: data.creatorId,
          role: 'Lead Architect',
          contributions: 'Project creator and primary maintainer',
        },
      },
    },
    include: {
      creator: true,
      members: { include: { user: true } },
      milestones: true,
    },
  }),

  like: (id: string) => prisma.project.update({
    where: { id },
    data: { likesCount: { increment: 1 } },
  }),
};
