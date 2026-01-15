import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/SEOHead";

export default function PrivacyPolicy() {
  return (
    <MainLayout>
      <SEOHead 
        title="Privacy Policy" 
        description="Learn how EveryDriver collects, uses, and protects your personal information."
      />
      
      <div className="container py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              EveryDriver ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our driving school management platform and related services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Name, email address, and phone number</li>
              <li>Address and postcode for lesson pickup locations</li>
              <li>Payment information (processed securely via third-party providers)</li>
              <li>Driving test dates and test centre preferences</li>
              <li>Lesson history and progress records</li>
            </ul>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Information from Third-Party Services</h3>
            <p className="text-muted-foreground leading-relaxed">
              If you choose to connect your Google Calendar, we access:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Calendar event times (to check availability)</li>
              <li>We do NOT access event titles, descriptions, or attendee information</li>
              <li>Calendar data is used solely to prevent double-booking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>To provide and maintain our driving lesson booking services</li>
              <li>To schedule and manage driving lessons</li>
              <li>To process payments and send confirmations</li>
              <li>To send lesson reminders and updates</li>
              <li>To sync with external calendars (with your permission)</li>
              <li>To improve our services and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Driving Instructors:</strong> Your contact details and lesson information to facilitate lessons</li>
              <li><strong>Payment Processors:</strong> To securely process transactions</li>
              <li><strong>Service Providers:</strong> Who assist in operating our platform</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Google API Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our use of Google Calendar data complies with the Google API Services User Data Policy, including the Limited Use requirements. We only access calendar data to check availability and do not store calendar content beyond what is necessary for scheduling.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organisational measures to protect your personal information, including encryption, secure data storage, and access controls. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Under UK GDPR, you have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to maintain your session and preferences. We do not use tracking cookies for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
            </p>
            <p className="text-muted-foreground mt-2">
              Email: privacy@everydriver.co.uk<br />
              Phone: 0800 123 4567
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
