const fs = require('fs');
const path = require('path');

const serverPath = path.resolve(__dirname, '../apps/api/src/server.ts');
let content = fs.readFileSync(serverPath, 'utf8');

if (!content.includes('storageController')) {
  content = content.replace(
    "import { eventsController } from './controllers/events.controller';",
    "import { eventsController } from './controllers/events.controller';\nimport { storageController } from './controllers/storage.controller';"
  );

  content = content.replace(
    "fastify.register(eventsController, { prefix: `${prefix}/events` });",
    "fastify.register(eventsController, { prefix: `${prefix}/events` });\n    fastify.register(storageController, { prefix: `${prefix}/storage` });"
  );

  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('Registered storageController in server.ts');
}
