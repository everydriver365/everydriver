import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function requireAdmin(req: Request): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: claims, error } = await supabase.auth.getClaims(token);
  if (error || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: claims.claims.sub, _role: "admin",
  });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

interface EmailMessage {
  id: string;
  uid: number;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  seen: boolean;
  folder: string;
}

interface EmailFolder {
  name: string;
  path: string;
  count: number;
  unseen: number;
}

const IMAP_HOST = "ukm41.siteground.biz";
const IMAP_PORT = 993;
const SMTP_HOST = "ukm41.siteground.biz";
const SMTP_PORT = 465;
const EMAIL_USER = "info@everydriver.co.uk";

class IMAPClient {
  private conn: Deno.TlsConn | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  private buffer = new Uint8Array(65536);
  private tagCounter = 1;
  private lastResponse: string = "";

  async connect(): Promise<void> {
    this.conn = await Deno.connectTls({ hostname: IMAP_HOST, port: IMAP_PORT });
    // IMAP server greeting is untagged (no A1/A2... prefix). We should not wait
    // for a tagged OK/NO/BAD here, otherwise the request can hang and time out.
    await this.readResponse(undefined);
  }

  async close(): Promise<void> {
    if (this.conn) {
      try {
        await this.sendCommand("LOGOUT");
      } catch {
        // Ignore
      }
      this.conn.close();
      this.conn = null;
    }
  }

  private async readResponse(expectedTag?: string): Promise<string> {
    if (!this.conn) throw new Error("Not connected");
    
    let fullResponse = "";
    const startTime = Date.now();
    const timeout = 8000; // 8 second timeout
    const tagRegex = expectedTag
      ? new RegExp(`^${expectedTag}\\s+(OK|NO|BAD)`, "m")
      : null;
    
    while (Date.now() - startTime < timeout) {
      const n = await this.conn.read(this.buffer);
      if (n === null) break;
      
      const chunk = this.decoder.decode(this.buffer.subarray(0, n));
      fullResponse += chunk;

      // Tagged response (most commands)
      if (tagRegex && tagRegex.test(fullResponse)) break;

      // Untagged response (greeting / partial responses)
      if (!tagRegex && fullResponse.includes("\r\n")) break;
      
      // Small delay to accumulate more data
      await new Promise(r => setTimeout(r, 50));
    }

    this.lastResponse = fullResponse;
    return fullResponse;
  }

  private async sendCommand(cmd: string): Promise<{ tag: string; response: string }> {
    if (!this.conn) throw new Error("Not connected");
    
    const tag = `A${this.tagCounter++}`;
    await this.conn.write(this.encoder.encode(`${tag} ${cmd}\r\n`));
    await new Promise(r => setTimeout(r, 100));
    const response = await this.readResponse(tag);
    return { tag, response };
  }

  async login(): Promise<boolean> {
    const pass = Deno.env.get("ADMIN_EMAIL_PASSWORD") || "";
    const { tag, response } = await this.sendCommand(`LOGIN "${EMAIL_USER}" "${pass}"`);
    return new RegExp(`^${tag}\\s+OK`, "m").test(response);
  }

  async listFolders(): Promise<EmailFolder[]> {
    const { response } = await this.sendCommand('LIST "" "*"');
    const folders: EmailFolder[] = [];
    
    const lines = response.split("\r\n");
    for (const line of lines) {
      const match = line.match(/\* LIST \([^)]*\) "[^"]+" "?([^"\r\n]+)"?/);
      if (match) {
        const folderPath = match[1].replace(/"/g, "");
        // Skip system folders
        if (!folderPath.startsWith("[")) {
          // Clean display name: remove "INBOX." prefix and get last segment
          let displayName = folderPath;
          if (displayName.startsWith("INBOX.")) {
            displayName = displayName.replace("INBOX.", "");
          }
          displayName = displayName.split("/").pop() || displayName;
          
          folders.push({
            name: displayName,
            path: folderPath,
            count: 0,
            unseen: 0,
          });
        }
      }
    }
    
    // Get counts for each folder
    for (const folder of folders) {
      try {
        const { response: statusRes } = await this.sendCommand(`STATUS "${folder.path}" (MESSAGES UNSEEN)`);
        const messagesMatch = statusRes.match(/MESSAGES\s+(\d+)/);
        const unseenMatch = statusRes.match(/UNSEEN\s+(\d+)/);
        folder.count = messagesMatch ? parseInt(messagesMatch[1], 10) : 0;
        folder.unseen = unseenMatch ? parseInt(unseenMatch[1], 10) : 0;
      } catch {
        // Ignore errors for individual folders
      }
    }
    
    return folders;
  }

  async selectFolder(folder: string): Promise<number> {
    const { response } = await this.sendCommand(`SELECT "${folder}"`);
    const existsMatch = response.match(/(\d+) EXISTS/);
    return existsMatch ? parseInt(existsMatch[1], 10) : 0;
  }

  async fetchEmails(folder: string, limit: number = 20): Promise<EmailMessage[]> {
    const messageCount = await this.selectFolder(folder);
    
    if (messageCount === 0) {
      return [];
    }
    
    const start = Math.max(1, messageCount - limit + 1);
    const { response } = await this.sendCommand(
      `FETCH ${start}:${messageCount} (UID FLAGS ENVELOPE BODY.PEEK[TEXT]<0.500>)`
    );
    
    return this.parseEmails(response, folder);
  }

  async fetchEmail(folder: string, uid: number): Promise<EmailMessage | null> {
    await this.selectFolder(folder);
    
    const { response } = await this.sendCommand(
      `UID FETCH ${uid} (FLAGS ENVELOPE BODY[TEXT])`
    );
    
    // Mark as seen
    await this.sendCommand(`UID STORE ${uid} +FLAGS (\\Seen)`);
    
    const emails = this.parseEmails(response, folder);
    return emails[0] || null;
  }

  private parseEmails(response: string, folder: string): EmailMessage[] {
    const emails: EmailMessage[] = [];
    
    // Split by FETCH responses
    const fetchBlocks = response.split(/\* \d+ FETCH/);
    
    for (const block of fetchBlocks) {
      if (!block.trim()) continue;
      
      const email: Partial<EmailMessage> = {
        folder,
        seen: block.includes("\\Seen"),
        body: "",
      };
      
      // Extract UID
      const uidMatch = block.match(/UID\s+(\d+)/);
      if (uidMatch) {
        email.uid = parseInt(uidMatch[1], 10);
        email.id = `${folder}-${email.uid}`;
      }
      
      // Extract envelope data
      const envelopeMatch = block.match(/ENVELOPE\s*\(([^)]+(?:\([^)]*\)[^)]*)*)\)/s);
      if (envelopeMatch) {
        const envelope = envelopeMatch[1];
        
        // Date
        const dateMatch = envelope.match(/"([^"]+)"/);
        if (dateMatch) {
          try {
            email.date = new Date(dateMatch[1]).toISOString();
          } catch {
            email.date = new Date().toISOString();
          }
        }
        
        // Subject (second quoted string usually)
        const quotedStrings = envelope.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g) || [];
        if (quotedStrings.length >= 2) {
          email.subject = quotedStrings[1].slice(1, -1).replace(/\\"/g, '"');
        }
        
        // From (parse NIL or ((name NIL user host)))
        const fromMatch = envelope.match(/FROM\s*\(\(([^)]+)\)\)/i);
        if (fromMatch) {
          const parts = fromMatch[1].match(/"([^"]*)"/g) || [];
          if (parts.length >= 4) {
            const name = parts[0]?.slice(1, -1) || "";
            const user = parts[2]?.slice(1, -1) || "";
            const host = parts[3]?.slice(1, -1) || "";
            email.from = name ? `${name} <${user}@${host}>` : `${user}@${host}`;
          }
        }
        
        // To
        const toMatch = envelope.match(/TO\s*\(\(([^)]+)\)\)/i);
        if (toMatch) {
          const parts = toMatch[1].match(/"([^"]*)"/g) || [];
          if (parts.length >= 4) {
            const user = parts[2]?.slice(1, -1) || "";
            const host = parts[3]?.slice(1, -1) || "";
            email.to = `${user}@${host}`;
          }
        }
      }
      
      // Extract body preview
      const bodyMatch = block.match(/BODY\[TEXT\][^{]*\{(\d+)\}\r\n([\s\S]*?)(?=\)|\* \d+ FETCH|A\d+)/);
      if (bodyMatch) {
        email.body = bodyMatch[2].substring(0, 500).trim();
      }
      
      if (email.uid) {
        emails.push({
          id: email.id || `${folder}-${Date.now()}`,
          uid: email.uid,
          subject: email.subject || "(No Subject)",
          from: email.from || "Unknown",
          to: email.to || "",
          date: email.date || new Date().toISOString(),
          body: email.body || "",
          seen: email.seen || false,
          folder: email.folder || folder,
        });
      }
    }
    
    return emails.reverse(); // Newest first
  }

  async moveEmail(uid: number, fromFolder: string, toFolder: string): Promise<boolean> {
    await this.selectFolder(fromFolder);
    
    // Copy to destination
    const { tag: copyTag, response: copyRes } = await this.sendCommand(`UID COPY ${uid} "${toFolder}"`);
    if (!new RegExp(`^${copyTag}\\s+OK`, "m").test(copyRes)) return false;
    
    // Delete from source
    await this.sendCommand(`UID STORE ${uid} +FLAGS (\\Deleted)`);
    await this.sendCommand("EXPUNGE");
    
    return true;
  }

  async deleteEmail(folder: string, uid: number): Promise<boolean> {
    await this.selectFolder(folder);
    await this.sendCommand(`UID STORE ${uid} +FLAGS (\\Deleted)`);
    const { tag, response: res } = await this.sendCommand("EXPUNGE");
    return new RegExp(`^${tag}\\s+OK`, "m").test(res);
  }

  async appendToSent(messageContent: string): Promise<boolean> {
    const sentFolder = "INBOX.Sent";
    const date = new Date().toUTCString().replace(/,/g, "");
    const size = new TextEncoder().encode(messageContent).length;
    
    // APPEND command with message size
    if (!this.conn) throw new Error("Not connected");
    const tag = `A${this.tagCounter++}`;
    await this.conn.write(this.encoder.encode(
      `${tag} APPEND "${sentFolder}" (\\Seen) {${size}}\r\n`
    ));
    
    // Wait for continuation response (+)
    await new Promise(r => setTimeout(r, 200));
    let response = await this.readResponse(undefined);
    
    if (!response.includes("+")) {
      console.log("APPEND continuation failed:", response);
      return false;
    }
    
    // Send the actual message content
    await this.conn.write(this.encoder.encode(messageContent + "\r\n"));
    await new Promise(r => setTimeout(r, 200));
    response = await this.readResponse(tag);
    
    return new RegExp(`^${tag}\\s+OK`, "m").test(response);
  }

  getLastResponseSnippet(maxLen: number = 500): string {
    const trimmed = (this.lastResponse || "").trim();
    if (trimmed.length <= maxLen) return trimmed;
    return trimmed.slice(-maxLen);
  }
}

class SMTPClient {
  private conn: Deno.TlsConn | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  private buffer = new Uint8Array(4096);

  async connect(): Promise<void> {
    this.conn = await Deno.connectTls({ hostname: SMTP_HOST, port: SMTP_PORT });
    await this.readResponse(); // Read greeting
  }

  async close(): Promise<void> {
    if (this.conn) {
      try {
        await this.sendCommand("QUIT");
      } catch {
        // Ignore
      }
      this.conn.close();
      this.conn = null;
    }
  }

  private async readResponse(): Promise<string> {
    if (!this.conn) throw new Error("Not connected");
    const n = await this.conn.read(this.buffer);
    if (n === null) return "";
    return this.decoder.decode(this.buffer.subarray(0, n));
  }

  private async sendCommand(cmd: string): Promise<string> {
    if (!this.conn) throw new Error("Not connected");
    await this.conn.write(this.encoder.encode(cmd + "\r\n"));
    await new Promise(r => setTimeout(r, 100));
    return await this.readResponse();
  }

  async authenticate(): Promise<boolean> {
    const pass = Deno.env.get("ADMIN_EMAIL_PASSWORD") || "";
    
    // EHLO
    await this.sendCommand(`EHLO ${SMTP_HOST}`);
    
    // AUTH LOGIN
    let res = await this.sendCommand("AUTH LOGIN");
    if (!res.startsWith("334")) return false;
    
    // Username (base64)
    res = await this.sendCommand(btoa(EMAIL_USER));
    if (!res.startsWith("334")) return false;
    
    // Password (base64)
    res = await this.sendCommand(btoa(pass));
    return res.startsWith("235");
  }

  async sendEmail(to: string, subject: string, body: string, cc?: string): Promise<boolean> {
    // MAIL FROM
    let res = await this.sendCommand(`MAIL FROM:<${EMAIL_USER}>`);
    if (!res.startsWith("250")) return false;
    
    // RCPT TO
    res = await this.sendCommand(`RCPT TO:<${to}>`);
    if (!res.startsWith("250")) return false;
    
    // CC if provided
    if (cc) {
      for (const addr of cc.split(",").map(s => s.trim())) {
        if (addr) {
          await this.sendCommand(`RCPT TO:<${addr}>`);
        }
      }
    }
    
    // DATA
    res = await this.sendCommand("DATA");
    if (!res.startsWith("354")) return false;
    
    // Compose message
    const date = new Date().toUTCString();
    const message = [
      `From: ${EMAIL_USER}`,
      `To: ${to}`,
      cc ? `Cc: ${cc}` : "",
      `Subject: ${subject}`,
      `Date: ${date}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      "",
      body,
      "",
      ".",
    ].filter(Boolean).join("\r\n");
    
    res = await this.sendCommand(message);
    return res.startsWith("250");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const adminCheck = await requireAdmin(req);
  if (adminCheck) return adminCheck;

  const imap = new IMAPClient();
  const smtp = new SMTPClient();

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "folders") {
      await imap.connect();
      const loggedIn = await imap.login();
      if (!loggedIn) {
        throw new Error(`Login failed. Server said: ${imap.getLastResponseSnippet(300)}`);
      }
      
      const folders = await imap.listFolders();
      await imap.close();
      
      return new Response(JSON.stringify({ folders }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "fetch") {
      const { folder = "INBOX", limit = 20 } = body;
      
      await imap.connect();
      const loggedIn = await imap.login();
      if (!loggedIn) {
        throw new Error(`Login failed. Server said: ${imap.getLastResponseSnippet(300)}`);
      }
      
      const emails = await imap.fetchEmails(folder, limit);
      await imap.close();
      
      return new Response(JSON.stringify({ emails }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "read") {
      const { folder, uid } = body;
      
      await imap.connect();
      const loggedIn = await imap.login();
      if (!loggedIn) {
        throw new Error(`Login failed. Server said: ${imap.getLastResponseSnippet(300)}`);
      }
      
      const email = await imap.fetchEmail(folder, uid);
      await imap.close();
      
      return new Response(JSON.stringify({ email }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send") {
      const { to, subject, body: emailBody, cc } = body;
      
      if (!to || !subject || !emailBody) {
        throw new Error("Missing required fields: to, subject, body");
      }
      
      await smtp.connect();
      const authenticated = await smtp.authenticate();
      if (!authenticated) throw new Error("SMTP authentication failed");
      
      const sent = await smtp.sendEmail(to, subject, emailBody, cc);
      await smtp.close();
      
      if (!sent) throw new Error("Failed to send email");
      
      // Save copy to Sent folder via IMAP
      try {
        const date = new Date().toUTCString();
        const messageForSent = [
          `From: ${EMAIL_USER}`,
          `To: ${to}`,
          cc ? `Cc: ${cc}` : "",
          `Subject: ${subject}`,
          `Date: ${date}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/plain; charset=UTF-8`,
          "",
          emailBody,
        ].filter(Boolean).join("\r\n");
        
        await imap.connect();
        const loggedIn = await imap.login();
        if (loggedIn) {
          await imap.appendToSent(messageForSent);
        }
        await imap.close();
      } catch (appendErr) {
        console.log("Failed to save to Sent folder:", appendErr);
        // Don't fail the request if append fails - email was still sent
      }
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "move") {
      const { uid, fromFolder, toFolder } = body;
      
      await imap.connect();
      const loggedIn = await imap.login();
      if (!loggedIn) {
        throw new Error(`Login failed. Server said: ${imap.getLastResponseSnippet(300)}`);
      }
      
      const moved = await imap.moveEmail(uid, fromFolder, toFolder);
      await imap.close();
      
      return new Response(JSON.stringify({ success: moved }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { folder, uid } = body;
      
      await imap.connect();
      const loggedIn = await imap.login();
      if (!loggedIn) {
        throw new Error(`Login failed. Server said: ${imap.getLastResponseSnippet(300)}`);
      }
      
      const deleted = await imap.deleteEmail(folder, uid);
      await imap.close();
      
      return new Response(JSON.stringify({ success: deleted }), {
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
    
    try { await imap.close(); } catch {}
    try { await smtp.close(); } catch {}
    
    const message = error instanceof Error ? error.message : "Failed to process email request";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
