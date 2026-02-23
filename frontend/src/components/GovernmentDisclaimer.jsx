import { Info, ExternalLink } from "lucide-react";

export function GovernmentDisclaimer({ sources = [], className = "" }) {
  return (
    <div className={`bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
            Disclaimer
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            This app is developed by Sharkify Technology Pvt Ltd and is <strong>not affiliated with, endorsed by, or representing any government entity</strong>. 
            Information provided is for reference purposes only. Please verify all information from official government sources before taking any action.
          </p>
          {sources.length > 0 && (
            <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">
                Official Sources:
              </p>
              <div className="flex flex-wrap gap-2">
                {sources.map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {source.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AQISourceAttribution() {
  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-2">
      <span>Data source:</span>
      <a 
        href="https://cpcb.nic.in" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
      >
        Central Pollution Control Board (CPCB)
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

export function BenefitsSourceAttribution() {
  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-2">
      <p className="font-medium">For official government schemes, visit:</p>
      <div className="flex flex-wrap gap-3">
        <a 
          href="https://www.myscheme.gov.in" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
        >
          myscheme.gov.in
          <ExternalLink className="h-3 w-3" />
        </a>
        <a 
          href="https://www.india.gov.in/topics/agriculture/schemes" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
        >
          india.gov.in
          <ExternalLink className="h-3 w-3" />
        </a>
        <a 
          href="https://www.telangana.gov.in" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
        >
          telangana.gov.in
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

// Official Government Sources
export const OFFICIAL_SOURCES = {
  benefits: [
    { name: "MyScheme.gov.in", url: "https://www.myscheme.gov.in" },
    { name: "India.gov.in", url: "https://www.india.gov.in" },
    { name: "Telangana.gov.in", url: "https://www.telangana.gov.in" }
  ],
  aqi: [
    { name: "CPCB", url: "https://cpcb.nic.in" },
    { name: "AQI India", url: "https://www.aqi.in" }
  ],
  municipal: [
    { name: "GHMC", url: "https://www.ghmc.gov.in" },
    { name: "Telangana Municipal Portal", url: "https://cdma.telangana.gov.in" }
  ]
};
