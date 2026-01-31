import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <MainLayout>
      <SEOHead 
        title="Terms of Service" 
        description="Terms and conditions for using the EveryDriver driving lesson booking platform."
      />
      
      <div className="container py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: 31 January 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using EveryDriver ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              EveryDriver is a platform that connects learner drivers with driving instructors, facilitating the booking and management of driving lessons. We provide tools for scheduling, payment processing, and progress tracking.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must notify us immediately of any unauthorised access to your account</li>
              <li>You may not use another person's account without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Instructor Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              Instructors using our platform agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Hold a valid ADI (Approved Driving Instructor) licence</li>
              <li>Maintain appropriate insurance for driving instruction</li>
              <li>Provide accurate availability and pricing information</li>
              <li>Honour confirmed bookings or provide reasonable notice for cancellations</li>
              <li>Conduct lessons professionally and safely</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Learner Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              Learners using our platform agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Hold a valid provisional driving licence before taking lessons</li>
              <li>Arrive on time for scheduled lessons</li>
              <li>Provide adequate notice for cancellations as per instructor policy</li>
              <li>Make payments as agreed for booked lessons</li>
              <li>Follow instructor guidance during lessons</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Bookings and Payments</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Lesson prices are set by individual instructors</li>
              <li>Payment terms are agreed between learners and instructors</li>
              <li>Cancellation policies vary by instructor and are displayed at booking</li>
              <li>We facilitate payments but are not responsible for disputes between users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Google Calendar Integration</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              EveryDriver offers optional integration with Google Calendar to help instructors manage their lesson availability. This section explains how we access and use your Google account data.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Data We Access</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              When you connect your Google Calendar to EveryDriver, we request access to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Calendar events</strong>: Read and write access to create, update, and delete lesson bookings</li>
              <li><strong>Email address</strong>: To identify your Google account and link it to your EveryDriver profile</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">How We Use Your Data</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We use your Google Calendar data solely to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Sync your lesson bookings between EveryDriver and Google Calendar</li>
              <li>Display your existing calendar events to prevent double-booking</li>
              <li>Create new calendar events when lessons are booked</li>
              <li>Update or remove calendar events when lessons are modified or cancelled</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Data Storage and Security</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Your Google account credentials (OAuth tokens) are encrypted and stored securely</li>
              <li>We do not store the content of your personal calendar events on our servers</li>
              <li>Calendar data is fetched in real-time when you use the scheduling features</li>
              <li>Your data is transmitted using industry-standard HTTPS encryption</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">What We Do NOT Do</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>We do <strong>not</strong> sell your Google data to third parties</li>
              <li>We do <strong>not</strong> use your Google data for advertising purposes</li>
              <li>We do <strong>not</strong> share your Google data with other users or external services</li>
              <li>We do <strong>not</strong> access calendars or data beyond what is necessary for lesson scheduling</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Google API Services User Data Policy Compliance</h3>
            <p className="text-muted-foreground leading-relaxed">
              EveryDriver's use and transfer of information received from Google APIs adheres to the{" "}
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

            <h3 className="text-xl font-semibold mb-3 mt-6">Revoking Access</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              You can disconnect your Google Calendar from EveryDriver at any time by:
            </p>
            <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
              <li>Going to <strong>Settings &gt; Integrations</strong> in your EveryDriver account and clicking "Disconnect"</li>
              <li>
                Visiting your{" "}
                <a 
                  href="https://myaccount.google.com/permissions" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Account permissions
                </a>
                {" "}and removing EveryDriver access
              </li>
            </ol>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Upon disconnection, we will delete your stored OAuth tokens. Existing calendar events created by EveryDriver will remain in your Google Calendar unless you manually delete them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Other Third-Party Integrations</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service may integrate with additional third-party services. By connecting these services, you agree to their respective terms of service. We are not responsible for the availability or functionality of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service and its original content, features, and functionality are owned by EveryDriver and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              EveryDriver acts as a platform connecting instructors and learners. We are not liable for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>The quality of driving instruction provided</li>
              <li>Accidents or incidents during lessons</li>
              <li>Disputes between instructors and learners</li>
              <li>Loss of data or service interruptions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account at any time for violations of these terms. You may also close your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Service. Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              Email: legal@everydriver.co.uk<br />
              Phone: 0800 123 4567
            </p>
          </section>

          <section className="pt-4 border-t">
            <p className="text-muted-foreground">
              See also our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
