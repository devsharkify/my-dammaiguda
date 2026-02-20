import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { Shield, AlertTriangle, Phone, Mail, FileText, CheckCircle } from "lucide-react";

export default function ChildSafety() {
  const { language } = useLanguage();
  
  const lastUpdated = "February 20, 2026";
  
  return (
    <Layout showBackButton title="Child Safety Standards">
      <div className="p-4 pb-24 space-y-6" data-testid="child-safety">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Child Safety Standards
          </h1>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <section className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-700 leading-relaxed">
            My Dammaiguda is committed to protecting children and maintaining a safe environment for all users. We have zero tolerance for child sexual abuse material (CSAM) or any content that exploits or endangers children.
          </p>
        </section>

        {/* Our Commitment */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Our Commitment
            </h2>
          </div>
          <ul className="text-gray-700 text-sm space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>We prohibit any content that sexually exploits or endangers children</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>We immediately remove any CSAM content and report to authorities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>We cooperate fully with law enforcement investigations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>We permanently ban users who violate child safety policies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>We comply with all applicable child protection laws in India</span>
            </li>
          </ul>
        </section>

        {/* Prohibited Content */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Prohibited Content
            </h2>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            The following content is strictly prohibited on My Dammaiguda:
          </p>
          <ul className="text-gray-700 text-sm space-y-2 list-disc pl-5">
            <li>Child sexual abuse material (CSAM) of any kind</li>
            <li>Content that sexualizes minors</li>
            <li>Grooming behavior or communication</li>
            <li>Content that endangers children's safety</li>
            <li>Sharing personal information of minors without consent</li>
            <li>Any content that exploits children</li>
          </ul>
        </section>

        {/* Reporting */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              How to Report
            </h2>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            If you encounter any content that violates our child safety standards, please report immediately:
          </p>
          <div className="bg-red-50 p-3 rounded-lg space-y-2">
            <p className="text-sm font-medium text-red-800">Report Child Safety Concerns:</p>
            <div className="flex items-center gap-2 text-sm text-red-700">
              <Mail className="w-4 h-4" />
              <a href="mailto:safety@sharkify.ai" className="underline">safety@sharkify.ai</a>
            </div>
            <div className="flex items-center gap-2 text-sm text-red-700">
              <Phone className="w-4 h-4" />
              <span>Childline India: 1098 (24/7)</span>
            </div>
          </div>
        </section>

        {/* Enforcement */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Enforcement Actions
            </h2>
          </div>
          <ul className="text-gray-700 text-sm space-y-2 list-disc pl-5">
            <li>Immediate removal of violating content</li>
            <li>Permanent account termination</li>
            <li>Reporting to National Center for Missing & Exploited Children (NCMEC)</li>
            <li>Reporting to Indian Cyber Crime authorities</li>
            <li>Cooperation with law enforcement agencies</li>
            <li>Preservation of evidence for investigations</li>
          </ul>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Contact Us
            </h2>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            For questions about our child safety standards or to report concerns:
          </p>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Safety Team:</strong> safety@sharkify.ai</p>
            <p><strong>General Support:</strong> support@sharkify.ai</p>
            <p><strong>Company:</strong> Sharkify Technology Pvt Ltd</p>
            <p><strong>Address:</strong> Flat 501, SM Plaza, AS Rao Nagar, Hyderabad 500062</p>
          </div>
        </section>

        {/* Compliance */}
        <section className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">Legal Compliance</h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            My Dammaiguda complies with the Protection of Children from Sexual Offences Act (POCSO), 2012, Information Technology Act, 2000, and all other applicable Indian laws regarding child protection. We report CSAM to the appropriate authorities as required by law.
          </p>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4">
          <p>© 2026 Sharkify Technology Pvt Ltd. All rights reserved.</p>
        </div>
      </div>
    </Layout>
  );
}
