// Test data helper with valid user IDs from the database
// Real user IDs from the backend: 684541460c567785e32ead2b, 684541460c567785e32ead30, 684541460c567785e32ead33

export const VALID_USER_IDS = {
  JOHN_FARMER: '684541460c567785e32ead2b',
  MARY_GROWER: '684541460c567785e32ead30', 
  ALEX_ORGANIC: '684541460c567785e32ead33'
};

export const TEST_USERS = {
  john: {
    id: VALID_USER_IDS.JOHN_FARMER,
    username: 'john_farmer',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe'
  },
  mary: {
    id: VALID_USER_IDS.MARY_GROWER,
    username: 'mary_grower', 
    email: 'mary@example.com',
    firstName: 'Mary',
    lastName: 'Johnson'
  },
  alex: {
    id: VALID_USER_IDS.ALEX_ORGANIC,
    username: 'alex_organic',
    email: 'alex@example.com', 
    firstName: 'Alex',
    lastName: 'Smith'
  }
};

export const createTestFarm = (userId: string = VALID_USER_IDS.JOHN_FARMER) => ({
  userId,
  name: 'Test Farm',
  location: 'Test Location, Nepal',
  area: 5.5,
  crops: ['Rice', 'Wheat', 'Maize']
});

export const createTestCrop = (farmId: string, ownerId: string = VALID_USER_IDS.JOHN_FARMER) => ({
  name: 'Rice',
  variety: 'Basmati',
  farmId,
  ownerId,
  plantingDate: new Date().toISOString(),
  expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
  area: { value: 2, unit: 'acres' }
});

export const createTestCommunityPost = (authorId: string = VALID_USER_IDS.JOHN_FARMER) => ({
  title: 'Test Community Post',
  content: 'This is a test post content for the community.',
  category: 'general',
  authorId,
  tags: ['test', 'farming', 'community']
});

