// 买车计划 / 审批接口。
import { request } from './request';
import type {
  CreatePostPayload,
  PageResult,
  PostDetail,
  PostItem,
  Review,
  ReviewDecision,
  ReviewSubmitResult,
  UserSummary,
} from '@/types/social';

export function createPost(payload: CreatePostPayload): Promise<PostDetail> {
  return request<PostDetail>('/api/posts', payload as any, 'POST');
}

export function fetchSquare(
  page = 1,
  size = 10,
  sort: 'latest' | 'hot' = 'latest',
): Promise<PageResult<PostItem>> {
  return request<PageResult<PostItem>>('/api/posts', { page, size, sort }, 'GET');
}

export function fetchPost(id: number): Promise<PostDetail> {
  return request<PostDetail>(`/api/posts/${id}`, undefined, 'GET');
}

export function removePost(id: number): Promise<void> {
  return request<void>(`/api/posts/${id}`, undefined, 'DELETE');
}

export function fetchReviews(
  id: number,
  page = 1,
  size = 20,
): Promise<PageResult<Review>> {
  return request<PageResult<Review>>(`/api/posts/${id}/reviews`, { page, size }, 'GET');
}

export function submitReview(
  id: number,
  decision: ReviewDecision,
  tags: string[],
): Promise<ReviewSubmitResult> {
  return request<ReviewSubmitResult>(
    `/api/posts/${id}/reviews`,
    { decision, tags },
    'POST',
  );
}

export function fetchMyPosts(page = 1, size = 10): Promise<PageResult<PostItem>> {
  return request<PageResult<PostItem>>('/api/me/posts', { page, size }, 'GET');
}

export function fetchSummary(): Promise<UserSummary> {
  return request<UserSummary>('/api/me/summary', undefined, 'GET');
}
