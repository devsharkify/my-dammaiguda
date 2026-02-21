import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * AdminDashboard - Deprecated
 * This page now redirects to the new Multi-Area Admin Panel (/admin/panel)
 * 
 * For backwards compatibility, we preserve any query params like ?tab=news
 * and redirect users to the new panel.
 */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Preserve query parameters when redirecting
    const params = searchParams.toString();
    const redirectUrl = params ? `/admin/panel?${params}` : "/admin/panel";
    
    // Small delay to show loading state
    const timer = setTimeout(() => {
      navigate(redirectUrl, { replace: true });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100" data-testid="admin-redirect">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-gray-600">Redirecting to Admin Panel...</p>
      <p className="text-sm text-gray-400 mt-2">
        The Admin Dashboard has moved to a new location.
      </p>
    </div>
  );
}
