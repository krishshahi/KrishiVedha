import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/apiService';
import { CommunityPost as CommunityPostType, Comment } from '../../types/user.types';
import communityService from '../../services/communityService';

// Extend the type for Redux state compatibility
export interface CommunityPost extends CommunityPostType {
  userId?: string; // For backward compatibility
  userName?: string; // For backward compatibility
  category?: string; // For backward compatibility
  images?: string[];
}

export interface CommunityState {
  posts: CommunityPost[];
  currentPost: CommunityPost | null;
  comments: { [postId: string]: Comment[] };
  isLoading: boolean;
  error: string | null;
  currentCategory: string | null;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

const initialState: CommunityState = {
  posts: [],
  currentPost: null,
  comments: {},
  isLoading: false,
  error: null,
  currentCategory: null,
  pagination: {
    page: 1,
    limit: 10,
    hasMore: true,
  },
};

// Async thunks
export const fetchCommunityPosts = createAsyncThunk(
  'community/fetchPosts',
  async (params: { category?: string; userId?: string; limit?: number; page?: number } = {}, { rejectWithValue }) => {
    try {
      const posts = await apiService.getCommunityPosts(params);
      return { posts, params };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch community posts');
    }
  }
);

export const createCommunityPost = createAsyncThunk(
  'community/createPost',
  async (postData: Omit<CommunityPost, 'id' | 'likes' | 'comments' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const newPost = await apiService.createCommunityPost(postData);
      return newPost;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create community post');
    }
  }
);

export const loadMorePosts = createAsyncThunk(
  'community/loadMore',
  async (params: { category?: string; userId?: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { community: CommunityState };
      const { pagination } = state.community;
      
      const posts = await apiService.getCommunityPosts({
        ...params,
        page: pagination.page + 1,
        limit: pagination.limit,
      });
      
      return { posts, page: pagination.page + 1 };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load more posts');
    }
  }
);

export const fetchCommentsForPost = createAsyncThunk(
  'community/fetchComments',
  async (postId: string, { rejectWithValue }) => {
    try {
      const comments = await communityService.getCommentsForPost(postId);
      return { postId, comments };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch comments');
    }
  }
);

export const addCommentToPost = createAsyncThunk(
  'community/addComment',
  async (
    { postId, content, authorId, authorName }: 
    { postId: string; content: string; authorId: string; authorName: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const newComment = await communityService.addComment(postId, content, authorId, authorName);
      // Update post comment count
      dispatch(updatePostComments({ postId, comments: (await communityService.getCommentsForPost(postId)).length }));
      return { postId, comment: newComment };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add comment');
    }
  }
);

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentPost: (state, action: PayloadAction<CommunityPost>) => {
      state.currentPost = action.payload;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
    setCurrentCategory: (state, action: PayloadAction<string | null>) => {
      state.currentCategory = action.payload;
      // Reset pagination when category changes
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },
    clearPosts: (state) => {
      state.posts = [];
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },
    updatePostLikes: (state, action: PayloadAction<{ postId: string; likes: number }>) => {
      const post = state.posts.find(p => p.id === action.payload.postId);
      if (post) {
        post.likes = action.payload.likes;
      }
      if (state.currentPost && state.currentPost.id === action.payload.postId) {
        state.currentPost.likes = action.payload.likes;
      }
    },
    updatePostComments: (state, action: PayloadAction<{ postId: string; comments: number }>) => {
      const post = state.posts.find(p => p.id === action.payload.postId);
      if (post) {
        post.comments = action.payload.comments;
      }
      if (state.currentPost && state.currentPost.id === action.payload.postId) {
        state.currentPost.comments = action.payload.comments;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch community posts
      .addCase(fetchCommunityPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCommunityPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        const { posts, params } = action.payload;
        
        // If it's a new category or first load, replace posts
        if (params?.page === 1 || !params?.page) {
          state.posts = posts;
          state.pagination.page = 1;
        } else {
          // Append to existing posts
          state.posts.push(...posts);
        }
        
        // Update pagination
        state.pagination.hasMore = posts.length === state.pagination.limit;
        
        // Update current category if provided
        if (params?.category !== undefined) {
          state.currentCategory = params.category;
        }
      })
      .addCase(fetchCommunityPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create community post
      .addCase(createCommunityPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCommunityPost.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add new post to the beginning of the list
        state.posts.unshift(action.payload);
        state.currentPost = action.payload;
      })
      .addCase(createCommunityPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Load more posts
      .addCase(loadMorePosts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadMorePosts.fulfilled, (state, action) => {
        state.isLoading = false;
        const { posts, page } = action.payload;
        state.posts.push(...posts);
        state.pagination.page = page;
        state.pagination.hasMore = posts.length === state.pagination.limit;
      })
      .addCase(loadMorePosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch comments for post
      .addCase(fetchCommentsForPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCommentsForPost.fulfilled, (state, action) => {
        state.isLoading = false;
        const { postId, comments } = action.payload;
        state.comments[postId] = comments;
      })
      .addCase(fetchCommentsForPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Add comment to post
      .addCase(addCommentToPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addCommentToPost.fulfilled, (state, action) => {
        state.isLoading = false;
        const { postId, comment } = action.payload;
        if (!state.comments[postId]) {
          state.comments[postId] = [];
        }
        state.comments[postId].push(comment);
      })
      .addCase(addCommentToPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setCurrentPost,
  clearCurrentPost,
  setCurrentCategory,
  clearPosts,
  updatePostLikes,
  updatePostComments,
} = communitySlice.actions;

export default communitySlice.reducer;

