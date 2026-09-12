const fs = require('fs');
const path = require('path');

// 1. Update users.controller.ts
const usersCtrlPath = path.resolve(__dirname, '../apps/api/src/controllers/users.controller.ts');
let usersCtrl = fs.readFileSync(usersCtrlPath, 'utf8');

if (!usersCtrl.includes('crossDepartmentService')) {
  usersCtrl = usersCtrl.replace(
    "import { userService } from '../services/user.service';",
    "import { userService } from '../services/user.service';\nimport { crossDepartmentService } from '../services/cross-department.service';"
  );

  const crossDeptRoute = `
  fastify.get('/cross-department', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    const matches = await crossDepartmentService.getCrossDepartmentMatches(userId, 10);
    return reply.send({ success: true, data: matches });
  });
`;

  usersCtrl = usersCtrl.replace(
    "export async function usersController(fastify: FastifyInstance) {",
    "export async function usersController(fastify: FastifyInstance) {\n" + crossDeptRoute
  );

  fs.writeFileSync(usersCtrlPath, usersCtrl, 'utf8');
  console.log('Updated users.controller.ts with /cross-department route');
}

// 2. Update server.ts with bigDataController
const serverPath = path.resolve(__dirname, '../apps/api/src/server.ts');
let server = fs.readFileSync(serverPath, 'utf8');

if (!server.includes('bigDataController')) {
  server = server.replace(
    "import { institutionsController } from './controllers/institutions.controller';",
    "import { institutionsController } from './controllers/institutions.controller';\nimport { bigDataController } from './controllers/bigdata.controller';"
  );

  server = server.replace(
    "fastify.register(institutionsController, { prefix: `${prefix}/institutions` });",
    "fastify.register(institutionsController, { prefix: `${prefix}/institutions` });\n    fastify.register(bigDataController, { prefix: `${prefix}/analytics/bigdata` });"
  );

  fs.writeFileSync(serverPath, server, 'utf8');
  console.log('Updated server.ts with bigDataController');
}
