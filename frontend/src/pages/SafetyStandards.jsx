import Layout from "../components/Layout";
import { Shield, AlertTriangle, Phone, Mail, FileText } from "lucide-react";

export default function SafetyStandards() {
  return (
    <Layout title="Safety Standards">
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900">
            <Shield className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Safety Standards</h1>
          <p className="text-muted-foreground">
            Child Sexual Abuse and Exploitation (CSAE) Prevention Policy
          </p>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Our Commitment
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              My Dammaiguda is committed to providing a safe environment for all users, especially children. 
              We have zero tolerance for child sexual abuse and exploitation (CSAE) content or behavior 
              on our platform. We actively work to prevent, detect, and remove any such content and 
              cooperate fully with law enforcement authorities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Prohibited Content and Behavior
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The following are strictly prohibited on My Dammaiguda:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Any content that sexualizes minors</li>
              <li>Child sexual abuse material (CSAM) of any kind</li>
              <li>Content that promotes or glorifies child exploitation</li>
              <li>Grooming behavior or attempts to contact minors inappropriately</li>
              <li>Sharing or requesting inappropriate images of minors</li>
              <li>Any content that endangers children's safety or well-being</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Detection and Prevention Measures</h2>
            <p className="text-muted-foreground leading-relaxed">
              We employ the following measures to prevent CSAE:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Content moderation by trained administrators</li>
              <li>User reporting mechanisms for suspicious content</li>
              <li>Immediate removal of violating content upon detection</li>
              <li>Account suspension for policy violations</li>
              <li>Cooperation with NCMEC (National Center for Missing & Exploited Children)</li>
              <li>Reporting to relevant law enforcement agencies</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Reporting Violations</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you encounter any content or behavior that violates these standards, please report it immediately:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 mt-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-teal-600" />
                <span className="text-foreground">Email: safety@mydammaiguda.in</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-teal-600" />
                <span className="text-foreground">Helpline: 1098 (CHILDLINE India)</span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">Enforcement Actions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Violations of this policy will result in:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Immediate content removal</li>
              <li>Permanent account termination</li>
              <li>Reporting to law enforcement authorities</li>
              <li>Reporting to NCMEC CyberTipline</li>
              <li>Full cooperation with criminal investigations</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">External Resources</h2>
            <ul className="text-muted-foreground space-y-2">
              <li>
                <a href="https://www.missingkids.org/gethelpnow/cybertipline" 
                   target="_blank" rel="noopener noreferrer"
                   className="text-teal-600 hover:underline">
                  NCMEC CyberTipline
                </a>
              </li>
              <li>
                <a href="https://www.childlineindia.org/" 
                   target="_blank" rel="noopener noreferrer"
                   className="text-teal-600 hover:underline">
                  CHILDLINE India
                </a>
              </li>
              <li>
                <a href="https://cybercrime.gov.in/" 
                   target="_blank" rel="noopener noreferrer"
                   className="text-teal-600 hover:underline">
                  National Cyber Crime Reporting Portal (India)
                </a>
              </li>
            </ul>
          </section>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Last updated: February 2026
        </p>
      </div>
    </Layout>
  );
}
