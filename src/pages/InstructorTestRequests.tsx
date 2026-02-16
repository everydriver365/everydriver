import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstructorAuth } from "@/context/InstructorAuthContext";
import { InstructorPortalLayout } from "@/components/layout/InstructorPortalLayout";
import { TestRequestForm } from "@/components/test-requests/TestRequestForm";
import { TestRequestList } from "@/components/test-requests/TestRequestList";
import { SwapBoard } from "@/components/test-requests/SwapBoard";
import { AvailableTestSlots } from "@/components/test-requests/AvailableTestSlots";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function InstructorTestRequests() {
  const navigate = useNavigate();
  const { instructor } = useInstructorAuth();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <InstructorPortalLayout>
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Test Swap</h1>
          </div>
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
            <AvailableTestSlots instructorId={instructor?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </InstructorPortalLayout>
  );
}
