import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Share2, Loader2, CheckCircle } from "lucide-react";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";

export default function ShareHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [sharedData, setSharedData] = useState(null);

  useEffect(() => {
    // Get shared data from URL params
    const title = searchParams.get("title") || "";
    const text = searchParams.get("text") || "";
    const url = searchParams.get("url") || "";

    if (title || text || url) {
      setSharedData({ title, text, url });
      toast.success("Content received!");
    }
    
    setProcessing(false);
  }, [searchParams]);

  const handleCreatePost = () => {
    // Navigate to report page with shared content
    const content = [sharedData?.title, sharedData?.text, sharedData?.url]
      .filter(Boolean)
      .join("\n");
    
    navigate("/report", { state: { sharedContent: content } });
  };

  const handleShareToWall = () => {
    // Navigate to wall with shared content
    const content = [sharedData?.title, sharedData?.text, sharedData?.url]
      .filter(Boolean)
      .join("\n");
    
    navigate("/wall", { state: { sharedContent: content } });
  };

  if (processing) {
    return (
      <Layout showBackButton title="Processing...">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
          <p className="text-gray-600">Processing shared content...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title="Shared Content">
      <div className="p-4 space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Content Received!</h1>
          <p className="text-sm text-gray-500">What would you like to do with this?</p>
        </div>

        {/* Shared Content Preview */}
        {sharedData && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {sharedData.title && (
              <p className="font-medium text-gray-900">{sharedData.title}</p>
            )}
            {sharedData.text && (
              <p className="text-sm text-gray-600">{sharedData.text}</p>
            )}
            {sharedData.url && (
              <a href={sharedData.url} target="_blank" rel="noopener noreferrer" 
                 className="text-sm text-teal-600 underline break-all">
                {sharedData.url}
              </a>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleCreatePost}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Report as Issue
          </Button>
          
          <Button 
            onClick={handleShareToWall}
            variant="outline"
            className="w-full"
          >
            Share to Community Wall
          </Button>
          
          <Button 
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </Layout>
  );
}
