import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InstructorData {
  id: string;
  name: string;
  email: string;
}

function convertToCSV(data: any[], columns?: string[]): string {
  if (data.length === 0) return "";
  
  const headers = columns || Object.keys(data[0]);
  const csvRows = [headers.join(",")];
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
    });
    csvRows.push(values.join(","));
  }
  
  return csvRows.join("\n");
}

async function generateBackupData(supabase: any, instructorId: string) {
  console.log(`Generating backup data for instructor: ${instructorId}`);
  
  // Fetch all instructor data
  const [pupilsRes, lessonsRes, scheduleRes, paymentsRes, expensesRes] = await Promise.all([
    supabase.from("pupils").select("*").eq("instructor_id", instructorId).is("deleted_at", null),
    supabase.from("lesson_history").select("*").eq("instructor_id", instructorId).is("deleted_at", null).order("lesson_date", { ascending: false }),
    supabase.from("scheduled_lessons").select("*").eq("instructor_id", instructorId).is("deleted_at", null).order("lesson_date", { ascending: false }),
    supabase.from("payment_history").select("*").eq("instructor_id", instructorId).is("deleted_at", null).order("recorded_at", { ascending: false }),
    supabase.from("instructor_expenses").select("*").eq("instructor_id", instructorId).is("deleted_at", null).order("expense_date", { ascending: false }),
  ]);

  const pupils = pupilsRes.data || [];
  const lessons = lessonsRes.data || [];
  const schedule = scheduleRes.data || [];
  const payments = paymentsRes.data || [];
  const expenses = expensesRes.data || [];

  console.log(`Data counts - Pupils: ${pupils.length}, Lessons: ${lessons.length}, Schedule: ${schedule.length}, Payments: ${payments.length}, Expenses: ${expenses.length}`);

  // Generate summary stats
  const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
  const activePupils = pupils.filter((p: any) => !p.test_passed).length;
  const passedPupils = pupils.filter((p: any) => p.test_passed).length;

  return {
    pupils,
    lessons,
    schedule,
    payments,
    expenses,
    stats: {
      totalPupils: pupils.length,
      activePupils,
      passedPupils,
      totalLessons: lessons.length,
      scheduledLessons: schedule.length,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    }
  };
}

function generateEmailHTML(instructorName: string, stats: any, backupDate: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-box { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
        .attachments { background: white; padding: 15px; border-radius: 8px; margin-top: 20px; }
        .attachment-item { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .attachment-item:last-child { border-bottom: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;">📊 Weekly Data Backup</h1>
          <p style="margin:10px 0 0 0; opacity:0.9;">Hello ${instructorName}!</p>
        </div>
        <div class="content">
          <p>Here's your weekly data backup for <strong>${backupDate}</strong>. Your data files are attached to this email.</p>
          
          <h3>📈 Quick Stats</h3>
          <div class="stat-grid">
            <div class="stat-box">
              <div class="stat-value">${stats.totalPupils}</div>
              <div class="stat-label">Total Pupils</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.activePupils}</div>
              <div class="stat-label">Active Learners</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.totalLessons}</div>
              <div class="stat-label">Lessons Completed</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">£${stats.totalRevenue.toFixed(2)}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
          </div>

          <div class="attachments">
            <h4 style="margin-top:0;">📎 Attached Files</h4>
            <div class="attachment-item">📋 pupils.csv - Your complete pupil list</div>
            <div class="attachment-item">📖 lesson_history.csv - Lesson records</div>
            <div class="attachment-item">📅 scheduled_lessons.csv - Upcoming lessons</div>
            <div class="attachment-item">💷 payments.csv - Payment history</div>
            <div class="attachment-item">💰 expenses.csv - Expense records</div>
          </div>

          <p style="margin-top:20px; color:#6b7280; font-size:14px;">
            💡 <strong>Tip:</strong> You can also download a full backup anytime from Settings → Data Export in your instructor app.
          </p>
        </div>
        <div class="footer">
          <p>This is an automated backup from EveryDriver</p>
          <p>© ${new Date().getFullYear()} EveryDriver. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting weekly backup email job...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active instructors with email addresses
    const { data: instructors, error: instructorsError } = await supabase
      .from("instructors")
      .select("id, name, email")
      .eq("is_active", true)
      .not("email", "is", null);

    if (instructorsError) {
      console.error("Error fetching instructors:", instructorsError);
      throw instructorsError;
    }

    console.log(`Found ${instructors?.length || 0} instructors with emails`);

    const results: { instructor: string; success: boolean; error?: string }[] = [];
    const backupDate = new Date().toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    for (const instructor of (instructors || []) as InstructorData[]) {
      if (!instructor.email) continue;

      try {
        console.log(`Processing backup for: ${instructor.name} (${instructor.email})`);
        
        const backupData = await generateBackupData(supabase, instructor.id);
        
        // Generate CSV attachments using btoa for base64 encoding
        const attachments = [
          {
            filename: "pupils.csv",
            content: btoa(unescape(encodeURIComponent(convertToCSV(backupData.pupils)))),
          },
          {
            filename: "lesson_history.csv",
            content: btoa(unescape(encodeURIComponent(convertToCSV(backupData.lessons)))),
          },
          {
            filename: "scheduled_lessons.csv",
            content: btoa(unescape(encodeURIComponent(convertToCSV(backupData.schedule)))),
          },
          {
            filename: "payments.csv",
            content: btoa(unescape(encodeURIComponent(convertToCSV(backupData.payments)))),
          },
          {
            filename: "expenses.csv",
            content: btoa(unescape(encodeURIComponent(convertToCSV(backupData.expenses)))),
          },
        ];

        // Send email with attachments
        const emailResponse = await resend.emails.send({
          from: "EveryDriver <onboarding@resend.dev>",
          to: [instructor.email],
          subject: `📊 Your Weekly Data Backup - ${backupDate}`,
          html: generateEmailHTML(instructor.name, backupData.stats, backupDate),
          attachments: attachments.map(att => ({
            filename: att.filename,
            content: att.content,
          })),
        });

        console.log(`Email sent to ${instructor.email}:`, emailResponse);
        results.push({ instructor: instructor.name, success: true });

      } catch (error: any) {
        console.error(`Failed to send backup to ${instructor.email}:`, error);
        results.push({ instructor: instructor.name, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Backup job complete. ${successCount}/${results.length} emails sent successfully.`);

    return new Response(
      JSON.stringify({ 
        message: `Weekly backup complete. ${successCount}/${results.length} emails sent.`,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in weekly backup function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
