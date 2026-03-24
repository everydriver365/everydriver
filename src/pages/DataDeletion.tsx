import { useSearchParams } from "react-router-dom";
import { CheckCircle, Shield } from "lucide-react";

const DataDeletion = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            {code ? (
              <CheckCircle className="h-8 w-8 text-primary" />
            ) : (
              <Shield className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground">Data Deletion</h1>

        {code ? (
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Your data deletion request has been processed successfully.
            </p>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Confirmation Code</p>
              <p className="font-mono text-sm font-medium text-foreground break-all">{code}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              All data associated with your account has been removed from our systems.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground">
            If you requested data deletion through Facebook/Meta, you will receive a confirmation
            code and a link back to this page to verify your request was processed.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          For questions, contact{" "}
          <a href="mailto:support@everydriver.co.uk" className="text-primary hover:underline">
            support@everydriver.co.uk
          </a>
        </p>
      </div>
    </div>
  );
};

export default DataDeletion;
