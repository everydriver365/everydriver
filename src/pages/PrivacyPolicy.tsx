import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <MainLayout>
      <SEOHead 
        title="Privacy Policy" 
        description="Privacy policy for the EveryDriver driving lesson booking platform, including Google API Services disclosure."
      />
      
      <div className="container py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: 31 January 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              EveryDriver ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our driving lesson booking platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium mb-3">Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We may collect personal information that you voluntarily provide, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Name and contact details (email, phone number)</li>
              <li>Account credentials</li>
              <li>Payment information (processed securely by third-party providers)</li>
              <li>Driving licence details (for instructors and learners)</li>
              <li>Location data (pickup addresses for lessons)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and preferences</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and maintain our services</li>
              <li>Process bookings and payments</li>
              <li>Communicate with you about lessons and account updates</li>
              <li>Improve our platform and user experience</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and ensure platform security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Google API Services Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              EveryDriver offers optional integration with Google services to enhance functionality for instructors. This section describes our use of Google API Services and our commitment to protecting your Google data.
            </p>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-foreground mb-2">Google API Services User Data Policy</p>
              <p className="text-sm text-muted-foreground">
                EveryDriver's use and transfer to any other app of information received from Google APIs will adhere to the{" "}
                <a 
                  href="https://developers.google.com/terms/api-services-user-data-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
            </div>

            <h3 className="text-xl font-medium mb-3">What Data We Access</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              When you connect your Google Calendar to EveryDriver, we request access to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li><strong>Google Calendar (read/write)</strong>: To sync lesson bookings, view your availability, and prevent scheduling conflicts</li>
              <li><strong>Email address</strong>: To identify your Google account and match it to your EveryDriver profile</li>
              <li><strong>Basic profile information</strong>: Your name for display purposes</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">How We Use Google Data</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We use your Google Calendar data <strong>exclusively</strong> to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Synchronise your lesson schedule between EveryDriver and Google Calendar</li>
              <li>Display your existing calendar events to prevent double-booking</li>
              <li>Create lesson events in your calendar when bookings are made</li>
              <li>Update events when lesson details change</li>
              <li>Remove events when lessons are cancelled</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Limited Use Disclosure</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              In accordance with Google's Limited Use requirements:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>We <strong>only use</strong> Google data to provide the calendar sync feature you explicitly requested</li>
              <li>We <strong>do not</strong> transfer Google data to any third parties except as necessary to provide or improve our service, or as required by law</li>
              <li>We <strong>do not</strong> use Google data for advertising, marketing, or to serve you ads</li>
              <li>We <strong>do not</strong> allow humans to read your Google data unless you provide affirmative consent, it's necessary for security purposes, or required by law</li>
              <li>We <strong>do not</strong> use Google data to train AI or machine learning models</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Data Storage and Security</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>OAuth tokens are encrypted at rest and in transit</li>
              <li>We do not store the content of your personal calendar events—only lesson-related events we create</li>
              <li>Access tokens are refreshed automatically and securely</li>
              <li>All data is stored on secure, encrypted servers</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Revoking Access</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              You may disconnect your Google account at any time using either method:
            </p>
            <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
              <li><strong>In EveryDriver</strong>: Go to Settings → Integrations → Google Calendar and click "Disconnect"</li>
              <li>
                <strong>In Google</strong>: Visit your{" "}
                <a 
                  href="https://myaccount.google.com/permissions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Account Permissions
                </a>
                {" "}page and remove EveryDriver
              </li>
            </ol>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Upon disconnection, we immediately delete your stored OAuth tokens and cease all access to your Google data. Previously synced lesson events remain in your calendar but will no longer update automatically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Other users</strong>: Instructors and learners can see relevant booking details</li>
              <li><strong>Service providers</strong>: Payment processors, email services, and hosting providers</li>
              <li><strong>Legal authorities</strong>: When required by law or to protect our rights</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organisational measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure storage of credentials and tokens</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal data only for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Under UK GDPR, you have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Request erasure of your data</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to enhance your experience, analyse usage, and provide personalised content. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not directed to individuals under the age of 17. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the platform. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related enquiries or to exercise your rights, contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              Email: privacy@everydriver.co.uk<br />
              Phone: 0800 123 4567
            </p>
          </section>

          <section className="pt-4 border-t">
            <p className="text-muted-foreground">
              See also our <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
