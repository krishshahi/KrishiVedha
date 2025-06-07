import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Post, Comment } from '../types/user.types';

// Mock data for community features
const MOCK_POSTS: Post[] = [
  {
    id: '1',
    userId: '1',
    title: 'Rice crop affected by grasshopper - what to do?',
    content: 'My rice crop is affected by grasshoppers. What treatment should I do? Does anyone know?',
    category: 'Pest Control',
    tags: ['rice', 'grasshopper', 'pest'],
    likes: 5,
    comments: 3,
    isExpert: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    userId: '2',
    title: 'Organic Fertilizer Recipe for Maize',
    content: 'How to make organic fertilizer for maize? I have cow dung and leaves.',
    category: 'Organic Farming',
    tags: ['maize', 'organic fertilizer', 'dung'],
    likes: 12,
    comments: 7,
    isExpert: true,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    userId: '3',
    title: 'Potato market price',
    content: 'What is the price of potato in Kathmandu? How much would be good to sell?',
    category: 'Market Information',
    tags: ['potato', 'market', 'price'],
    likes: 8,
    comments: 5,
    isExpert: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    postId: '1',
    userId: '2',
    content: 'For grasshoppers, use neem oil. It is natural and effective.',
    isExpert: true,
    likes: 3,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    postId: '1',
    userId: '4',
    content: 'I also faced the same problem. Bio pesticide works well.',
    isExpert: false,
    likes: 2,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Ram Bahadur',
    email: 'ram@example.com',
    location: 'Chitwan',
    crops: ['Rice', 'Maize'],
    isExpert: false,
    joinedAt: '2024-01-15T00:00:00Z',
    profilePicture: '',
    bio: 'Farmer in Chitwan'
  },
  {
    id: '2',
    name: 'Dr. Shiva Prasad',
    email: 'shiva@agri.gov.np',
    location: 'Kathmandu',
    crops: [],
    isExpert: true,
    joinedAt: '2023-08-20T00:00:00Z',
    profilePicture: '',
    bio: 'Agriculture Expert - Government of Nepal'
  },
  {
    id: '3',
    name: 'Sita Devi',
    email: 'sita@example.com',
    location: 'Dolakha',
    crops: ['Potato', 'Cabbage'],
    isExpert: false,
    joinedAt: '2024-03-10T00:00:00Z',
    profilePicture: '',
    bio: 'Farmer in hilly region'
  }
];

class CommunityService {
  /**
   * Get all community posts
   */
  async getAllPosts(): Promise<Post[]> {
    // In a real app, this would fetch from a server
    return MOCK_POSTS.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get posts by category
   */
  async getPostsByCategory(category: string): Promise<Post[]> {
    return MOCK_POSTS.filter(post => post.category === category)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get posts by user
   */
  async getPostsByUser(userId: string): Promise<Post[]> {
    return MOCK_POSTS.filter(post => post.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get expert posts only
   */
  async getExpertPosts(): Promise<Post[]> {
    return MOCK_POSTS.filter(post => post.isExpert)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Search posts
   */
  async searchPosts(query: string): Promise<Post[]> {
    const searchTerm = query.toLowerCase();
    return MOCK_POSTS.filter(post => 
      post.title.toLowerCase().includes(searchTerm) ||
      post.content.toLowerCase().includes(searchTerm) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Create a new post
   */
  async createPost(post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    const newPost: Post = {
      ...post,
      id: Date.now().toString(),
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // In a real app, this would be saved to a server
    MOCK_POSTS.unshift(newPost);
    
    // Save to local storage for persistence
    await this.savePostsToStorage();
    
    return newPost;
  }

  /**
   * Get comments for a post
   */
  async getCommentsForPost(postId: string): Promise<Comment[]> {
    return MOCK_COMMENTS.filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Add a comment to a post
   */
  async addComment(comment: Omit<Comment, 'id' | 'likes' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const newComment: Comment = {
      ...comment,
      id: Date.now().toString(),
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    MOCK_COMMENTS.push(newComment);
    
    // Update post comment count
    const post = MOCK_POSTS.find(p => p.id === comment.postId);
    if (post) {
      post.comments += 1;
    }
    
    await this.savePostsToStorage();
    await this.saveCommentsToStorage();
    
    return newComment;
  }

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string): Promise<void> {
    const post = MOCK_POSTS.find(p => p.id === postId);
    if (post) {
      post.likes += 1;
      await this.savePostsToStorage();
    }
  }

  /**
   * Like a comment
   */
  async likeComment(commentId: string, userId: string): Promise<void> {
    const comment = MOCK_COMMENTS.find(c => c.id === commentId);
    if (comment) {
      comment.likes += 1;
      await this.saveCommentsToStorage();
    }
  }

  /**
   * Get user information
   */
  async getUserById(userId: string): Promise<User | undefined> {
    return MOCK_USERS.find(user => user.id === userId);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return [
      'Pest Control',
      'Organic Farming',
      'Market Information',
      'Weather Discussion',
      'Seeds and Varieties',
      'Irrigation',
      'Fertilizer and Nutrients',
      'Crop Harvesting',
      'General Questions'
    ];
  }

  /**
   * Get farming tips from experts
   */
  async getExpertTips(): Promise<{tip: string, expert: string, category: string}[]> {
    return [
      {
        tip: 'Apply organic fertilizer to the soil before planting rice. This improves soil quality.',
        expert: 'Dr. Shiva Prasad',
        category: 'Rice Farming'
      },
      {
        tip: 'Water maize plants in the morning or evening. Do not water during sunny daytime.',
        expert: 'Dr. Raj Kumar',
        category: 'Irrigation'
      },
      {
        tip: 'Plow the land well before planting potato seedlings and mix organic fertilizer.',
        expert: 'Dr. Sunita Sharma',
        category: 'Potato Farming'
      }
    ];
  }

  /**
   * Save posts to local storage
   */
  private async savePostsToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem('community_posts', JSON.stringify(MOCK_POSTS));
    } catch (error) {
      console.error('Error saving posts:', error);
    }
  }

  /**
   * Save comments to local storage
   */
  private async saveCommentsToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem('community_comments', JSON.stringify(MOCK_COMMENTS));
    } catch (error) {
      console.error('Error saving comments:', error);
    }
  }

  /**
   * Load posts from local storage
   */
  private async loadPostsFromStorage(): Promise<void> {
    try {
      const storedPosts = await AsyncStorage.getItem('community_posts');
      if (storedPosts) {
        const posts = JSON.parse(storedPosts);
        MOCK_POSTS.splice(0, MOCK_POSTS.length, ...posts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }

  /**
   * Load comments from local storage
   */
  private async loadCommentsFromStorage(): Promise<void> {
    try {
      const storedComments = await AsyncStorage.getItem('community_comments');
      if (storedComments) {
        const comments = JSON.parse(storedComments);
        MOCK_COMMENTS.splice(0, MOCK_COMMENTS.length, ...comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }
}

export default new CommunityService();

