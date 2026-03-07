import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Platform API configurations
const platformApis: Record<string, {
  expenseEndpoint: (tenantId: string) => string;
  incomeEndpoint: (tenantId: string) => string;
  headers: (token: string, tenantId?: string) => Record<string, string>;
  formatExpense: (exp: any, category: string) => any;
  formatIncome: (lesson: any, amount: number) => any;
  tokenUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
}> = {
  xero: {
    expenseEndpoint: () => 'https://api.xero.com/api.xro/2.0/BankTransactions',
    incomeEndpoint: () => 'https://api.xero.com/api.xro/2.0/Invoices',
    headers: (token, tenantId) => ({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Xero-Tenant-Id': tenantId || '',
    }),
    formatExpense: (exp, category) => ({
      Type: 'SPEND',
      Contact: { Name: exp.description || category },
      Date: exp.expense_date,
      LineItems: [{
        Description: exp.description || category,
        Quantity: 1,
        UnitAmount: exp.amount,
        AccountCode: getXeroCode(category),
        TaxType: 'INPUT2',
      }],
      Status: 'AUTHORISED',
    }),
    formatIncome: (lesson, amount) => ({
      Type: 'ACCREC',
      Contact: { Name: lesson.pupil_name || 'Student' },
      Date: lesson.lesson_date,
      DueDate: lesson.lesson_date,
      LineItems: [{
        Description: `Driving Lesson - ${lesson.pupil_name || 'Student'}`,
        Quantity: 1,
        UnitAmount: amount,
        AccountCode: '200',
        TaxType: 'NONE',
      }],
      Status: 'AUTHORISED',
    }),
    tokenUrl: 'https://identity.xero.com/connect/token',
    clientIdEnv: 'XERO_CLIENT_ID',
    clientSecretEnv: 'XERO_CLIENT_SECRET',
  },
  quickbooks: {
    expenseEndpoint: (tenantId) => `https://quickbooks.api.intuit.com/v3/company/${tenantId}/purchase`,
    incomeEndpoint: (tenantId) => `https://quickbooks.api.intuit.com/v3/company/${tenantId}/invoice`,
    headers: (token) => ({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
    formatExpense: (exp, category) => ({
      PaymentType: 'Cash',
      TotalAmt: exp.amount,
      TxnDate: exp.expense_date,
      Line: [{
        Amount: exp.amount,
        DetailType: 'AccountBasedExpenseLineDetail',
        AccountBasedExpenseLineDetail: {
          AccountRef: { name: getQBOCategory(category) },
        },
        Description: exp.description || category,
      }],
    }),
    formatIncome: (lesson, amount) => ({
      TxnDate: lesson.lesson_date,
      Line: [{
        Amount: amount,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: { ItemRef: { name: 'Services' } },
        Description: `Driving Lesson - ${lesson.pupil_name || 'Student'}`,
      }],
      CustomerRef: { name: lesson.pupil_name || 'Student' },
    }),
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    clientIdEnv: 'QBO_CLIENT_ID',
    clientSecretEnv: 'QBO_CLIENT_SECRET',
  },
  freeagent: {
    expenseEndpoint: () => 'https://api.freeagent.com/v2/bills',
    incomeEndpoint: () => 'https://api.freeagent.com/v2/invoices',
    headers: (token) => ({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    formatExpense: (exp, category) => ({
      bill: {
        dated_on: exp.expense_date,
        total_value: exp.amount.toFixed(2),
        category: getFreeAgentCategory(category),
        description: exp.description || category,
      },
    }),
    formatIncome: (lesson, amount) => ({
      invoice: {
        dated_on: lesson.lesson_date,
        payment_terms_in_days: 0,
        invoice_items: [{
          description: `Driving Lesson - ${lesson.pupil_name || 'Student'}`,
          quantity: 1,
          price: amount.toFixed(2),
        }],
      },
    }),
    tokenUrl: 'https://api.freeagent.com/v2/token_endpoint',
    clientIdEnv: 'FREEAGENT_CLIENT_ID',
    clientSecretEnv: 'FREEAGENT_CLIENT_SECRET',
  },
  sage: {
    expenseEndpoint: () => 'https://api.accounting.sage.com/v3.1/purchase_invoices',
    incomeEndpoint: () => 'https://api.accounting.sage.com/v3.1/sales_invoices',
    headers: (token) => ({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    formatExpense: (exp, category) => ({
      date: exp.expense_date,
      total_amount: exp.amount.toFixed(2),
      invoice_lines: [{
        description: exp.description || category,
        quantity: 1,
        unit_price: exp.amount.toFixed(2),
        ledger_account_id: getSageCode(category),
      }],
    }),
    formatIncome: (lesson, amount) => ({
      date: lesson.lesson_date,
      invoice_lines: [{
        description: `Driving Lesson - ${lesson.pupil_name || 'Student'}`,
        quantity: 1,
        unit_price: amount.toFixed(2),
      }],
    }),
    tokenUrl: 'https://oauth.accounting.sage.com/token',
    clientIdEnv: 'SAGE_CLIENT_ID',
    clientSecretEnv: 'SAGE_CLIENT_SECRET',
  },
};

// Category mapping helpers
function getXeroCode(cat: string) {
  const m: Record<string, string> = { Fuel:'429', 'Vehicle Maintenance':'455', Insurance:'463', 'Training Materials':'400', 'Office Supplies':'453', Marketing:'449', 'Tolls & Parking':'429' };
  return m[cat] || '499';
}
function getQBOCategory(cat: string) {
  const m: Record<string, string> = { Fuel:'Car & Van Expenses', 'Vehicle Maintenance':'Repair & Maintenance', Insurance:'Insurance', 'Training Materials':'Training Costs', Marketing:'Advertising & Marketing' };
  return m[cat] || 'Other Expenses';
}
function getFreeAgentCategory(cat: string) {
  const m: Record<string, string> = { Fuel:'Motor Expenses', 'Vehicle Maintenance':'Motor Expenses', Insurance:'Insurance', Marketing:'Advertising' };
  return m[cat] || 'General Administrative Costs';
}
function getSageCode(cat: string) {
  const m: Record<string, string> = { Fuel:'7300', 'Vehicle Maintenance':'7301', Insurance:'7104', Marketing:'6201' };
  return m[cat] || '8200';
}

async function refreshTokenIfNeeded(supabase: any, connection: any, platformApi: any) {
  if (!connection.token_expires_at) return connection.access_token;
  
  const expiresAt = new Date(connection.token_expires_at);
  if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return connection.access_token; // Still valid
  }

  if (!connection.refresh_token) throw new Error('Token expired and no refresh token');

  const clientId = Deno.env.get(platformApi.clientIdEnv);
  const clientSecret = Deno.env.get(platformApi.clientSecretEnv);
  const authHeader = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch(platformApi.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${authHeader}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token,
    }).toString(),
  });

  if (!res.ok) throw new Error('Token refresh failed');

  const tokens = await res.json();
  const newExpiry = tokens.expires_in 
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() 
    : null;

  await supabase
    .from('instructor_accounting_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || connection.refresh_token,
      token_expires_at: newExpiry,
    })
    .eq('id', connection.id);

  return tokens.access_token;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { instructor_id, platform, sync_type, period_start, period_end } = await req.json();

    if (!instructor_id || !platform || !sync_type || !period_start || !period_end) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const platformApi = platformApis[platform];
    if (!platformApi) {
      return new Response(JSON.stringify({ error: 'Unsupported platform' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get connection
    const { data: connection, error: connErr } = await supabase
      .from('instructor_accounting_connections')
      .select('*')
      .eq('instructor_id', instructor_id)
      .eq('platform', platform)
      .single();

    if (connErr || !connection) {
      return new Response(JSON.stringify({ error: 'Not connected to ' + platform }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create sync log entry
    const { data: syncLog } = await supabase
      .from('accounting_sync_log')
      .insert({
        instructor_id,
        platform,
        sync_type,
        period_start,
        period_end,
        status: 'syncing',
      })
      .select()
      .single();

    let totalSynced = 0;
    const errors: string[] = [];

    try {
      // Refresh token if needed
      const accessToken = await refreshTokenIfNeeded(supabase, connection, platformApi);
      const headers = platformApi.headers(accessToken, connection.tenant_id);

      // Sync expenses
      if (sync_type === 'expenses' || sync_type === 'both') {
        const { data: expenses } = await supabase
          .from('instructor_expenses')
          .select('*')
          .eq('instructor_id', instructor_id)
          .gte('expense_date', period_start)
          .lte('expense_date', period_end)
          .order('expense_date');

        if (expenses?.length) {
          for (const exp of expenses) {
            try {
              const payload = platformApi.formatExpense(exp, exp.category || 'Other');
              
              // Xero accepts batch - wrap in array
              const body = platform === 'xero' 
                ? JSON.stringify({ BankTransactions: [payload] })
                : JSON.stringify(payload);

              const res = await fetch(
                platformApi.expenseEndpoint(connection.tenant_id || ''),
                { method: 'POST', headers, body }
              );

              if (res.ok) {
                totalSynced++;
              } else {
                const errText = await res.text();
                errors.push(`Expense ${exp.id.slice(0,8)}: ${res.status} - ${errText.slice(0, 200)}`);
              }
            } catch (e) {
              errors.push(`Expense ${exp.id.slice(0,8)}: ${e instanceof Error ? e.message : 'Unknown error'}`);
            }
          }
        }
      }

      // Sync income
      if (sync_type === 'income' || sync_type === 'both') {
        const { data: lessons } = await supabase
          .from('scheduled_lessons')
          .select('id, lesson_date, duration_minutes, amount_due, pupils(name)')
          .eq('instructor_id', instructor_id)
          .eq('status', 'completed')
          .gte('lesson_date', period_start)
          .lte('lesson_date', period_end)
          .order('lesson_date');

        if (lessons?.length) {
          const { data: instructor } = await supabase
            .from('instructors')
            .select('hourly_rate')
            .eq('id', instructor_id)
            .single();
          const hourlyRate = instructor?.hourly_rate || 40;

          for (const lesson of lessons) {
            try {
              const amount = (lesson as any).amount_due || ((lesson as any).duration_minutes / 60) * hourlyRate;
              const pupilName = (lesson as any).pupils?.name || 'Student';
              const payload = platformApi.formatIncome({ ...lesson, pupil_name: pupilName }, amount);

              // Xero accepts batch for invoices
              const body = platform === 'xero'
                ? JSON.stringify({ Invoices: [payload] })
                : JSON.stringify(payload);

              const res = await fetch(
                platformApi.incomeEndpoint(connection.tenant_id || ''),
                { method: 'POST', headers, body }
              );

              if (res.ok) {
                totalSynced++;
              } else {
                const errText = await res.text();
                errors.push(`Income ${(lesson as any).id.slice(0,8)}: ${res.status} - ${errText.slice(0, 200)}`);
              }
            } catch (e) {
              errors.push(`Income ${(lesson as any).id.slice(0,8)}: ${e instanceof Error ? e.message : 'Unknown error'}`);
            }
          }
        }
      }

      // Update sync log
      const finalStatus = errors.length === 0 ? 'success' : (totalSynced > 0 ? 'success' : 'failed');
      await supabase
        .from('accounting_sync_log')
        .update({
          records_synced: totalSynced,
          status: finalStatus,
          error_message: errors.length > 0 ? errors.join('; ') : null,
        })
        .eq('id', syncLog.id);

      return new Response(JSON.stringify({
        success: true,
        records_synced: totalSynced,
        errors: errors.length > 0 ? errors : undefined,
        status: finalStatus,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (syncError) {
      const errMsg = syncError instanceof Error ? syncError.message : 'Sync failed';
      await supabase
        .from('accounting_sync_log')
        .update({ status: 'failed', error_message: errMsg })
        .eq('id', syncLog.id);

      return new Response(JSON.stringify({ error: errMsg, records_synced: totalSynced }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Accounting sync error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
