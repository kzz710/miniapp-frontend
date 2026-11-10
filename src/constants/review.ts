// 审批标签白名单：与后端 app/services/review_tags.py 保持一致
export interface ReviewTagOption {
  key: string;
  label: string;
}

export const REVIEW_TAGS: ReviewTagOption[] = [
  { key: 'high_payment', label: '月供偏高' },
  { key: 'low_down', label: '首付偏低' },
  { key: 'high_cost', label: '用车成本高' },
  { key: 'save_more', label: '建议再攒几个月' },
  { key: 'negotiate', label: '价格还能谈' },
  { key: 'better_choice', label: '同价位有更好选择' },
  { key: 'good_commute', label: '适合通勤' },
];

export const REVIEW_TAG_LABEL: Record<string, string> = REVIEW_TAGS.reduce(
  (acc, item) => {
    acc[item.key] = item.label;
    return acc;
  },
  {} as Record<string, string>,
);

export const MAX_REVIEW_TAGS = 3;
