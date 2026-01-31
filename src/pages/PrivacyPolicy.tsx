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
            <h2 className="text-2xl font-semibold mb-4">4. Google API Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              EveryDriver offers optional integration with Google services to enhance functionality for instructors. This section describes our use of Google API Services and our commitment to protecting your Google data.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Google Calendar Integration</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              When you connect your Google Calendar to EveryDriver, we access:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Calendar events</strong>: To sync lesson bookings and prevent scheduling conflicts</li>
              <li><strong>Email address</strong>: To identify your Google account</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">How We Use Google Data</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We use your Google Calendar data exclusively to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Synchronise your lesson schedule between EveryDriver and Google Calendar</li>
              <li>Display your existing events to prevent double-booking</li>
              <li>Create, update, and delete lesson events in your calendar</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Google Data Protection</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>We do <strong>not</strong> sell, rent, or trade your Google data to any third party</li>
              <li>We do <strong>not</strong> use your Google data for advertising or marketing purposes</li>
              <li>We do <strong>not</strong> share your Google data with other users or external services</li>
              <li>We do <strong>not</strong> store the content of your personal calendar events</li>
              <li>We access only the minimum data necessary for lesson scheduling functionality</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Google API Services User Data Policy Compliance</h3>
            <p className="text-muted-foreground leading-relaxed">
              EveryDriver's use and transfer to any other app of information received from Google APIs will adhere to the{" "}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>

            <h3 className="text-xl font-medium mb-3 mt-6">Revoking Google Access</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              You may disconnect your Google account from EveryDriver at any time:
            </p>
            <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
              <li>In EveryDriver: Go to <strong>Settings &gt; Integrations</strong> and click "Disconnect"</li>
              <li>
                In Google: Visit{" "}
                <a 
                  href="https://myaccount.google.com/permissions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Account Permissions
                </a>
                {" "}and remove EveryDriver
              </li>
            </ol>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Upon disconnection, we immediately delete your stored Google OAuth tokens.
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
