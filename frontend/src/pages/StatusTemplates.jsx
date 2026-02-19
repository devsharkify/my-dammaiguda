import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Image as ImageIcon,
  Download,
  Share2,
  Loader2,
  Sparkles,
  Camera,
  Type,
  Check,
  X,
  PartyPopper,
  Calendar,
  MessageCircle,
  Star
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StatusTemplates() {
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [userPhoto, setUserPhoto] = useState(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTemplates();
    if (user) {
      setDisplayName(user.name || "");
    }
  }, [user, categoryFilter]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      let url = `${API}/templates`;
      if (categoryFilter !== "all") {
        url += `?category=${categoryFilter}`;
      }
      const response = await axios.get(url);
      setTemplates(response.data?.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      // Add sample templates if API fails
      setTemplates([
        {
          id: "sample-1",
          title: "Ugadi Wishes",
          title_te: "ఉగాది శుభాకాంక్షలు",
          category: "festival",
          background_url: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800",
          thumbnail_url: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=200",
          photo_position: { x: 150, y: 100, width: 120, height: 120, shape: "circle" },
          name_position: { x: 210, y: 280, fontSize: 24, color: "#ffffff", align: "center" }
        },
        {
          id: "sample-2",
          title: "Happy Birthday",
          title_te: "పుట్టినరోజు శుభాకాంక్షలు",
          category: "birthday",
          background_url: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800",
          thumbnail_url: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=200",
          photo_position: { x: 150, y: 80, width: 100, height: 100, shape: "circle" },
          name_position: { x: 200, y: 240, fontSize: 20, color: "#333333", align: "center" }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(language === "te" ? "ఫోటో 5MB కంటే తక్కువ ఉండాలి" : "Photo must be less than 5MB");
        return;
      }
      setUserPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setUserPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const openEditor = (template) => {
    setSelectedTemplate(template);
    setShowEditor(true);
    setGeneratedImage(null);
  };

  const generateStatus = async () => {
    if (!displayName.trim()) {
      toast.error(language === "te" ? "మీ పేరు ఎంటర్ చేయండి" : "Please enter your name");
      return;
    }

    setGenerating(true);
    try {
      // Create canvas-based image
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 420;
      canvas.height = 420;
      
      // Load background image
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = selectedTemplate.background_url;
      
      await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = reject;
      });
      
      // Draw background
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      
      // Draw user photo if uploaded
      if (userPhotoPreview) {
        const photoImg = new Image();
        photoImg.src = userPhotoPreview;
        
        await new Promise((resolve) => {
          photoImg.onload = resolve;
        });
        
        const pos = selectedTemplate.photo_position;
        
        // Draw circular photo
        ctx.save();
        ctx.beginPath();
        const centerX = pos.x + pos.width / 2;
        const centerY = pos.y + pos.height / 2;
        const radius = Math.min(pos.width, pos.height) / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(photoImg, pos.x, pos.y, pos.width, pos.height);
        ctx.restore();
        
        // Add border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Draw name
      const namePos = selectedTemplate.name_position;
      ctx.fillStyle = namePos.color || "#ffffff";
      ctx.font = `bold ${namePos.fontSize || 24}px Arial`;
      ctx.textAlign = namePos.align || "center";
      ctx.fillText(displayName, namePos.x, namePos.y);
      
      // Convert to image URL
      const dataUrl = canvas.toDataURL("image/png");
      setGeneratedImage(dataUrl);
      
      // Record usage if logged in
      if (token) {
        try {
          await axios.post(
            `${API}/templates/generate`,
            {
              template_id: selectedTemplate.id,
              user_photo_url: null,
              display_name: displayName
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (e) {
          console.log("Usage tracking failed:", e);
        }
      }
      
      toast.success(language === "te" ? "స్టేటస్ సిద్ధం!" : "Status ready!");
    } catch (error) {
      console.error("Error generating status:", error);
      toast.error(language === "te" ? "జెనరేట్ చేయడం విఫలమైంది" : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.download = `${selectedTemplate.title.replace(/\s+/g, '_')}_status.png`;
    link.href = generatedImage;
    link.click();
    toast.success(language === "te" ? "డౌన్‌లోడ్ అయింది!" : "Downloaded!");
  };

  const shareImage = async () => {
    if (!generatedImage) return;
    
    try {
      const blob = await (await fetch(generatedImage)).blob();
      const file = new File([blob], 'status.png', { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: selectedTemplate.title,
          text: `Created with My Dammaiguda App`
        });
      } else {
        // Fallback - download
        downloadImage();
        toast.info(language === "te" ? "డౌన్‌లోడ్ చేసి షేర్ చేయండి" : "Download and share manually");
      }
    } catch (error) {
      console.error("Share error:", error);
      downloadImage();
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "festival": return <PartyPopper className="h-4 w-4" />;
      case "birthday": return <Star className="h-4 w-4" />;
      case "event": return <Calendar className="h-4 w-4" />;
      case "greeting": return <MessageCircle className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const categories = [
    { value: "all", label: language === "te" ? "అన్నీ" : "All" },
    { value: "festival", label: language === "te" ? "పండుగలు" : "Festivals" },
    { value: "birthday", label: language === "te" ? "పుట్టినరోజు" : "Birthday" },
    { value: "event", label: language === "te" ? "ఈవెంట్స్" : "Events" },
    { value: "greeting", label: language === "te" ? "శుభాకాంక్షలు" : "Greetings" }
  ];

  return (
    <Layout showBackButton title={language === "te" ? "స్టేటస్ టెంప్లేట్లు" : "Status Templates"}>
      <div className="space-y-4 pb-20" data-testid="status-templates">
        {/* Header */}
        <div className="text-center py-4">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-3">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-lg font-bold">
            {language === "te" ? "మీ స్టేటస్ క్రియేట్ చేయండి" : "Create Your Status"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === "te" ? "ఫోటో & పేరు జోడించి షేర్ చేయండి" : "Add photo & name, share anywhere"}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={categoryFilter === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(cat.value)}
              className="flex-shrink-0"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {language === "te" ? "టెంప్లేట్లు అందుబాటులో లేవు" : "No templates available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all active:scale-95"
                onClick={() => openEditor(template)}
                data-testid={`template-${template.id}`}
              >
                <div className="aspect-square relative">
                  <img
                    src={template.thumbnail_url || template.background_url}
                    alt={template.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <Badge className="mb-1 text-[10px]" variant="secondary">
                      {getCategoryIcon(template.category)}
                      <span className="ml-1">{template.category}</span>
                    </Badge>
                    <h3 className="text-white font-semibold text-sm line-clamp-1">
                      {language === "te" && template.title_te ? template.title_te : template.title}
                    </h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Hidden Canvas for Image Generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Editor Dialog */}
        <Dialog open={showEditor} onOpenChange={setShowEditor}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            {selectedTemplate && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {language === "te" ? "స్టేటస్ క్రియేట్ చేయండి" : "Create Status"}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Preview */}
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted relative">
                    {generatedImage ? (
                      <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={selectedTemplate.background_url}
                        alt={selectedTemplate.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {!generatedImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <p className="text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                          {language === "te" ? "ప్రివ్యూ" : "Preview"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      {language === "te" ? "మీ ఫోటో (ఐచ్ఛికం)" : "Your Photo (Optional)"}
                    </Label>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-muted-foreground/30"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {userPhotoPreview ? (
                          <img src={userPhotoPreview} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          {userPhotoPreview 
                            ? (language === "te" ? "మార్చండి" : "Change") 
                            : (language === "te" ? "ఫోటో అప్‌లోడ్" : "Upload Photo")}
                        </Button>
                        {userPhotoPreview && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 text-destructive"
                            onClick={() => { setUserPhoto(null); setUserPhotoPreview(null); }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>

                  {/* Name Input */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      {language === "te" ? "మీ పేరు *" : "Your Name *"}
                    </Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={language === "te" ? "మీ పేరు ఎంటర్ చేయండి" : "Enter your name"}
                      className="h-12"
                    />
                  </div>
                </div>

                <DialogFooter className="flex gap-2 mt-4">
                  {generatedImage ? (
                    <>
                      <Button variant="outline" className="flex-1" onClick={downloadImage}>
                        <Download className="h-4 w-4 mr-2" />
                        {language === "te" ? "డౌన్‌లోడ్" : "Download"}
                      </Button>
                      <Button className="flex-1" onClick={shareImage}>
                        <Share2 className="h-4 w-4 mr-2" />
                        {language === "te" ? "షేర్" : "Share"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={generateStatus}
                      disabled={generating}
                    >
                      {generating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {language === "te" ? "స్టేటస్ క్రియేట్ చేయండి" : "Create Status"}
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
