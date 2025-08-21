import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../constants/colors';

export const communityScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  
  createPostFloatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
    bottom: 20,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  
  createPostFloatingButtonText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  
  // Search Bar Styles
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  
  searchButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  searchButtonText: {
    fontSize: 18,
  },
  
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Category Filter Styles
  categoryFilterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  categoryFilterActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  
  categoryFilterText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  categoryFilterTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Post Card Styles
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: COLORS.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  
  avatarPlaceholder: {
    fontSize: 18,
  },
  
  postHeaderInfo: {
    flex: 1,
  },
  
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  
  postTime: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  
  // Post Images Styles
  postImagesContainer: {
    marginVertical: 12,
    marginHorizontal: -4,
  },
  
  postImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  
  // Tags Styles
  tagChip: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  
  tagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  
  // Post Actions Styles
  postActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  
  actionIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  
  actionText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  
  emptyStateMessage: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  
  modalCloseButton: {
    fontSize: 24,
    color: COLORS.text.secondary,
    padding: 4,
  },
  
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  cancelButton: {
    backgroundColor: COLORS.background.secondary,
    marginRight: 8,
  },
  
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  
  createButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Form Input Styles
  postContentInput: {
    minHeight: 120,
    fontSize: 14,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    marginTop: 12,
  },
  
  tagsInput: {
    height: 40,
    fontSize: 14,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  
  categoryChipActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  
  categoryChipText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  categoryChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Image Upload Styles
  imageUploadButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  imageUploadButtonIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  
  imageUploadButtonText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  imageCount: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 'auto',
  },
  
  imagePreviewContainer: {
    marginVertical: 12,
  },
  
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  removeImageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Post Detail Modal Styles
  postDetailContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  postDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#fff',
  },
  
  backButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  postDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  
  shareButton: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  postDetailContent: {
    flex: 1,
  },
  
  postDetailPost: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  postDetailContentText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  
  postDetailImages: {
    marginVertical: 16,
  },
  
  postDetailImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  
  postDetailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 12,
  },
  
  postDetailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  postDetailStatButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  postDetailStatText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  
  // Comments Section Styles
  commentsSection: {
    flex: 1,
    padding: 16,
  },
  
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  
  commentItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  commentTime: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.primary,
  },
  
  noComments: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text.primary,
    marginRight: 8,
  },
  
  sendCommentButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  sendCommentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
