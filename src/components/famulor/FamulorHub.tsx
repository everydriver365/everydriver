import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, BarChart3, PhoneCall, Megaphone, Users, Settings as SettingsIcon, ScrollText } from "lucide-react";
import { FamulorOverviewTab } from "./tabs/FamulorOverviewTab";
import { FamulorCallsTab } from "./tabs/FamulorCallsTab";
import { FamulorCampaignsTab } from "./tabs/FamulorCampaignsTab";
import { FamulorAgentsTab } from "./tabs/FamulorAgentsTab";
import { FamulorLogsTab } from "./tabs/FamulorLogsTab";
import { FamulorSettingsCard } from "@/components/instructor/integrations/FamulorSettingsCard";

export type FamulorHubScope = "instructor" | "school" | "admin";

interface Props {
  scope: FamulorHubScope;
  instructorId?: string;        // instructor scope
  instructorIds?: string[];     // school scope
  schoolId?: string;
}

const ACCENT = "#1A52A0";

export function FamulorHub({ scope, instructorId, instructorIds, schoolId }: Props) {
  const [tab, setTab] = useState("overview");

  const showSettings = scope === "instructor";
  const showLogs = scope === "admin";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[12px] bg-white border border-[#E5E5EA] p-4 flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: "#EDF2FE", color: ACCENT }}
        >
          <Mic className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold">AI Voice Hub (Famulor)</div>
          <div className="text-[13px] text-muted-foreground truncate">
            {scope === "admin"
              ? "Platform-wide AI voice activity, costs and configuration."
              : scope === "school"
              ? "All AI calls across your school's instructors."
              : "Your AI receptionist, reminder calls and dormant pupil win-back."}
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto rounded-[12px] bg-white border border-[#E5E5EA] p-1 h-auto">
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Overview</TabsTrigger>
          <TabsTrigger value="calls" className="gap-1.5"><PhoneCall className="h-3.5 w-3.5" />Calls</TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5"><Megaphone className="h-3.5 w-3.5" />Campaigns</TabsTrigger>
          <TabsTrigger value="agents" className="gap-1.5"><Users className="h-3.5 w-3.5" />Agents</TabsTrigger>
          {showSettings && (
            <TabsTrigger value="settings" className="gap-1.5"><SettingsIcon className="h-3.5 w-3.5" />Settings</TabsTrigger>
          )}
          {showLogs && (
            <TabsTrigger value="logs" className="gap-1.5"><ScrollText className="h-3.5 w-3.5" />Logs</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <FamulorOverviewTab scope={scope} instructorId={instructorId} instructorIds={instructorIds} />
        </TabsContent>
        <TabsContent value="calls" className="mt-4">
          <FamulorCallsTab scope={scope} instructorId={instructorId} instructorIds={instructorIds} />
        </TabsContent>
        <TabsContent value="campaigns" className="mt-4">
          <FamulorCampaignsTab scope={scope} instructorId={instructorId} instructorIds={instructorIds} />
        </TabsContent>
        <TabsContent value="agents" className="mt-4">
          <FamulorAgentsTab scope={scope} instructorId={instructorId} />
        </TabsContent>
        {showSettings && instructorId && (
          <TabsContent value="settings" className="mt-4">
            <FamulorSettingsCard instructorId={instructorId} />
          </TabsContent>
        )}
        {showLogs && (
          <TabsContent value="logs" className="mt-4">
            <FamulorLogsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
