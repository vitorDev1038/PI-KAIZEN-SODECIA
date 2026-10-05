import { supabase } from './supabase';

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  active?: boolean;
  created_at?: string;
}

export const DEFAULT_REWARDS: RewardItem[] = [
  {
    id: 'rw-1',
    title: 'Garrafa Térmica Exclusiva Sodecia',
    description: 'Squeeze inox com a logo Sodecia Kaizen',
    points: 30,
    icon: 'Gift',
  },
  {
    id: 'rw-2',
    title: 'Voucher Almoço Especial',
    description: 'Almoço VIP no restaurante executivo Sodecia',
    points: 50,
    icon: 'Star',
  },
  {
    id: 'rw-3',
    title: 'Camisa Polo Sodecia Kaizen Team',
    description: 'Edição limitada para colaboradores inovadores',
    points: 80,
    icon: 'Award',
  },
  {
    id: 'rw-4',
    title: 'Folga no Dia do Aniversário',
    description: 'Dia livre remunerado no seu aniversário',
    points: 120,
    icon: 'Sparkles',
  },
];

const LOCAL_STORAGE_REWARDS_KEY = 'kaizen_custom_rewards_v1';

export function getLocalRewards(): RewardItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REWARDS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_REWARDS;
  } catch {
    return DEFAULT_REWARDS;
  }
}

export function saveLocalRewards(rewards: RewardItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_REWARDS_KEY, JSON.stringify(rewards));
  } catch {
    // Ignore
  }
}

export async function fetchRewards(): Promise<RewardItem[]> {
  try {
    const { data, error } = await supabase.from('rewards').select('*').order('points', { ascending: true });
    if (!error && data && data.length > 0) {
      saveLocalRewards(data as RewardItem[]);
      return data as RewardItem[];
    }
  } catch {
    // Fallback to local storage
  }
  return getLocalRewards();
}

export async function createReward(newReward: Omit<RewardItem, 'id'>): Promise<RewardItem> {
  const item: RewardItem = {
    id: `rw-${Date.now()}`,
    ...newReward,
  };

  // 1. Save in local storage
  const current = getLocalRewards();
  current.push(item);
  saveLocalRewards(current);

  // 2. Try to save in Supabase DB
  try {
    const { data, error } = await supabase.from('rewards').insert(item).select().single();
    if (!error && data) {
      return data as RewardItem;
    }
  } catch {
    // Ignore DB error
  }

  return item;
}

export async function deleteReward(rewardId: string): Promise<boolean> {
  const current = getLocalRewards().filter((r) => r.id !== rewardId);
  saveLocalRewards(current);

  try {
    await supabase.from('rewards').delete().eq('id', rewardId);
  } catch {
    // Ignore
  }
  return true;
}
