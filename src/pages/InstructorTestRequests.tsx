import { useState } from "react";
import { Plus, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { TestRequestForm } from "@/components/test-requests/TestRequestForm";
import { TestRequestList } from "@/components/test-requests/TestRequestList";
import { SwapBoard } from "@/components/test-requests/SwapBoard";
import { AvailableTestSlots } from "@/components/test-requests/AvailableTestSlots";
import { MatchedSlotsList } from "@/components/test-requests/MatchedSlotsList";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function InstructorTestRequests() {
  const { instructor } = useInstructorAuth();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <InstructorPortalLayout>
      <div className="space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            Test Swap
          </h1>
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Test Request</DialogTitle>
              </DialogHeader>
              <TestRequestForm
                instructorId={instructor?.id}
                mode="instructor"
                onSuccess={() => setFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="my-requests">
          <TabsList className="w-full">
            <TabsTrigger value="my-requests" className="flex-1">My Requests</TabsTrigger>
            <TabsTrigger value="swap-board" className="flex-1">Swap Board</TabsTrigger>
            <TabsTrigger value="available-slots" className="flex-1 data-[state=active]:text-emerald-500">Available</TabsTrigger>
          </TabsList>
          <TabsContent value="my-requests">
            <TestRequestList instructorId={instructor?.id} />
          </TabsContent>
          <TabsContent value="swap-board">
            <SwapBoard instructorId={instructor?.id} />
          </TabsContent>
          <TabsContent value="available-slots">
            <MatchedSlotsList instructorId={instructor?.id} />
            <AvailableTestSlots instructorId={instructor?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
