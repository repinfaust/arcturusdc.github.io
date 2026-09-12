import ThereaboutsLegalPage from '../_components/ThereaboutsLegalPage';

export const metadata = {
  title: 'thereabouts — Privacy Policy',
  description: 'Privacy policy for the thereabouts iOS and Android app.',
};

export default function ThereaboutsPrivacyPolicy() {
  return (
    <ThereaboutsLegalPage eyebrow="Privacy record" title="Privacy policy">
      <p>
        <strong>The short version:</strong> thereabouts keeps your trip, your phrases and your
        practice on your device, and they work without a connection. Four things do leave: what you
        write about your trip is sent to OpenAI to prepare your language; phrase text is sent to
        Microsoft to produce audio in languages your device cannot speak; your destination is sent to
        Unsplash to find a photograph of the place; and if you report something from inside the app,
        what you wrote comes to us. If you buy full access, RevenueCat and the app store handle that
        purchase and know that you made it. Cloud backup and product analytics are separate choices,
        off until you turn them on. No advertising identifier is collected at any point.
      </p>

      <h2>1. Who controls your data</h2>
      <p>
        thereabouts is provided by Arcturus Digital Consulting, registered in England and Wales. For
        data-protection questions or requests, email{' '}
        <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a>.
      </p>

      <h2>2. Information kept on your device</h2>
      <p>Local SQLite storage is the app&apos;s primary record. It may contain:</p>
      <ul>
        <li>Trip details and likely situations</li>
        <li>Phrases, likely replies, validation provenance, and practice state</li>
        <li>People, places, routines, and preferences you explicitly approve as memories</li>
        <li>Trip moments you choose to record</li>
        <li>Settings, text size, theme, and consent choices</li>
      </ul>
      <p>
        Memories marked high-sensitivity are local-only. The app does not silently turn an inference
        into a saved memory.
      </p>

      <h2>3. Account and sign-in information</h2>
      <p>
        The app creates an anonymous Firebase Authentication account when it starts. This gives local
        records an owner before you add anything. You may later link that account using Apple or
        Google sign-in. Firebase Authentication may process an identifier, sign-in provider, email
        address supplied by that provider, IP address, user agent, and security information.
      </p>
      <p>
        Signing in is optional for the learning experience. Apple and Google process sign-in under
        their own privacy policies.
      </p>

      <h2>4. Optional cloud backup</h2>
      <p>
        Cloud backup is off unless you explicitly agree. If enabled, learner-created memories, trip
        moments, phrases, and phrase replies are mirrored to Google Cloud Firestore under your Firebase
        user identifier. The reviewed seed library, device settings, and consent choices are not
        mirrored.
      </p>
      <p>
        Security rules restrict records to their owner. Google may still process technical service
        data such as IP addresses, app identifiers, and operational information when providing Firebase.
      </p>

      <h2>5. Speech recognition and playback</h2>
      <p>
        Microphone access is requested only when you press a spoken-practice or speak-to-translate
        control. The app uses your device platform&apos;s speech-recognition service to produce a
        transcript, and does not save raw microphone audio as a memory or a cloud record. Apple or
        Google may process speech under the operating system and recognition settings on your device.
      </p>
      <p>
        Playback uses your device&apos;s own text-to-speech service where it supports the language you
        are preparing. Where it does not — which is common for less widely supported languages — the
        phrase text is sent to Microsoft Azure Speech, which returns an audio file. That file is
        stored on your device and reused, so a phrase is sent once rather than on every playback. What
        is sent is the phrase text and the language. It does not include your name, your memories,
        your account, or anything identifying you.
      </p>
      <p>
        thereabouts presents transcripts as recognition evidence, not as pronunciation or accent
        assessment.
      </p>

      <h2>6. AI translation and language suggestions</h2>
      <p>
        thereabouts uses OpenAI to prepare your language. Consent is requested before the first
        request and can be withdrawn in settings, which stops further requests without deleting
        anything you already have. Requests go through an App-Check-protected Firebase Function; the
        app contains no OpenAI API key.
      </p>
      <p>
        The main input is the note you write about your trip. That note is free text and is sent as
        written, so it will contain whatever you put in it. It is sent again if you later refine the
        trip.
      </p>
      <p>What is sent:</p>
      <ul>
        <li>the note you write about your trip, or a later refinement of it</li>
        <li>for translation, the text you ask to be translated</li>
        <li>
          when the app breaks a phrase into parts for you to learn, that phrase and a short
          description of what it means
        </li>
        <li>your destination and the language being prepared</li>
      </ul>
      <p>What is not sent:</p>
      <ul>
        <li>your saved memories, people, places, routines or preferences</li>
        <li>memories marked high-sensitivity, which never leave your device</li>
        <li>raw recordings</li>
        <li>your email address or sign-in credential</li>
      </ul>
      <p>
        OpenAI states that API inputs and outputs are not used to train its models by default. Its
        abuse-monitoring retention and other processing are governed by its{' '}
        <a href="https://platform.openai.com/docs/models/default-usage-policies-by-endpoint" target="_blank" rel="noopener noreferrer">
          API data controls
        </a>.
      </p>

      <h2>7. Photographs of your destination</h2>
      <p>
        To show a photograph of where you are going, the app sends your destination — a town, region
        or country — to the Unsplash image search API, and stores the image reference it returns.
        Nothing else is sent, and Unsplash receives no identifier connecting the search to you or your
        account. If no photograph is found, the app records that and does not search again.
      </p>

      <h2>8. Information about other people</h2>
      <p>
        What you write about your trip may mention other people: who you are travelling with, who you
        are visiting, and why. That text is processed as described above, and anything you approve as
        a memory is stored on your device.
      </p>
      <p>
        Those people have not agreed to this, so please do not include other people&apos;s health
        information, identification numbers, financial details or exact home addresses. The app is
        designed to keep only what it needs to prepare language — it will prepare for travelling with
        someone who needs support without recording why — but it cannot catch everything, and you can
        edit or delete any memory in the app.
      </p>
      <p>
        Memories you mark high-sensitivity stay on your device and are never sent to an AI service or
        mirrored to the cloud.
      </p>

      <h2>9. Analytics and technical data</h2>
      <p>
        No advertising identifier is collected, at any point, by the app or by any library it
        includes.
      </p>
      <p>
        Analytics collection is off when the app is installed and stays off until you agree to it. If
        you agree, the app records anonymous counts of feature use — which screens are reached,
        whether onboarding completed, whether a practice session finished. Event content is filtered
        before sending, and the app does not send phrase text, translations, transcripts, recordings,
        names, addresses or memory content. You can change this choice at any time in settings.
      </p>

      <h2>10. Purchases and full access</h2>
      <p>
        Full access to thereabouts is a one-time purchase. Payment itself is handled entirely by Apple
        or Google &mdash; we never receive or store your payment card details, billing address or
        bank information.
      </p>
      <p>
        To know whether you have bought the app, thereabouts uses <strong>RevenueCat</strong>, a
        purchase-infrastructure provider acting as our processor. RevenueCat sits between the app and
        the store and keeps the record of what you own. It is used only when the app checks your
        access, when you buy, and when you restore a purchase.
      </p>
      <p>What RevenueCat receives and holds:</p>
      <ul>
        <li>
          <strong>A linked user identifier.</strong> Before you sign in with Apple or Google, this is
          an anonymous identifier RevenueCat generates for the install. Once you link Apple or Google
          sign-in, your Firebase user identifier becomes that identifier, so a purchase made before
          signing in stays attached to you. It is an identifier only &mdash; not your name, and not
          your email address.
        </li>
        <li>
          <strong>Purchase history and receipt data</strong> passed on from the App Store or Google
          Play: the product bought, the transaction and its identifiers, the store, the price and
          currency, the purchase, renewal or refund status, and the country of the store account.
        </li>
        <li>
          <strong>Entitlement status</strong> &mdash; the processed result of the above, which is
          simply whether full access is currently unlocked. This is what the app asks for at launch,
          when it returns to the foreground, and after a purchase or restore.
        </li>
        <li>
          <strong>Technical data about the install</strong>, such as the platform, app version, store
          and country, which RevenueCat uses to validate a receipt against the right store.
        </li>
      </ul>
      <p>
        Your trip, your phrases, your practice, your memories, your transcripts and your feedback are
        never sent to RevenueCat. No advertising identifier is sent to it, and the app does not use
        RevenueCat for analytics, attribution or marketing.
      </p>
      <p>
        Your confirmed unlock is also stored on your device, so the app works offline and does not
        lock you out when a check cannot reach the network.
      </p>
      <p>
        RevenueCat processes this data under its own{' '}
        <a href="https://www.revenuecat.com/privacy" target="_blank" rel="noopener noreferrer">
          privacy policy
        </a>{' '}
        and under a data-processing agreement with us. Apple and Google process the payment under
        their own privacy policies, and the store &mdash; not us &mdash; is who a refund is requested
        from.
      </p>

      <h2>11. Feedback you send us</h2>
      <p>
        If you report something from inside the app, what you write is stored in our Google Cloud
        Firestore database along with the account identifier it was sent from, the kind of report you
        chose, and the time you sent it. It never carries your trip, your phrases, your memories, your
        destination or anything else you have written in the app.
      </p>
      <p>
        The report also carries your app and device details unless you turn that off before sending.
        The toggle starts on, and what it sends is the app version and build number, the platform, the
        operating system version, the device model, and the name of the screen you were on — the name
        only, never what was on it. Turning it off drops all of it rather than some of it.
      </p>
      <p>
        Sending a report is not governed by the cloud backup choice in section 4. That choice is about
        your records being copied somewhere; a report is a message you wrote and pressed send on. If
        you are offline, the report waits on your device and is sent the next time the app opens with a
        connection.
      </p>
      <p>
        Reports are kept until they have been dealt with, are readable only by us, and are not used for
        anything else. You cannot read a report back or edit it once it has been sent — email{' '}
        <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a> if you want one removed.
      </p>

      <h2>12. Keeping the service within its limits</h2>
      <p>
        To stop a fault or a misuse of the app running up unbounded cost, the service counts the
        requests made by each copy of it. That record is stored in Google Cloud Firestore and holds a
        count, a timestamp and the identifier it is counting: your account identifier, or — for the
        brief window at startup before an account exists — the IP address the request came from. It
        holds nothing about what you asked for.
      </p>

      <h2>13. Why information is processed</h2>
      <ul>
        <li>To provide local trip preparation and practice you request</li>
        <li>To authenticate an owner and prevent access to another learner&apos;s records</li>
        <li>To provide optional backup, translation, or analytics where the relevant choice permits it</li>
        <li>To read and act on what you report to us</li>
        <li>To secure the service, prevent abuse, diagnose failures, and meet legal obligations</li>
      </ul>

      <h2>14. Retention and deletion</h2>
      <ul>
        <li>Local learner-created data remains until you delete it, clear the app, or uninstall it.</li>
        <li>Cloud-mirrored data remains until it is deleted following a verified request.</li>
        <li>Your Firebase Authentication record remains until the account is deleted.</li>
        <li>
          Your RevenueCat customer record remains until the account is deleted. The store&apos;s own
          record of the purchase belongs to Apple or Google and is kept under their terms.
        </li>
        <li>Feedback reports remain until they have been dealt with.</li>
        <li>Request-count records fall out of use at the end of the day they were written for.</li>
        <li>Service providers may retain security, abuse-prevention, and operational records under their own terms or where law requires.</li>
      </ul>
      <p>
        Settings includes a control that deletes your account and everything associated with it: the
        RevenueCat customer record first, then cloud-mirrored records, then the data on your device,
        then the authentication account. RevenueCat goes first because that record is keyed to your
        account identifier and deleting it has to be authorised while the account still exists. If
        that step fails, deletion stops there rather than telling you every copy is gone while one is
        still held by a processor. Deleting the RevenueCat record does not cancel your purchase with
        Apple or Google and is not a refund: ownership stays with your store account, and{' '}
        <em>Restore purchases</em> returns your access.
        If the cloud step fails, the account is kept rather than leaving records behind that nothing
        can reach. A separate control deletes learner-created data on the device only. That one keeps
        any feedback report still waiting to be sent, on the grounds that a message you wrote to us —
        quite possibly about whatever made you reset — is not something to discard without asking.
        Deleting your account does clear those unsent reports. Audio files cached on your device are
        removed with your device data.
      </p>

      <h2>15. International processing</h2>
      <p>
        Firebase Authentication is operated by Google from US data centres. The Firebase Function that
        reaches OpenAI runs in europe-west2 (London), as does the function that deletes your
        RevenueCat record. OpenAI, Microsoft Azure Speech, Unsplash and RevenueCat may process
        requests outside the UK; RevenueCat is a United States company and processes purchase data
        there. Appropriate provider contractual safeguards apply where
        required.
      </p>

      <h2>16. Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, erase, restrict, export,
        or object to processing of your personal data, and to withdraw consent without affecting prior
        lawful processing. Contact us using the address below. You may also complain to the UK
        Information Commissioner&apos;s Office or your local supervisory authority.
      </p>

      <h2>17. Children</h2>
      <p>
        thereabouts is designed as an adult travel-learning app and is not directed to children under
        13. We do not knowingly seek children&apos;s personal information.
      </p>

      <h2>18. Changes and contact</h2>
      <p>
        We will update this policy when the app&apos;s data handling changes and provide appropriate
        notice before a material new use. Questions and requests: {' '}
        <a href="mailto:help@arcturusdc.com">help@arcturusdc.com</a>.
      </p>
    </ThereaboutsLegalPage>
  );
}
