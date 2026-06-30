import type { ChefRexActivityRating, ChefRexSkillRating } from './types';

export const CHEF_REX_BASE_BONUS_PERCENT = 20;
export const CHEF_REX_MAX_BONUS_PERCENT = 42;
export const CHEF_REX_DEFAULT_SKILL_RATING: ChefRexSkillRating = 4;
export const CHEF_REX_DEFAULT_ACTIVITY_RATING: ChefRexActivityRating = 3;

export function clampChefRexSkillRating(value: number): ChefRexSkillRating {
 return Math.min(5, Math.max(1, value)) as ChefRexSkillRating;
}

export function clampChefRexActivityRating(value: number): ChefRexActivityRating {
 return Math.min(5, Math.max(1, value)) as ChefRexActivityRating;
}

export function deriveChefRexBonus(
 skillRating: ChefRexSkillRating,
 activityRating: ChefRexActivityRating,
): number {
 const skillContribution = (skillRating - 1) * 3.5;
 const activityContribution = (activityRating - 1) * 2;
 const raw = CHEF_REX_BASE_BONUS_PERCENT + skillContribution + activityContribution;
 return Math.min(CHEF_REX_MAX_BONUS_PERCENT, Math.round(raw * 10) / 10);
}

export const defaultChefRexBonus = deriveChefRexBonus(
 CHEF_REX_DEFAULT_SKILL_RATING,
 CHEF_REX_DEFAULT_ACTIVITY_RATING,
);
