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
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

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
            <h2 className="text-2xl font-semibold mb-4">7. Third-Party Integrations</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Service may integrate with third-party services such as Google Calendar. By connecting these services, you agree to their respective terms of service. We are not responsible for the availability or functionality of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service and its original content, features, and functionality are owned by EveryDriver and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
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
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account at any time for violations of these terms. You may also close your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Service. Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
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
