import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SignaturePad } from "@/components/instructor/SignaturePad";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileText, CheckCircle2, AlertTriangle, XCircle, Loader2, Clock, Users, Shield } from "lucide-react";
import { differenceInYears } from "date-fns";

interface TokenData {
  id: string;
  token: string;
  expires_at: string;
  status: string;
  pupil: {
    id: string;
    name: string;
    date_of_birth: string | null;
    parent_name: string | null;
  };
  instructor: {
    id: string;
    name: string;
    logo_url: string | null;
    brand_colour: string | null;
  };
  terms: {
    id: string;
    title: string;
    content: string;
    version: number;
  };
}

export default function RemoteSigning() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [parentAgreed, setParentAgreed] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [parentSignatureDataUrl, setParentSignatureDataUrl] = useState<string | null>(null);
  const [parentName, setParentName] = useState("");
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [signed, setSigned] = useState(false);

  const isUnder18 = tokenData?.pupil.date_of_birth
    ? differenceInYears(new Date(), new Date(tokenData.pupil.date_of_birth)) < 18
    : false;

  useEffect(() => {
    if (token) {
      fetchTokenData();
    }
  }, [token]);

  // If the terms content doesn't overflow (no scrolling possible), auto-enable the agree checkbox.
  useEffect(() => {
    if (!tokenData?.terms?.id) return;

    requestAnimationFrame(() => {
      const viewport = document.querySelector(
        '[data-terms-scroll="remote"] [data-radix-scroll-area-viewport]'
      ) as HTMLDivElement | null;

      if (!viewport) return;

      const isScrollable = viewport.scrollHeight - viewport.clientHeight > 20;
      if (!isScrollable) setScrolledToBottom(true);
    });
  }, [tokenData?.terms?.id]);

  const fetchTokenData = async () => {
    setLoading(true);
    try {
      // Fetch token with related data
      const { data: tokenRecord, error: tokenError } = await supabase
        .from("remote_signing_tokens")
        .select(`
          id,
          token,
          expires_at,
          status,
          pupil_id,
          instructor_id,
          terms_id
        `)
        .eq("token", token)
        .single();

      if (tokenError || !tokenRecord) {
        setError("Invalid or expired signing link");
        return;
      }

      // Check if expired
      if (new Date(tokenRecord.expires_at) < new Date()) {
        await supabase
          .from("remote_signing_tokens")
          .update({ status: "expired" })
          .eq("id", tokenRecord.id);
        setError("This signing link has expired");
        return;
      }

      // Check if already signed
      if (tokenRecord.status === "signed") {
        setError("This document has already been signed");
        return;
      }

      // Mark as opened
      if (tokenRecord.status === "pending") {
        await supabase
          .from("remote_signing_tokens")
          .update({ status: "opened" })
          .eq("id", tokenRecord.id);
      }

      // Fetch pupil
      const { data: pupil } = await supabase
        .from("pupils")
        .select("id, name, date_of_birth, parent_name")
        .eq("id", tokenRecord.pupil_id)
        .single();

      // Fetch instructor
      const { data: instructor } = await supabase
        .from("instructors")
        .select("id, name, logo_url, brand_colour")
        .eq("id", tokenRecord.instructor_id)
        .single();

      // Fetch terms
      const { data: terms } = await supabase
        .from("instructor_terms_conditions")
        .select("id, title, content, version")
        .eq("id", tokenRecord.terms_id)
        .single();

      if (!pupil || !instructor || !terms) {
        setError("Unable to load signing data");
        return;
      }

      setTokenData({
        ...tokenRecord,
        pupil,
        instructor,
        terms,
      });

      if (pupil.parent_name) {
        setParentName(pupil.parent_name);
      }
    } catch (err) {
      console.error("Error fetching token data:", err);
      setError("Failed to load signing page");
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 20;
    if (isAtBottom) {
      setScrolledToBottom(true);
    }
  };

  const uploadSignature = async (dataUrl: string, prefix: string): Promise<string> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const filename = `${tokenData!.instructor.id}/${tokenData!.pupil.id}/${tokenData!.terms.id}_${prefix}_remote_${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(filename, blob, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("signatures")
      .getPublicUrl(filename);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!tokenData || !signatureDataUrl || !agreed) return;
    if (isUnder18 && (!parentSignatureDataUrl || !parentAgreed || !parentName.trim())) {
      toast.error("Parent/guardian signature is required for under-18 pupils");
      return;
    }

    setSubmitting(true);
    try {
      // Upload pupil signature
      const pupilSigUrl = await uploadSignature(signatureDataUrl, "pupil");

      // Upload parent signature if required
      let parentSigUrl: string | null = null;
      if (isUnder18 && parentSignatureDataUrl) {
        parentSigUrl = await uploadSignature(parentSignatureDataUrl, "parent");
      }

      // Create signature record
      const { error: insertError } = await supabase
        .from("pupil_signatures")
        .insert({
          pupil_id: tokenData.pupil.id,
          terms_id: tokenData.terms.id,
          instructor_id: tokenData.instructor.id,
          signature_url: pupilSigUrl,
          user_agent: navigator.userAgent,
          requires_parent_signature: isUnder18,
          parent_name: isUnder18 ? parentName.trim() : null,
          parent_signature_url: parentSigUrl,
          parent_signed_at: isUnder18 && parentSigUrl ? new Date().toISOString() : null,
        });

      if (insertError) throw insertError;

      // Update token status
      await supabase
        .from("remote_signing_tokens")
        .update({ status: "signed", used_at: new Date().toISOString() })
        .eq("id", tokenData.id);

      setSigned(true);
      toast.success("Terms signed successfully!");
    } catch (error) {
      console.error("Error submitting signature:", error);
      toast.error("Failed to save signature");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = agreed && signatureDataUrl && scrolledToBottom &&
    (!isUnder18 || (parentAgreed && parentSignatureDataUrl && parentName.trim()));

  const brandColor = tokenData?.instructor.brand_colour || "#1e3a5f";

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <div
              className="h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: brandColor }}
            >
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Successfully Signed!</h2>
            <p className="text-muted-foreground mb-4">
              {isUnder18
                ? `${tokenData?.pupil.name} and ${parentName} have both signed the terms.`
                : `Thank you, ${tokenData?.pupil.name}! Your signature has been recorded.`}
            </p>
            <p className="text-sm text-muted-foreground">
              {tokenData?.instructor.name} will be notified of your signature.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader className="text-center pb-4">
            {tokenData?.instructor.logo_url ? (
              <img
                src={tokenData.instructor.logo_url}
                alt={tokenData.instructor.name}
                className="h-16 mx-auto mb-2 object-contain"
              />
            ) : (
              <div
                className="h-16 w-16 mx-auto mb-2 rounded-full flex items-center justify-center"
                style={{ backgroundColor: brandColor }}
              >
                <FileText className="h-8 w-8 text-white" />
              </div>
            )}
            <CardTitle>{tokenData?.terms.title}</CardTitle>
            <CardDescription>
              From {tokenData?.instructor.name} • Version {tokenData?.terms.version}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Pupil Info */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: brandColor }}
              >
                {tokenData?.pupil.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{tokenData?.pupil.name}</p>
                <p className="text-sm text-muted-foreground">
                  Please read and sign below
                </p>
              </div>
            </div>

            {isUnder18 && (
              <div className="flex items-center gap-2 p-3 mt-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <Users className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  As an under-18 pupil, a parent/guardian signature is also required.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terms Content */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Terms & Conditions</CardTitle>
              {!scrolledToBottom && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Scroll to continue
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea
              data-terms-scroll="remote"
              className="h-64 border rounded-lg p-4"
              onScrollCapture={handleScroll}
            >
              <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                {tokenData?.terms.content}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pupil Signature */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(checked) => {
                  const next = checked === true;
                  if (next && !scrolledToBottom) {
                    toast.error("Please scroll through the terms before agreeing");
                    return;
                  }
                  setAgreed(next);
                }}
              />
              <Label
                htmlFor="agree"
                className={`text-sm leading-relaxed ${!scrolledToBottom ? "text-muted-foreground" : ""}`}
              >
                I, {tokenData?.pupil.name}, have read, understood, and agree to the terms and conditions above.
              </Label>
            </div>

            <SignaturePad
              onSignatureChange={setSignatureDataUrl}
              disabled={!agreed}
            />
          </CardContent>
        </Card>

        {/* Parent Signature (if under 18) */}
        {isUnder18 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Parent/Guardian Signature
              </CardTitle>
              <CardDescription>Required for pupils under 18</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent/Guardian Name</Label>
                <Input
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="parentAgree"
                  checked={parentAgreed}
                  onCheckedChange={(checked) => {
                    const next = checked === true;
                    if (next && !scrolledToBottom) {
                      toast.error("Please scroll through the terms before agreeing");
                      return;
                    }
                    if (next && !parentName.trim()) {
                      toast.error("Please enter the parent/guardian name first");
                      return;
                    }
                    setParentAgreed(next);
                  }}
                />
                <Label
                  htmlFor="parentAgree"
                  className={`text-sm leading-relaxed ${!scrolledToBottom || !parentName.trim() ? "text-muted-foreground" : ""}`}
                >
                  I, {parentName || "[Parent/Guardian]"}, as parent/guardian of {tokenData?.pupil.name}, 
                  consent to these terms and conditions on their behalf.
                </Label>
              </div>

              <SignaturePad
                onSignatureChange={setParentSignatureDataUrl}
                disabled={!parentAgreed}
              />
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full h-12 text-base"
          style={{ backgroundColor: canSubmit ? brandColor : undefined }}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Shield className="h-5 w-5 mr-2" />
              {isUnder18 ? "Submit Both Signatures" : "Sign & Submit"}
            </>
          )}
        </Button>

        {/* Security Note */}
        <p className="text-xs text-center text-muted-foreground px-4">
          Your signature will be securely stored. By signing, you confirm your identity and agreement to these terms.
        </p>
      </div>
    </div>
  );
}
