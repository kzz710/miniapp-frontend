// 用户 / 发布 / 审批 契约（与后端 snake_case 保持一致）。
import type { CalcParams, EnergyType, PlanMode, Verdict } from './car';

export interface UserInfo {
  user_id: string;
  username: string;
  avatar_text: string;
  avatar_color: string;
  created_at?: string | null;
}

export interface LoginResponse {
  token: string;
  expires_in: number;
  user: UserInfo;
}

export interface Author {
  user_id: string;
  username: string;
  avatar_text: string;
  avatar_color: string;
}

export interface Review {
  id: number;
  decision: Verdict;
  decision_text: string;
  /** 预设标签 key，与后端白名单一致 */
  tags: string[];
  /** 兼容字段：历史数据可能仍有文本，前端不再展示 */
  comment: string;
  author: Author;
  created_at?: string | null;
}

export interface Finance {
  income?: number | null;
  monthly_expense?: number | null;
  savings?: number | null;
  disposable_income?: number | null;
  safe_monthly_payment?: number | null;
}

export interface PostItem {
  id: number;
  title: string;
  remark?: string | null;
  car_brand: string;
  car_model: string;
  car_config: string;
  energy_type: EnergyType;
  ref_price: number;
  price: number;
  mode: PlanMode;
  landed_price: number;
  monthly_payment: number;
  total_interest: number;
  energy_cost_month: number;
  verdict: Verdict;
  verdict_text: string;
  review_count: number;
  buy_count: number;
  consider_count: number;
  avoid_count: number;
  author: Author;
  is_mine: boolean;
  my_review?: Review | null;
  created_at?: string | null;
}

export interface PostDetail extends PostItem {
  reason: string;
  show_finance: boolean;
  finance?: Finance | null;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  has_more: boolean;
}

export interface ReviewSubmitResult {
  my_review: Review;
  review_count: number;
  buy_count: number;
  consider_count: number;
  avoid_count: number;
}

export interface PostCarSnapshot {
  brand: string;
  model: string;
  config: string;
  energy_type: EnergyType;
  guide_price: number;
  ref_discount_price: number;
  fuel_consumption: number;
  power_consumption: number;
}

export interface CreatePostPayload {
  car: PostCarSnapshot;
  plan: CalcParams;
  show_finance: boolean;
}

export interface UserSummary {
  post_count: number;
  received_review_count: number;
}

export type ReviewDecision = Verdict;
