'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Staff, Expense, ExpenseWithStaff } from '@/types/database';

// ============================================================
// STAFF ACTIONS
// ============================================================

export async function getStaff(gymId: string): Promise<{
  success: boolean;
  data?: Staff[];
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('gym_id', gymId)
      .order('full_name', { ascending: true });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Get staff error:', error);
    return { success: false, error: error.message };
  }
}

export async function createStaff(data: {
  gym_id: string;
  full_name: string;
  role: string;
  phone?: string;
  email?: string;
  salary: number;
  salary_frequency: 'monthly' | 'weekly' | 'daily';
  hire_date: string;
}): Promise<{ success: boolean; data?: Staff; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: staff, error } = await supabase
      .from('staff')
      .insert({
        gym_id: data.gym_id,
        full_name: data.full_name,
        role: data.role,
        phone: data.phone || null,
        email: data.email || null,
        salary: data.salary,
        salary_frequency: data.salary_frequency,
        hire_date: data.hire_date,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, data: staff };
  } catch (error: any) {
    console.error('Create staff error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateStaff(
  staffId: string,
  updates: Partial<Staff>
): Promise<{ success: boolean; data?: Staff; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', staffId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, data };
  } catch (error: any) {
    console.error('Update staff error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteStaff(staffId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', staffId);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Delete staff error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// EXPENSES ACTIONS
// ============================================================

export async function getExpenses(
  gymId: string,
  filters?: { category?: string; startDate?: string; endDate?: string }
): Promise<{
  success: boolean;
  data?: ExpenseWithStaff[];
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    let query = supabase
      .from('expenses')
      .select(`*, staff:staff(id, full_name, role)`)
      .eq('gym_id', gymId)
      .order('expense_date', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.startDate) {
      query = query.gte('expense_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('expense_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: (data || []) as ExpenseWithStaff[] };
  } catch (error: any) {
    console.error('Get expenses error:', error);
    return { success: false, error: error.message };
  }
}

export async function createExpense(data: {
  gym_id: string;
  category: string;
  description?: string;
  amount: number;
  currency?: string;
  expense_date: string;
  is_recurring?: boolean;
  recurrence_frequency?: 'monthly' | 'quarterly' | 'yearly';
  staff_id?: string;
}): Promise<{ success: boolean; data?: Expense; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        gym_id: data.gym_id,
        category: data.category,
        description: data.description || null,
        amount: data.amount,
        currency: data.currency || 'INR',
        expense_date: data.expense_date,
        is_recurring: data.is_recurring || false,
        recurrence_frequency: data.recurrence_frequency || null,
        staff_id: data.staff_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, data: expense };
  } catch (error: any) {
    console.error('Create expense error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateExpense(
  expenseId: string,
  updates: Partial<Expense>
): Promise<{ success: boolean; data?: Expense; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true, data };
  } catch (error: any) {
    console.error('Update expense error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteExpense(expenseId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Delete expense error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// FINANCIAL SUMMARY
// ============================================================

export async function getFinancialSummary(
  gymId: string,
  month?: string
): Promise<{
  success: boolean;
  data?: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    staffSalaryTotal: number;
  };
  error?: string;
}> {
  try {
    const supabase = createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Build date range for the month filter
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (month) {
      // month format: YYYY-MM
      startDate = `${month}-01`;
      const [year, mon] = month.split('-').map(Number);
      const lastDay = new Date(year, mon, 0).getDate();
      endDate = `${month}-${String(lastDay).padStart(2, '0')}`;
    }

    // Get total revenue from payments
    let paymentsQuery = supabase
      .from('payments')
      .select('amount')
      .eq('gym_id', gymId)
      .eq('status', 'completed');

    if (startDate) paymentsQuery = paymentsQuery.gte('payment_date', startDate);
    if (endDate) paymentsQuery = paymentsQuery.lte('payment_date', endDate);

    const { data: payments } = await paymentsQuery;
    const totalRevenue = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    // Get total expenses
    let expensesQuery = supabase
      .from('expenses')
      .select('amount')
      .eq('gym_id', gymId);

    if (startDate) expensesQuery = expensesQuery.gte('expense_date', startDate);
    if (endDate) expensesQuery = expensesQuery.lte('expense_date', endDate);

    const { data: expenses } = await expensesQuery;
    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);

    // Get staff salary total (active staff)
    const { data: staffList } = await supabase
      .from('staff')
      .select('salary, salary_frequency')
      .eq('gym_id', gymId)
      .eq('is_active', true);

    let staffSalaryTotal = 0;
    (staffList || []).forEach((s) => {
      // Normalize to monthly salary
      switch (s.salary_frequency) {
        case 'daily':
          staffSalaryTotal += s.salary * 30;
          break;
        case 'weekly':
          staffSalaryTotal += s.salary * 4;
          break;
        case 'monthly':
        default:
          staffSalaryTotal += s.salary;
          break;
      }
    });

    const netProfit = totalRevenue - totalExpenses;

    return {
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        staffSalaryTotal,
      },
    };
  } catch (error: any) {
    console.error('Get financial summary error:', error);
    return { success: false, error: error.message };
  }
}
