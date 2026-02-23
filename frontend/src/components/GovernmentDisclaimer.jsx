import { Info } from "lucide-react";

export function GovernmentDisclaimer({ className = "" }) {
  return (
    <div className={`bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
            How it works
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            We submit your requests and complaints to GHMC and relevant authorities on your behalf. 
            If any service is not working as expected, we are continuously working to improve it. 
            This is a community platform to help Dammaiguda residents.
          </p>
        </div>
      </div>
    </div>
  );
}

export function IssueDisclaimer({ className = "" }) {
  return (
    <div className={`bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 ${className}`}>
      <p className="text-xs text-blue-700 dark:text-blue-300">
        <strong>Note:</strong> We forward your reported issues to GHMC and local authorities on your behalf. 
        We're working to ensure all complaints reach the right department.
      </p>
    </div>
  );
}
