import { supabase } from './supabase';

export interface TicketItem {
  id: string;
  code: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  reward_title: string;
  reward_description?: string;
  points_spent: number;
  status: 'active' | 'used';
  created_at: string;
  used_at?: string | null;
}

const LOCAL_STORAGE_KEY = 'kaizen_tickets_fallback_v1';

/**
 * Helper to get local fallback tickets from localStorage
 */
function getLocalTickets(): TicketItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Helper to save local fallback tickets to localStorage
 */
function saveLocalTickets(tickets: TicketItem[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tickets));
  } catch {
    // Ignore error
  }
}

/**
 * Creates and stores a new redemption ticket in Supabase (with localStorage fallback).
 */
export async function createRedemptionTicket(
  userId: string,
  userName: string,
  userEmail: string,
  rewardTitle: string,
  rewardDescription: string,
  pointsSpent: number
): Promise<TicketItem> {
  const code = `SOD-TICK-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  const newTicket: TicketItem = {
    id: `tick-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    code,
    user_id: userId,
    user_name: userName,
    user_email: userEmail,
    reward_title: rewardTitle,
    reward_description: rewardDescription,
    points_spent: pointsSpent,
    status: 'active',
    created_at: now,
  };

  // 1. Save in local storage first for instant resilience
  const localList = getLocalTickets();
  localList.unshift(newTicket);
  saveLocalTickets(localList);

  // 2. Try to save in Supabase DB
  try {
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        code: newTicket.code,
        user_id: userId,
        reward_title: rewardTitle,
        reward_description: rewardDescription,
        points_spent: pointsSpent,
        status: 'active',
      })
      .select()
      .single();

    if (!error && data) {
      newTicket.id = data.id;
    }
  } catch {
    // Ignore DB error, local fallback keeps it safe
  }

  return newTicket;
}

/**
 * Fetches tickets for a specific user (from DB or local storage).
 */
export async function getUserTickets(userId: string): Promise<TicketItem[]> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as TicketItem[];
    }
  } catch {
    // Fallback to local storage
  }

  const localList = getLocalTickets();
  return localList.filter((t) => t.user_id === userId);
}

/**
 * Fetches ALL tickets for RH / Admin management (from DB or local storage).
 */
export async function getAllTickets(): Promise<TicketItem[]> {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, profile:profiles(full_name, email)')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        ...item,
        user_name: item.profile?.full_name || 'Colaborador',
        user_email: item.profile?.email || '',
      }));
    }
  } catch {
    // Fallback to local storage
  }

  return getLocalTickets();
}

/**
 * Marks a ticket as USED / DELIVERED by RH (in DB & local storage).
 */
export async function markTicketAsUsed(ticketCode: string): Promise<{ success: boolean; message: string }> {
  const codeFormatted = ticketCode.trim().toUpperCase();
  const now = new Date().toISOString();

  // 1. Update in local storage
  const localList = getLocalTickets();
  const targetLocalIndex = localList.findIndex((t) => t.code.toUpperCase() === codeFormatted);

  if (targetLocalIndex !== -1) {
    if (localList[targetLocalIndex].status === 'used') {
      return { success: false, message: `Este ticket (${codeFormatted}) já foi utilizado anteriormente!` };
    }
    localList[targetLocalIndex].status = 'used';
    localList[targetLocalIndex].used_at = now;
    saveLocalTickets(localList);
  }

  // 2. Update in Supabase DB
  try {
    // Check ticket status first
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('*')
      .eq('code', codeFormatted)
      .maybeSingle();

    if (existingTicket) {
      if (existingTicket.status === 'used') {
        return { success: false, message: `Este ticket (${codeFormatted}) já foi retirado/utilizado no RH!` };
      }

      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'used', used_at: now })
        .eq('code', codeFormatted);

      if (updateError) {
        return { success: false, message: `Erro ao atualizar ticket: ${updateError.message}` };
      }
    }
  } catch {
    // If DB fails, local storage update succeeded
  }

  return { success: true, message: `Ticket ${codeFormatted} validado e marcado como ENTREGUE com sucesso!` };
}
