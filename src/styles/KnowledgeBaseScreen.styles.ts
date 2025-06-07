import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING, FONTS } from '../constants/theme';

export const knowledgeBaseScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  headerTitle: {
    fontSize: FONTS.size.xxl,
    fontWeight: 'bold',
    color: COLORS.textWhite,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    margin: SPACING.md,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 10,
    padding: SPACING.md,
    fontSize: FONTS.size.md,
    color: COLORS.text,
  },
  categoriesScrollView: {
    marginBottom: SPACING.md,
  },
  categoriesContainer: {
    paddingHorizontal: SPACING.md,
  },
  categoryTag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  selectedCategoryTag: {
    backgroundColor: COLORS.primary,
  },
  categoryTagText: {
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  selectedCategoryTagText: {
    color: COLORS.textWhite,
  },
  sectionContainer: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  featuredArticleContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  featuredArticleImagePlaceholder: {
    height: 140,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredArticleImageIcon: {
    fontSize: 60,
  },
  featuredArticleContent: {
    padding: SPACING.md,
  },
  featuredArticleTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  featuredArticleDescription: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  readMoreButtonText: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
  articleCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  articleImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  articleImagePlaceholder: {
    fontSize: 30,
  },
  articleInfo: {
    flex: 1,
  },
  articleCategory: {
    fontSize: FONTS.size.sm,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  articleTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  articleReadTime: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  trendingTopicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trendingTopic: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  trendingTopicIcon: {
    fontSize: 30,
    marginBottom: SPACING.sm,
  },
  trendingTopicText: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  videoTutorialCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    overflow: 'hidden',
  },
  videoThumbnailContainer: {
    height: 140,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayIcon: {
    fontSize: 50,
  },
  videoTitle: {
    fontSize: FONTS.size.md,
    fontWeight: 'bold',
    color: COLORS.text,
    padding: SPACING.md,
  },
  videoDuration: {
    position: 'absolute',
    right: SPACING.sm,
    bottom: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: COLORS.textWhite,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    fontSize: FONTS.size.sm,
  },
});

