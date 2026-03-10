import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShowMeTellMeRevision } from "./ShowMeTellMeRevision";
import { ShowMeTellMeQuiz } from "./ShowMeTellMeQuiz";

interface ShowMeTellMeSectionProps {
  pupilId: string;
  brandColour: string;
}

export function ShowMeTellMeSection({ pupilId, brandColour }: ShowMeTellMeSectionProps) {
  return (
    <Tabs defaultValue="quiz" className="space-y-3">
      <TabsList className="w-full">
        <TabsTrigger value="quiz" className="flex-1">Quiz Mode</TabsTrigger>
        <TabsTrigger value="revision" className="flex-1">Revision</TabsTrigger>
      </TabsList>
      <TabsContent value="quiz">
        <ShowMeTellMeQuiz />
      </TabsContent>
      <TabsContent value="revision">
        <ShowMeTellMeRevision pupilId={pupilId} brandColour={brandColour} />
      </TabsContent>
    </Tabs>
  );
}
