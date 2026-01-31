import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Shield, Calendar, Lock, Eye, Trash2, ExternalLink } from "lucide-react";

export default function GoogleApiDisclosure() {
  return (
    <MainLayout>
      <SEOHead 
        title="Google API Disclosure - EveryDriver" 
        description="How EveryDriver uses Google Calendar data. Our commitment to privacy and Limited Use compliance."
      />
      
      <div className="container py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Shield className="h-5 w-5" />
            <span className="font-medium">Google API Services Disclosure</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">How EveryDriver Uses Google Calendar</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transparency about our use of Google API Services and our commitment to protecting your data
          </p>
        </div>

        {/* Limited Use Compliance Banner */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Google API Services User Data Policy Compliance
              </h2>
              <p className="text-blue-800 dark:text-blue-200">
                EveryDriver's use and transfer to any other app of information received from Google APIs will adhere to the{" "}
                <a 
                  href="https://developers.google.com/terms/api-services-user-data-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium underline hover:no-underline"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
            </div>
          </div>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-10">
          
          {/* What Data We Access */}
          <section className="bg-card border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold m-0">What Data We Access</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              When you connect your Google Calendar to EveryDriver, we request access to:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium m-0">Google Calendar Events</p>
                  <p className="text-sm text-muted-foreground m-0">Read and write access to create, update, and delete driving lesson bookings in your calendar</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Eye className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium m-0">Email Address</p>
                  <p className="text-sm text-muted-foreground m-0">To identify your Google account and link it to your EveryDriver instructor profile</p>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section className="bg-card border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-semibold m-0">How We Use Your Data</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              We use your Google Calendar data <strong>solely</strong> for the following purposes:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Sync your lesson bookings between EveryDriver and Google Calendar
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Display your existing calendar events to prevent double-booking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Create new calendar events when lessons are booked by pupils
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Update or remove calendar events when lessons are modified or cancelled
              </li>
            </ul>
          </section>

          {/* What We Do NOT Do */}
          <section className="bg-card border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-semibold m-0">What We Do NOT Do</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              In accordance with Google's Limited Use requirements, we commit to the following restrictions:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                We do <strong>not</strong> sell, rent, or lease your Google data to any third parties
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                We do <strong>not</strong> use your Google data for advertising or marketing purposes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                We do <strong>not</strong> share your Google data with other users or external services
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                We do <strong>not</strong> use your Google data to train AI or machine learning models
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                We do <strong>not</strong> access calendars or data beyond what is necessary for lesson scheduling
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-500">✗</span>
                We do <strong>not</strong> transfer your data to third parties except as necessary to provide the Service
              </li>
            </ul>
          </section>

          {/* Data Storage and Security */}
          <section className="bg-card border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold m-0">Data Storage and Security</h2>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Your Google OAuth tokens are encrypted at rest using industry-standard AES-256 encryption</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>All data transmission occurs over HTTPS with TLS 1.3 encryption</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>We do not store the content of your personal calendar events on our servers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Calendar data is fetched in real-time when you use the scheduling features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Access tokens are refreshed securely and expired tokens are automatically deleted</span>
              </li>
            </ul>
          </section>

          {/* Revoking Access */}
          <section className="bg-card border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                <Trash2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-semibold m-0">Revoking Access</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              You can disconnect your Google Calendar from EveryDriver at any time using either method:
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">Option 1: Through EveryDriver</p>
                <p className="text-sm text-muted-foreground">
                  Navigate to <strong>Settings → Integrations</strong> in your EveryDriver instructor account and click "Disconnect Google Calendar"
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">Option 2: Through Google</p>
                <p className="text-sm text-muted-foreground">
                  Visit your{" "}
                  <a 
                    href="https://myaccount.google.com/permissions" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Google Account permissions
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}and remove EveryDriver access
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mt-4">
              Upon disconnection, we will immediately delete your stored OAuth tokens. Existing calendar events created by EveryDriver will remain in your Google Calendar unless you manually delete them.
            </p>
          </section>

          {/* Contact Information */}
          <section className="bg-card border rounded-xl p-6">
            <h2 className="text-2xl font-semibold mb-4">Questions or Concerns?</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about how we use Google API data, please contact us:
            </p>
            <div className="text-muted-foreground">
              <p className="mb-1"><strong>Email:</strong> privacy@everydriver.co.uk</p>
              <p className="mb-1"><strong>Phone:</strong> 0800 123 4567</p>
              <p><strong>Address:</strong> EveryDriver Ltd, 123 Driving Lane, London, UK</p>
            </div>
          </section>

          {/* Related Policies */}
          <section className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-3">Related Policies</h3>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/privacy-policy" 
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Privacy Policy
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link 
                to="/terms-of-service" 
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Terms of Service
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </section>

          <p className="text-sm text-muted-foreground text-center pt-4">
            Last updated: 31 January 2026
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
