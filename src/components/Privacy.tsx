import { ArrowLeft } from '@/components/slab'
import { useNavigate } from 'react-router-dom'
import { profile } from '@/data/profile'

/**
 * Privacy notice for khaelworks.tech. Plain description of what the site
 * actually collects. Update it if the contact form or the site changes
 * (for example, if analytics are ever added).
 */
export default function Privacy() {
  const navigate = useNavigate()

  return (
    <main className="legal-page" aria-label="Privacy Policy">
      <div className="legal-page__card">
        <button
          className="legal-page__back"
          onClick={() => navigate('/')}
          aria-label="Back to home"
        >
          <ArrowLeft weight="bold" size={15} aria-hidden="true" />
          Back to home
        </button>

        <h1 className="legal-page__title">Privacy Policy</h1>
        <p className="legal-page__updated">Last updated: 8 October 2026</p>

        <div className="legal-page__body">
          <h2>Who this covers</h2>
          <p>This site, khaelworks.tech, is run by Michael John Cuevas Mendoza (Khael Mendoza), an independent workflow automation specialist based in Muntinlupa City, Philippines. This notice covers this site and its contact form.</p>

          <h2>What is collected</h2>
          <p>When you send the contact form, it collects your first name, last name, email address and your message. The site uses no tracking cookies and no third-party analytics. To show the visitor count, your browser keeps a random ID that is not linked to your name, email or device; once per visit it is sent to my automation server (n8n), which stores only that ID and the date it was first seen so you are not counted twice. The counter does not store your IP address. Your browser also stores a few display settings on your own device, such as light or dark theme and accessibility options; these never leave your browser.</p>

          <h2>How it is used</h2>
          <p>Your message goes to my own automation server (n8n), which logs it in a private Google Sheet and sends me an email alert. I use it only to reply to you and to discuss the work you asked about. I do not sell it or add you to a mailing list. Google stores the Sheet and the email as my service provider. If you book a call, the booking calendar is Google's own page, shown in a window on this site; your name, email and answers go to my Google Calendar, and Google sends both of us the invitation.</p>

          <h2>How long it is kept</h2>
          <p>I keep inquiries for up to 12 months after our last contact, then delete them. You can ask me to show, correct or delete your information at any time by emailing me. I handle personal data in line with the Philippine Data Privacy Act of 2012 (RA 10173).</p>

          <h2>Contact</h2>
          <p>
            Questions about this policy: <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </p>
        </div>
      </div>
    </main>
  )
}
