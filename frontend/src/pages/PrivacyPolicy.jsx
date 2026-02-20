import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { Shield, Lock, Eye, Database, Bell, Users, Mail, Calendar } from "lucide-react";

export default function PrivacyPolicy() {
  const { language } = useLanguage();
  
  const lastUpdated = "February 20, 2026";
  
  return (
    <Layout showBackButton title={language === "te" ? "గోప్యతా విధానం" : "Privacy Policy"}>
      <div className="p-4 pb-24 space-y-6" data-testid="privacy-policy">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-teal-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === "te" ? "గోప్యతా విధానం" : "Privacy Policy"}
          </h1>
          <p className="text-sm text-gray-500">
            {language === "te" ? `చివరిగా నవీకరించబడింది: ${lastUpdated}` : `Last updated: ${lastUpdated}`}
          </p>
        </div>

        {/* Introduction */}
        <section className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-700 leading-relaxed">
            {language === "te" 
              ? "My Dammaiguda ('మేము', 'మా', లేదా 'యాప్') మీ గోప్యతను గౌరవిస్తుంది మరియు మీ వ్యక్తిగత సమాచారాన్ని రక్షించడానికి కట్టుబడి ఉంటుంది. ఈ గోప్యతా విధానం మీరు మా సేవలను ఉపయోగించినప్పుడు మేము మీ సమాచారాన్ని ఎలా సేకరిస్తాము, ఉపయోగిస్తాము మరియు రక్షిస్తామో వివరిస్తుంది."
              : "My Dammaiguda ('we', 'our', or 'the app') respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and protect your information when you use our services."
            }
          </p>
        </section>

        {/* Information We Collect */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "మేము సేకరించే సమాచారం" : "Information We Collect"}
            </h2>
          </div>
          
          <div className="space-y-3 text-gray-700">
            <div className="pl-4 border-l-2 border-blue-200">
              <h3 className="font-medium">{language === "te" ? "ఖాతా సమాచారం" : "Account Information"}</h3>
              <p className="text-sm">{language === "te" 
                ? "ఫోన్ నంబర్, పేరు, కాలనీ, మరియు వయసు పరిధి"
                : "Phone number, name, colony, and age range"
              }</p>
            </div>
            
            <div className="pl-4 border-l-2 border-green-200">
              <h3 className="font-medium">{language === "te" ? "ఆరోగ్య & ఫిట్‌నెస్ డేటా" : "Health & Fitness Data"}</h3>
              <p className="text-sm">{language === "te"
                ? "ఎత్తు, బరువు, BMI, నీటి తీసుకోవడం, వ్యాయామ రికార్డులు (మీరు అందించినట్లయితే)"
                : "Height, weight, BMI, water intake, exercise records (if you provide them)"
              }</p>
            </div>
            
            <div className="pl-4 border-l-2 border-orange-200">
              <h3 className="font-medium">{language === "te" ? "సమస్య నివేదికలు" : "Issue Reports"}</h3>
              <p className="text-sm">{language === "te"
                ? "మీరు నివేదించిన సివిక్ సమస్యలు, ఫోటోలు, మరియు స్థానం"
                : "Civic issues you report, photos, and location data"
              }</p>
            </div>
            
            <div className="pl-4 border-l-2 border-purple-200">
              <h3 className="font-medium">{language === "te" ? "వినియోగ డేటా" : "Usage Data"}</h3>
              <p className="text-sm">{language === "te"
                ? "యాప్ వినియోగ గణాంకాలు, ఫీచర్ యాక్సెస్, సెషన్ సమాచారం"
                : "App usage statistics, feature access, session information"
              }</p>
            </div>
          </div>
        </section>

        {/* How We Use Information */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "మేము సమాచారాన్ని ఎలా ఉపయోగిస్తాము" : "How We Use Your Information"}
            </h2>
          </div>
          
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              {language === "te" ? "సివిక్ సమస్యలను పరిష్కరించడానికి స్థానిక అధికారులకు నివేదించడం" : "Reporting civic issues to local authorities for resolution"}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              {language === "te" ? "వ్యక్తిగతీకరించిన ఆరోగ్య & ఫిట్‌నెస్ ట్రాకింగ్ అందించడం" : "Providing personalized health & fitness tracking"}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              {language === "te" ? "ముఖ్యమైన నవీకరణలు మరియు హెచ్చరికల కోసం నోటిఫికేషన్లు పంపడం" : "Sending notifications for important updates and alerts"}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              {language === "te" ? "యాప్ అనుభవాన్ని మెరుగుపరచడం" : "Improving app experience and features"}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              {language === "te" ? "అత్యవసర SOS హెచ్చరికల కోసం కుటుంబ సభ్యులకు తెలియజేయడం" : "Alerting family members for emergency SOS alerts"}
            </li>
          </ul>
        </section>

        {/* Data Security */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "డేటా భద్రత" : "Data Security"}
            </h2>
          </div>
          
          <p className="text-gray-700 text-sm leading-relaxed">
            {language === "te"
              ? "మేము మీ డేటాను రక్షించడానికి పరిశ్రమ-ప్రామాణిక భద్రతా చర్యలను ఉపయోగిస్తాము, వీటిలో ఎన్‌క్రిప్షన్, సురక్షిత సర్వర్లు మరియు యాక్సెస్ నియంత్రణలు ఉన్నాయి. మీ పాస్‌వర్డ్ హ్యాష్ చేయబడింది మరియు ప్లెయిన్ టెక్స్ట్‌లో నిల్వ చేయబడదు."
              : "We use industry-standard security measures to protect your data, including encryption, secure servers, and access controls. Your password is hashed and never stored in plain text."
            }
          </p>
          
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-800">
              {language === "te"
                ? "⚠️ మేము మీ వ్యక్తిగత డేటాను ఎప్పుడూ మూడవ పక్షాలకు అమ్మము లేదా పంచుకోము."
                : "⚠️ We never sell or share your personal data with third parties for marketing purposes."
              }
            </p>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "నోటిఫికేషన్లు" : "Notifications"}
            </h2>
          </div>
          
          <p className="text-gray-700 text-sm">
            {language === "te"
              ? "మేము మీకు ముఖ్యమైన నవీకరణల గురించి పుష్ నోటిఫికేషన్లు పంపవచ్చు, అత్యవసర హెచ్చరికలు, మరియు మీ నివేదికల స్థితి. మీరు యాప్ సెట్టింగ్‌లలో నోటిఫికేషన్లను నిర్వహించవచ్చు."
              : "We may send you push notifications about important updates, emergency alerts, and status of your reports. You can manage notifications in app settings."
            }
          </p>
        </section>

        {/* Third Party Services */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "మూడవ పక్ష సేవలు" : "Third-Party Services"}
            </h2>
          </div>
          
          <div className="space-y-2 text-gray-700 text-sm">
            <p>{language === "te" ? "మేము ఈ క్రింది సేవలను ఉపయోగిస్తాము:" : "We use the following services:"}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Fit</strong> - {language === "te" ? "ఫిట్‌నెస్ డేటా సమకాలీకరణ (ఐచ్ఛికం)" : "Fitness data sync (optional)"}</li>
              <li><strong>Cloudinary</strong> - {language === "te" ? "చిత్ర నిల్వ" : "Image storage"}</li>
              <li><strong>Authkey.io</strong> - {language === "te" ? "SMS ధృవీకరణ" : "SMS verification"}</li>
            </ul>
          </div>
        </section>

        {/* Your Rights */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "మీ హక్కులు" : "Your Rights"}
            </h2>
          </div>
          
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-teal-500 mt-1">•</span>
              {language === "te" ? "మీ వ్యక్తిగత డేటాను యాక్సెస్ చేయడం మరియు డౌన్‌లోడ్ చేయడం" : "Access and download your personal data"}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 mt-1">•</span>
              {language === "te" ? "తప్పు సమాచారాన్ని సరిచేయడం" : "Correct inaccurate information"}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 mt-1">•</span>
              {language === "te" ? "మీ ఖాతాను మరియు డేటాను తొలగించమని అభ్యర్థించడం" : "Request deletion of your account and data"}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-500 mt-1">•</span>
              {language === "te" ? "నోటిఫికేషన్ల నుండి వైదొలగడం" : "Opt-out of notifications"}
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "మమ్మల్ని సంప్రదించండి" : "Contact Us"}
            </h2>
          </div>
          
          <p className="text-gray-700 text-sm">
            {language === "te"
              ? "మీకు ఏవైనా ప్రశ్నలు లేదా ఆందోళనలు ఉంటే, దయచేసి మమ్మల్ని సంప్రదించండి:"
              : "If you have any questions or concerns, please contact us:"
            }
          </p>
          
          <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
            <p><strong>{language === "te" ? "ఇమెయిల్" : "Email"}:</strong> support@sharkify.ai</p>
            <p><strong>{language === "te" ? "చిరునామా" : "Address"}:</strong> Flat 501, SM Plaza, AS Rao Nagar, Hyderabad 500062</p>
            <p><strong>{language === "te" ? "సంస్థ" : "Company"}:</strong> Sharkify Technology Pvt Ltd</p>
          </div>
        </section>

        {/* Updates to Policy */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "విధాన నవీకరణలు" : "Policy Updates"}
            </h2>
          </div>
          
          <p className="text-gray-700 text-sm">
            {language === "te"
              ? "మేము ఈ గోప్యతా విధానాన్ని కాలానుగుణంగా నవీకరించవచ్చు. మార్పులు ఉంటే, మేము యాప్‌లో నోటిఫికేషన్ పంపుతాము మరియు పేజీపై చివరి నవీకరణ తేదీని నవీకరిస్తాము."
              : "We may update this Privacy Policy from time to time. If there are changes, we will notify you through the app and update the 'Last updated' date on this page."
            }
          </p>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>© 2026 Sharkify Technology Pvt Ltd. {language === "te" ? "అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి." : "All rights reserved."}</p>
        </div>
      </div>
    </Layout>
  );
}
