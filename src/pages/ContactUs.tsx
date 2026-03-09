// src/pages/ContactUs.tsx
import { PublicLayout } from '../components/PublicLayout';

export function ContactUs() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-600 mb-6">
          For support, feedback or partnership enquiries — reach out to us.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Email</h3>
            <p>testingblood2025@gmail.com</p>
            <h3 className="font-semibold mt-6 mb-2">Phone</h3>
            <p>+91 9999999999</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Send a message</h3>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input className="w-full border rounded px-3 py-2" placeholder="Your name" />
              <input className="w-full border rounded px-3 py-2" placeholder="Your email" />
              <textarea className="w-full border rounded px-3 py-2" rows={4} placeholder="Message" />
              <button className="bg-red-500 text-white px-4 py-2 rounded">Send</button>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export default ContactUs;
