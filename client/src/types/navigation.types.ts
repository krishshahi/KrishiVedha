import { CommunityPost } from '../store/slices/communitySlice';

export type AppStackParamList = {
  PostDetail: {
    post: CommunityPost;
  };
};
