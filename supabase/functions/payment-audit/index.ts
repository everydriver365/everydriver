import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CANONICAL_METHODS = [
  'Cash','Bank Transfer','Square','Square Refund',
  'GoCardless Bank Pay','GoCardless Direct Debit',
  'Klarna','Clearpay','SumUp',
  'Lesson Charge','Course Bonus','Cancellation Fee','No-Show Fee',
  'Free','Refund','Manual Credit','Adjustment','Voucher','Gift'
];

const DIGITAL_METHODS = ['Square','Klarna','Clearpay','SumUp','GoCardless Bank Pay','GoCardless Direct Debit'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify admin
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const { data: roleRow } = await userClient
      .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });

    const sb = createClient(supabaseUrl, serviceKey);
    const since30 = new Date(Date.now() - 30 * 86400_000).toISOString();

    // 1. Orphan payments (no instructor_id)
    const { data: orphans } = await sb
      .from('payment_history')
      .select('id, amount, payment_method, pupil_id, recorded_at, notes')
      .is('instructor_id', null)
      .gte('recorded_at', since30)
      .order('recorded_at', { ascending: false })
      .limit(100);

    // 2. Legacy / non-canonical method labels
    const { data: badMethods } = await sb
      .from('payment_history')
      .select('id, payment_method, recorded_at, amount')
      .not('payment_method', 'in', `(${CANONICAL_METHODS.map(m => `"${m}"`).join(',')})`)
      .gte('recorded_at', since30)
      .order('recorded_at', { ascending: false })
      .limit(100);

    // 3. Duplicate external_payment_ref
    const { data: allRefs } = await sb
      .from('payment_history')
      .select('external_payment_ref, id')
      .not('external_payment_ref', 'is', null)
      .gte('recorded_at', since30);
    const refCount = new Map<string, string[]>();
    (allRefs || []).forEach((r: any) => {
      const arr = refCount.get(r.external_payment_ref) || [];
      arr.push(r.id);
      refCount.set(r.external_payment_ref, arr);
    });
    const dupes = Array.from(refCount.entries())
      .filter(([_, ids]) => ids.length > 1)
      .map(([ref, ids]) => ({ external_payment_ref: ref, count: ids.length, ids }))
      .slice(0, 50);

    // 4. Digital payments missing platform fee (last 30d)
    const { data: digitalPayments } = await sb
      .from('payment_history')
      .select('id, amount, payment_method, recorded_at, instructor_id, pupil_id')
      .in('payment_method', DIGITAL_METHODS)
      .gte('recorded_at', since30)
      .not('instructor_id', 'is', null)
      .order('recorded_at', { ascending: false })
      .limit(500);

    const { data: feeNotes } = await sb
      .from('platform_fees')
      .select('notes')
      .eq('kind', 'transaction_fee')
      .gte('created_at', since30);
    const feePaymentIds = new Set<string>();
    (feeNotes || []).forEach((f: any) => {
      const m = (f.notes || '').match(/payment_history #([0-9a-f-]+)/i);
      if (m) feePaymentIds.add(m[1]);
    });
    const missingFees = (digitalPayments || []).filter((p: any) => !feePaymentIds.has(p.id)).slice(0, 100);

    // 5. Square Refund without parent
    const { data: refunds } = await sb
      .from('payment_history')
      .select('id, amount, external_payment_ref, recorded_at, pupil_id')
      .eq('payment_method', 'Square Refund')
      .gte('recorded_at', since30)
      .order('recorded_at', { ascending: false })
      .limit(100);
    const orphanRefunds: any[] = [];
    for (const r of refunds || []) {
      if (!r.external_payment_ref) { orphanRefunds.push(r); continue; }
      // refund refs typically `square:refund:<id>` or similar — match by pupil + presence of any Square row
      const { count } = await sb
        .from('payment_history')
        .select('id', { count: 'exact', head: true })
        .eq('pupil_id', r.pupil_id)
        .eq('payment_method', 'Square');
      if (!count) orphanRefunds.push(r);
    }

    // 6. Method label distribution (last 30d)
    const { data: dist } = await sb
      .from('payment_history')
      .select('payment_method')
      .gte('recorded_at', since30);
    const methodCounts: Record<string, number> = {};
    (dist || []).forEach((r: any) => {
      methodCounts[r.payment_method || '(null)'] = (methodCounts[r.payment_method || '(null)'] || 0) + 1;
    });

    return new Response(JSON.stringify({
      generated_at: new Date().toISOString(),
      window_days: 30,
      summary: {
        total_payments_30d: dist?.length || 0,
        orphan_payments: orphans?.length || 0,
        non_canonical_methods: badMethods?.length || 0,
        duplicate_refs: dupes.length,
        digital_missing_platform_fee: missingFees.length,
        orphan_refunds: orphanRefunds.length,
      },
      orphan_payments: orphans || [],
      non_canonical_methods: badMethods || [],
      duplicate_refs: dupes,
      digital_missing_platform_fee: missingFees,
      orphan_refunds: orphanRefunds,
      method_distribution: methodCounts,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('payment-audit error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
