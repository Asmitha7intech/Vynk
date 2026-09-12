const fs = require('fs');
const path = require('path');

// 1. Update schema.prisma with Institution & StudentVerification models
const schemaPath = path.resolve(__dirname, '../packages/database/prisma/schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

if (!schemaContent.includes('model Institution {')) {
  const institutionModels = `

// -------------------------------------------------------------
// INSTITUTIONS & CAMPUS VERIFICATION
// -------------------------------------------------------------

model Institution {
  id               String   @id @default(uuid())
  name             String   @unique
  slug             String   @unique
  domains          String[] @default([]) // e.g. ["mit.edu", "stanford.edu", "citchennai.net"]
  logoUrl          String?
  city             String?
  country          String   @default("US")
  isApproved       Boolean  @default(true)
  createdAt        DateTime @default(now())

  studentVerifications StudentVerification[]

  @@index([slug])
}

model StudentVerification {
  id                 String      @id @default(uuid())
  userId             String      @unique
  user               User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  institutionId      String
  institution        Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  campusEmail        String
  verificationStatus String      @default("PENDING") // PENDING | VERIFIED | REJECTED
  verifiedAt         DateTime?
  createdAt          DateTime    @default(now())

  @@index([institutionId])
  @@index([userId])
}
`;

  // Add relation on User model
  schemaContent = schemaContent.replace(
    'searchHistories         SearchHistory[]',
    'searchHistories         SearchHistory[]\n  studentVerification     StudentVerification?'
  );

  schemaContent += institutionModels;
  fs.writeFileSync(schemaPath, schemaContent, 'utf8');
  console.log('Updated schema.prisma with Institution and StudentVerification');
}
