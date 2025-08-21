import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommunityPost, Comment, User } from '../types/user.types';
import apiService from './apiService';

// Mock data for community features (fallback if API is not available)
const MOCK_POSTS: CommunityPost[] = [
  {
    id: '1',
    authorId: '1',
    authorName: 'Ram Bahadur',
    title: 'Rice crop affected by grasshopper - what to do?',
    content: 'My rice crop is affected by grasshoppers. What treatment should I do? Does anyone know?',
    tags: ['rice', 'grasshopper', 'pest'],
    likes: 5,
    comments: 3,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    authorId: '2',
    authorName: 'Dr. Shiva Prasad',
    title: 'Organic Fertilizer Recipe for Maize',
    content: 'How to make organic fertilizer for maize? I have cow dung and leaves.',
    tags: ['maize', 'organic', 'fertilizer'],
    likes: 12,
    comments: 7,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    authorId: '3',
    authorName: 'Sita Devi',
    title: 'Potato market price',
    content: 'What is the price of potato in Kathmandu? How much would be good to sell?',
    tags: ['potato', 'market', 'price'],
    likes: 8,
    comments: 5,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    postId: '1',
    authorId: '2',
    authorName: 'Dr. Shiva Prasad',
    content: 'For grasshoppers, use neem oil. It is natural and effective.',
    likes: 3,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    postId: '1',
    authorId: '4',
    authorName: 'Krishna Karki',
    content: 'I also faced the same problem. Bio pesticide works well.',
    likes: 2,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

class CommunityService {
  /**
   * Get all community posts
   */
  async getAllPosts(): Promise<any[]> {
    try {
      // Try to fetch from API first
      const posts = await apiService.getCommunityPosts({ limit: 20, page: 1 });
      // Map the posts to include necessary fields
      return posts.map(post => ({
        ...post,
        id: post._id || post.id,
        authorName: post.author?.username || post.author?.name || 'Unknown',
        authorId: post.author?._id || post.author?.id,
        title: post.content?.substring(0, 50) + '...' || 'No title',
        likes: post.likeCount || post.likes?.length || 0,
        comments: post.commentCount || post.comments?.length || 0,
        tags: post.tags || [],
        createdAt: post.createdAt || new Date().toISOString(),
        updatedAt: post.updatedAt || new Date().toISOString()
      }));
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      // Fallback to mock data if API is not available
      return MOCK_POSTS.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }

  /**
   * Get posts by category
   */
  async getPostsByCategory(category: string): Promise<any[]> {
    try {
      const posts = await apiService.getCommunityPosts({ category, limit: 20, page: 1 });
      return posts.map(post => ({
        ...post,
        id: post._id || post.id,
        authorName: post.author?.username || post.author?.name || 'Unknown',
        authorId: post.author?._id || post.author?.id,
        title: post.content?.substring(0, 50) + '...' || 'No title',
        likes: post.likeCount || post.likes?.length || 0,
        comments: post.commentCount || post.comments?.length || 0,
        tags: post.tags || [],
        createdAt: post.createdAt || new Date().toISOString(),
        updatedAt: post.updatedAt || new Date().toISOString()
      }));
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      return MOCK_POSTS.filter(post => post.tags.includes(category.toLowerCase()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  /**
   * Get posts by user
   */
  async getPostsByUser(userId: string): Promise<CommunityPost[]> {
    try {
      const posts = await apiService.getCommunityPosts({ userId });
      return posts;
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      return MOCK_POSTS.filter(post => post.authorId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  /**
   * Search posts
   */
  async searchPosts(query: string): Promise<CommunityPost[]> {
    try {
      const posts = await apiService.searchCommunityPosts(query);
      return posts;
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      const searchTerm = query.toLowerCase();
      return MOCK_POSTS.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
  }

  /**
   * Create a new post
   */
  async createPost(postData: {
    title?: string;
    content: string;
    authorId?: string;
    authorName?: string;
    tags?: string[];
    category?: string;
    images?: any[];
  }): Promise<any> {
    try {
      const newPost = await apiService.createCommunityPost({
        content: postData.title ? `${postData.title}\n\n${postData.content}` : postData.content,
        category: postData.category || 'General',
        tags: postData.tags || [],
        images: postData.images || []
      });
      return {
        ...newPost,
        id: newPost._id || newPost.id,
        authorName: newPost.author?.username || newPost.author?.name || postData.authorName || 'Unknown',
        authorId: newPost.author?._id || newPost.author?.id || postData.authorId,
        title: postData.title || newPost.content?.substring(0, 50) + '...',
        likes: newPost.likeCount || 0,
        comments: newPost.commentCount || 0
      };
    } catch (error) {
      console.warn('API not available, using mock creation:', error);
      // Fallback to mock creation
      const mockPost: CommunityPost = {
        id: Date.now().toString(),
        authorId: postData.authorId,
        authorName: postData.authorName,
        title: postData.title,
        content: postData.content,
        tags: postData.tags || [],
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      MOCK_POSTS.unshift(mockPost);
      await this.savePostsToStorage();
      return mockPost;
    }
  }

  /**
   * Get comments for a post
   */
  async getCommentsForPost(postId: string): Promise<Comment[]> {
    try {
      const comments = await apiService.getPostComments(postId);
      return comments;
    } catch (error) {
      console.warn('API not available, using mock data:', error);
      return MOCK_COMMENTS.filter(comment => comment.postId === postId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(postId: string, content: string, authorId: string, authorName: string): Promise<Comment> {
    try {
      const newComment = await apiService.addPostComment(postId, content);
      return newComment;
    } catch (error) {
      console.warn('API not available, using mock creation:', error);
      const mockComment: Comment = {
        id: Date.now().toString(),
        postId,
        authorId,
        authorName,
        content,
        likes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      MOCK_COMMENTS.push(mockComment);
      
      // Update post comment count
      const post = MOCK_POSTS.find(p => p.id === postId);
      if (post) {
        post.comments += 1;
      }
      
      await this.savePostsToStorage();
      await this.saveCommentsToStorage();
      return mockComment;
    }
  }

  /**
   * Like a post
   */
  async likePost(postId: string): Promise<{ likeCount: number; isLiked: boolean } | void> {
    try {
      const result = await apiService.likeCommunityPost(postId);
      return result;
    } catch (error) {
      console.warn('API not available, using mock like:', error);
      const post = MOCK_POSTS.find(p => p.id === postId);
      if (post) {
        post.likes += 1;
        await this.savePostsToStorage();
        return { likeCount: post.likes, isLiked: true };
      }
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string): Promise<void> {
    try {
      await apiService.unlikeCommunityPost(postId);
    } catch (error) {
      console.warn('API not available, using mock unlike:', error);
      const post = MOCK_POSTS.find(p => p.id === postId);
      if (post && post.likes > 0) {
        post.likes -= 1;
        await this.savePostsToStorage();
      }
    }
  }

  /**
   * Like a comment
   */
  async likeComment(commentId: string): Promise<void> {
    try {
      await apiService.likeComment(commentId);
    } catch (error) {
      console.warn('API not available, using mock like:', error);
      const comment = MOCK_COMMENTS.find(c => c.id === commentId);
      if (comment) {
        comment.likes += 1;
        await this.saveCommentsToStorage();
      }
    }
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

