const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(__dirname, '../packages/database/prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

if (!schema.includes('CAMPUS_ADMIN')) {
  schema = schema.replace(
    /enum Role \{[\s\S]*?\}/,
    'enum Role {\n  STUDENT\n  MENTOR\n  MODERATOR\n  CAMPUS_ADMIN\n  VYNK_ADMIN\n  ORGANIZATION\n  ADMIN\n  SUPER_ADMIN\n}'
  );
}

if (!schema.includes('isAmbassador')) {
  schema = schema.replace(
    'isAvailableForMentorship Boolean     @default(false)',
    'isAvailableForMentorship Boolean     @default(false)\n  isAmbassador            Boolean     @default(false)'
  );
}

if (!schema.includes('model Department {')) {
  schema = schema.replace(
    'studentVerifications StudentVerification[]',
    'departments          Department[]\n  studentVerifications StudentVerification[]'
  );

  const departmentModel = `
model Department {
  id            String       @id @default(uuid())
  institutionId String
  institution   Institution  @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  name          String
  code          String
  studentCount  Int          @default(0)
  createdAt     DateTime     @default(now())

  @@unique([institutionId, code])
  @@index([institutionId])
}
`;
  schema += departmentModel;
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Updated schema.prisma successfully.');
