import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-mono-bg py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            to="/register"
            className="text-sm text-mono-3 hover:text-mono-1 transition-colors"
          >
            ← Back to registration
          </Link>
        </div>

        <div className="bg-mono-surface border border-mono-border rounded-xl p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-mono-1 mb-1">Privacy Policy</h1>
            <p className="text-sm text-mono-3">Last updated: June 8, 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-mono-1">1. About Applywell</h2>
            <p className="text-mono-2 leading-relaxed">
              Applywell (also referred to as "Job Apply Tracker") is a personal productivity
              application that helps users organize their job search by tracking applications,
              deadlines, and statuses. It also allows users to generate tailored resumes using
              their own Google Drive. Applywell is operated by Vitor Hugo Alves Ferreira
              (vitorhugoalvesferreira@gmail.com).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-mono-1">2. Data We Collect</h2>
            <p className="text-mono-2 leading-relaxed">We collect only the data you provide directly:</p>
            <ul className="list-disc list-inside space-y-1 text-mono-2">
              <li><strong>Account data:</strong> full name and email address used to create your account.</li>
              <li><strong>Authentication data:</strong> hashed password (never stored in plain text); refresh tokens stored in secure HttpOnly cookies.</li>
              <li>
                <strong>Job application data:</strong> company name, role title, application status,
                dates, notes, and any other details you choose to enter about each application.
              </li>
              <li>
                <strong>Resume data:</strong> resume files and templates you upload or generate through
                the application. These files are stored in your own Google Drive, not on our servers.
              </li>
              <li>
                <strong>Preferences:</strong> your preferred daily reminder time for application
                follow-ups.
              </li>
              <li>
                <strong>Google OAuth tokens:</strong> if you connect Google Drive, we store an OAuth
                access token and refresh token solely to access the specific Drive folder you
                designate. We never access any other files in your Google account.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-mono-1">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1 text-mono-2">
              <li>To provide and operate the job application tracking service.</li>
              <li>To send you optional email reminders about pending applications (only if you configure a reminder time).</li>
              <li>To generate personalized resume PDFs using Google Drive on your behalf.</li>
              <li>To authenticate your identity and maintain your session securely.</li>
            </ul>
            <p className="text-mono-2">
              We do <strong>not</strong> use your data for advertising, profiling, or any purpose
              beyond operating the features you explicitly use.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-mono-1">4. Google API Usage</h2>
            <p className="text-mono-2 leading-relaxed">
              Applywell's use of Google APIs is limited to reading and writing files in a single
              Google Drive folder that you select during the setup. We comply with the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-mono-1 hover:opacity-70"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. Your Google data is never shared with
              third parties, never used for targeted advertising, and never transferred for
              any purpose unrelated to providing the resume feature.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-mono-1">5. Data Sharing</h2>
            <p className="text-mono-2 leading-relaxed">
              We do <strong>not</strong> sell, rent, or share your personal data with any third
              party. We use no analytics trackers, advertising SDKs, or data brokers. Your
              data is stored on secure cloud infrastructure and is accessible only to you
              and the service itself.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-mono-1">6. Cookies &amp; Storage</h2>
            <p className="text-mono-2 leading-relaxed">
              We use a single HttpOnly, Secure cookie for session refresh tokens. This cookie
              is strictly necessary for authentication and expires automatically. We do not use
              tracking cookies, fingerprinting, or any third-party cookie. The application also
              uses your browser's localStorage and IndexedDB solely to cache your own data for
              offline access.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-mono-1">7. Data Retention &amp; Deletion</h2>
            <p className="text-mono-2 leading-relaxed">
              Your data is retained for as long as your account is active. You may request
              permanent deletion of your account and all associated data at any time by
              contacting us at{' '}
              <a
                href="mailto:vitorhugoalvesferreira@gmail.com"
                className="underline text-mono-1 hover:opacity-70"
              >
                vitorhugoalvesferreira@gmail.com
              </a>
              . Upon account deletion, all personally identifiable information is permanently
              removed from our systems within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-mono-1">8. Your Rights</h2>
            <p className="text-mono-2 leading-relaxed">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-mono-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data via your account settings.</li>
              <li>Request export or deletion of all your data.</li>
              <li>Revoke Google Drive access at any time from your account settings or from your Google account's security page.</li>
            </ul>
            <p className="text-mono-2">
              To exercise any of these rights, contact{' '}
              <a
                href="mailto:vitorhugoalvesferreira@gmail.com"
                className="underline text-mono-1 hover:opacity-70"
              >
                vitorhugoalvesferreira@gmail.com
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-mono-1">9. Security</h2>
            <p className="text-mono-2 leading-relaxed">
              Passwords are stored using BCrypt hashing. Communication between your browser
              and our servers is encrypted via HTTPS/TLS. Refresh tokens are rotated on each
              use and stored in HttpOnly cookies to mitigate XSS risks. We apply rate limiting
              on authentication endpoints to prevent brute-force attacks.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-mono-1">10. Changes to This Policy</h2>
            <p className="text-mono-2 leading-relaxed">
              We may update this Privacy Policy occasionally. When we do, we will update the
              "Last updated" date at the top. Continued use of Applywell after changes are
              posted constitutes acceptance of the new policy. For material changes, we will
              notify you by email.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-mono-1">11. Contact</h2>
            <p className="text-mono-2">
              Questions or concerns about this Privacy Policy?{' '}
              <a
                href="mailto:vitorhugoalvesferreira@gmail.com"
                className="underline text-mono-1 hover:opacity-70"
              >
                vitorhugoalvesferreira@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
