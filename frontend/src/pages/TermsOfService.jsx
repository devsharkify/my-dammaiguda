import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";
import { FileText, Scale, AlertCircle, Users, Shield, Globe, Mail } from "lucide-react";

export default function TermsOfService() {
  const { language } = useLanguage();
  
  const lastUpdated = "February 20, 2026";
  
  return (
    <Layout showBackButton title={language === "te" ? "సేవా నిబంధనలు" : "Terms of Service"}>
      <div className="p-4 pb-24 space-y-6" data-testid="terms-of-service">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === "te" ? "సేవా నిబంధనలు" : "Terms of Service"}
          </h1>
          <p className="text-sm text-gray-500">
            {language === "te" ? `చివరిగా నవీకరించబడింది: ${lastUpdated}` : `Last updated: ${lastUpdated}`}
          </p>
        </div>

        {/* Introduction */}
        <section className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-700 leading-relaxed">
            {language === "te" 
              ? "My Dammaiguda యాప్‌ను ఉపయోగించడం ద్వారా, మీరు ఈ సేవా నిబంధనలకు అంగీకరిస్తున్నారు. దయచేసి వాటిని జాగ్రత్తగా చదవండి."
              : "By using the My Dammaiguda app, you agree to these Terms of Service. Please read them carefully."
            }
          </p>
        </section>

        {/* Acceptance of Terms */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "నిబంధనల అంగీకారం" : "Acceptance of Terms"}
            </h2>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {language === "te"
              ? "ఈ యాప్‌ను యాక్సెస్ చేయడం లేదా ఉపయోగించడం ద్వారా, మీరు ఈ నిబంధనలకు కట్టుబడి ఉండటానికి అంగీకరిస్తున్నారు. మీరు అంగీకరించకపోతే, దయచేసి యాప్‌ను ఉపయోగించవద్దు."
              : "By accessing or using this app, you agree to be bound by these terms. If you disagree, please do not use the app."
            }
          </p>
        </section>

        {/* User Responsibilities */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "వినియోగదారు బాధ్యతలు" : "User Responsibilities"}
            </h2>
          </div>
          <ul className="text-gray-700 text-sm space-y-2 list-disc pl-5">
            <li>{language === "te" ? "ఖచ్చితమైన మరియు నిజమైన సమాచారం అందించండి" : "Provide accurate and truthful information"}</li>
            <li>{language === "te" ? "మీ ఖాతా ఆధారాలను సురక్షితంగా ఉంచండి" : "Keep your account credentials secure"}</li>
            <li>{language === "te" ? "ఇతరులను వేధించే కంటెంట్ పోస్ట్ చేయవద్దు" : "Do not post content that harasses others"}</li>
            <li>{language === "te" ? "తప్పుడు సమస్య నివేదికలు సమర్పించవద్దు" : "Do not submit false issue reports"}</li>
            <li>{language === "te" ? "అన్ని వర్తించే చట్టాలను పాటించండి" : "Comply with all applicable laws"}</li>
          </ul>
        </section>

        {/* Prohibited Activities */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "నిషేధిత కార్యకలాపాలు" : "Prohibited Activities"}
            </h2>
          </div>
          <ul className="text-gray-700 text-sm space-y-2 list-disc pl-5">
            <li>{language === "te" ? "స్పామ్ లేదా హానికరమైన కంటెంట్ పంపడం" : "Sending spam or harmful content"}</li>
            <li>{language === "te" ? "ఇతరుల గుర్తింపును అనుకరించడం" : "Impersonating others"}</li>
            <li>{language === "te" ? "యాప్ సేవలకు అంతరాయం కలిగించే ప్రయత్నాలు" : "Attempting to disrupt app services"}</li>
            <li>{language === "te" ? "అనధికార యాక్సెస్ పొందడానికి ప్రయత్నించడం" : "Trying to gain unauthorized access"}</li>
            <li>{language === "te" ? "చట్టవిరుద్ధమైన ప్రయోజనాల కోసం యాప్‌ను ఉపయోగించడం" : "Using the app for illegal purposes"}</li>
          </ul>
        </section>

        {/* Privacy */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "గోప్యత" : "Privacy"}
            </h2>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {language === "te"
              ? "మీ గోప్యత మాకు ముఖ్యమైనది. మేము మీ డేటాను ఎలా సేకరిస్తాము మరియు ఉపయోగిస్తామో తెలుసుకోవడానికి మా గోప్యతా విధానాన్ని సమీక్షించండి."
              : "Your privacy is important to us. Please review our Privacy Policy to understand how we collect and use your data."
            }
          </p>
          <a href="/privacy-policy" className="text-teal-600 text-sm font-medium hover:underline">
            {language === "te" ? "గోప్యతా విధానం చదవండి →" : "Read Privacy Policy →"}
          </a>
        </section>

        {/* Disclaimer */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "నిరాకరణ" : "Disclaimer"}
            </h2>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {language === "te"
              ? "యాప్ 'ఉన్నది ఉన్నట్లుగా' అందించబడుతుంది. ఆరోగ్య సమాచారం విద్యా ప్రయోజనాల కోసం మాత్రమే మరియు వృత్తిపరమైన వైద్య సలహాకు ప్రత్యామ్నాయం కాదు."
              : "The app is provided 'as is'. Health information is for educational purposes only and is not a substitute for professional medical advice."
            }
          </p>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "te" ? "మమ్మల్ని సంప్రదించండి" : "Contact Us"}
            </h2>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {language === "te"
              ? "ఈ నిబంధనల గురించి మీకు ఏవైనా ప్రశ్నలు ఉంటే, దయచేసి మమ్మల్ని సంప్రదించండి:"
              : "If you have any questions about these terms, please contact us:"
            }
          </p>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Email:</strong> support@mydammaiguda.in</p>
            <p><strong>Website:</strong> https://www.mydammaiguda.in</p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4">
          <p>© 2026 Sharkify Technology Private Limited</p>
          <p>{language === "te" ? "అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి" : "All rights reserved"}</p>
        </div>
      </div>
    </Layout>
  );
}
