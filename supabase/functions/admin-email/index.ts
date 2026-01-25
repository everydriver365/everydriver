import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  seen: boolean;
}

// Simple IMAP client using raw TCP
async function fetchEmailsViaIMAP(): Promise<EmailMessage[]> {
  const host = "ukm41.siteground.biz";
  const port = 993;
  const user = "info@everydriver.co.uk";
  const pass = Deno.env.get("ADMIN_EMAIL_PASSWORD") || "";

  // Use Deno's built-in TLS connection
  const conn = await Deno.connectTls({ hostname: host, port });
  
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const buffer = new Uint8Array(16384);
  
  // Helper to read response
  async function readResponse(): Promise<string> {
    const n = await conn.read(buffer);
    if (n === null) return "";
    return decoder.decode(buffer.subarray(0, n));
  }
  
  // Helper to send command
  async function sendCommand(cmd: string): Promise<string> {
    await conn.write(encoder.encode(cmd + "\r\n"));
    // Wait a bit and read response
    await new Promise(r => setTimeout(r, 200));
    return await readResponse();
  }
  
  try {
    // Read greeting
    await readResponse();
    
    // Login
    const loginRes = await sendCommand(`A001 LOGIN "${user}" "${pass}"`);
    if (!loginRes.includes("OK")) {
      throw new Error("Login failed");
    }
    
    // Select INBOX
    const selectRes = await sendCommand("A002 SELECT INBOX");
    
    // Extract message count
    const existsMatch = selectRes.match(/(\d+) EXISTS/);
    const messageCount = existsMatch ? parseInt(existsMatch[1], 10) : 0;
    
    if (messageCount === 0) {
      await sendCommand("A003 LOGOUT");
      conn.close();
      return [];
    }
    
    // Fetch last 10 messages headers
    const start = Math.max(1, messageCount - 9);
    const fetchRes = await sendCommand(`A003 FETCH ${start}:${messageCount} (FLAGS ENVELOPE)`);
    
    // Parse emails (simplified parsing)
    const emails: EmailMessage[] = [];
    const lines = fetchRes.split("\n");
    
    let currentEmail: Partial<EmailMessage> | null = null;
    
    for (const line of lines) {
      const fetchMatch = line.match(/\* (\d+) FETCH/);
      if (fetchMatch) {
        if (currentEmail?.id) {
          emails.push(currentEmail as EmailMessage);
        }
        currentEmail = {
          id: fetchMatch[1],
          subject: "",
          from: "",
          date: new Date().toISOString(),
          seen: line.includes("\\Seen"),
        };
      }
      
      if (currentEmail) {
        // Try to extract subject
        const subjectMatch = line.match(/SUBJECT\s+"([^"]*(?:\\.[^"]*)*)"/i);
        if (subjectMatch) {
          currentEmail.subject = subjectMatch[1].replace(/\\"/g, '"');
        }
        
        // Try to extract from
        const fromMatch = line.match(/FROM\s+\(\("?([^"()]+)"?\s/i);
        if (fromMatch) {
          currentEmail.from = fromMatch[1];
        }
        
        // Try to extract date
        const dateMatch = line.match(/INTERNALDATE\s+"([^"]+)"/i);
        if (dateMatch) {
          currentEmail.date = new Date(dateMatch[1]).toISOString();
        }
      }
    }
    
    if (currentEmail?.id) {
      emails.push(currentEmail as EmailMessage);
    }
    
    // Logout
    await sendCommand("A004 LOGOUT");
    conn.close();
    
    return emails.reverse(); // Newest first
  } catch (error) {
    conn.close();
    throw error;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();

    if (action === "fetch") {
      const emails = await fetchEmailsViaIMAP();
      return new Response(JSON.stringify({ emails }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Email error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch emails";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
