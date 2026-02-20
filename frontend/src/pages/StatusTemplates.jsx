import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
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
  Star,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palette,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical
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
  
  // Drag-and-drop state
  const [photoPosition, setPhotoPosition] = useState({ x: 150, y: 100 });
  const [photoSize, setPhotoSize] = useState(120);
  const [namePosition, setNamePosition] = useState({ x: 210, y: 280 });
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState("#ffffff");
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [isDraggingName, setIsDraggingName] = useState(false);
  const [editMode, setEditMode] = useState("preview"); // preview, photo, name
  
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTemplates();
    if (user) {
      setDisplayName(user.name || "");
    }
  }, [user, categoryFilter]);

  // Sample fallback templates when DB is empty
  const sampleTemplates = [
    {
      id: "sample-1",
      title: "Ugadi Wishes",
      title_te: "ఉగాది శుభాకాంక్షలు",
      category: "festival",
      background_url: "https://static.prod-images.emergentagent.com/jobs/044ec1e0-0bbd-4371-8858-4deb764fc72a/images/79b37a5afa2166067efdd52ee9e70173629fd95771b00ec0c40b3eabae9b08db.png",
      thumbnail_url: "https://static.prod-images.emergentagent.com/jobs/044ec1e0-0bbd-4371-8858-4deb764fc72a/images/79b37a5afa2166067efdd52ee9e70173629fd95771b00ec0c40b3eabae9b08db.png",
      photo_position: { x: 200, y: 80, width: 120, height: 120, shape: "circle" },
      name_position: { x: 200, y: 350, fontSize: 24, color: "#8B4513", align: "center" }
    },
    {
      id: "sample-2",
      title: "Happy Birthday",
      title_te: "పుట్టినరోజు శుభాకాంక్షలు",
      category: "birthday",
      background_url: "https://static.prod-images.emergentagent.com/jobs/044ec1e0-0bbd-4371-8858-4deb764fc72a/images/48a5573191656e5bc13f3f9be0be236a9917d5a3769d90d772878192b73ea167.png",
      thumbnail_url: "https://static.prod-images.emergentagent.com/jobs/044ec1e0-0bbd-4371-8858-4deb764fc72a/images/48a5573191656e5bc13f3f9be0be236a9917d5a3769d90d772878192b73ea167.png",
      photo_position: { x: 200, y: 120, width: 130, height: 130, shape: "circle" },
      name_position: { x: 200, y: 340, fontSize: 22, color: "#ffffff", align: "center" }
    },
    {
      id: "sample-3",
      title: "Diwali Greetings",
      title_te: "దీపావళి శుభాకాంక్షలు",
      category: "festival",
      background_url: "https://static.prod-images.emergentagent.com/jobs/044ec1e0-0bbd-4371-8858-4deb764fc72a/images/ed0e204c8414c20a3008a3c85214b5bf4a533419cff72a0ab193d6c1e43b6f50.png",
      thumbnail_url: "https://static.prod-images.emergentagent.com/jobs/044ec1e0-0bbd-4371-8858-4deb764fc72a/images/ed0e204c8414c20a3008a3c85214b5bf4a533419cff72a0ab193d6c1e43b6f50.png",
      photo_position: { x: 200, y: 100, width: 120, height: 120, shape: "circle" },
      name_position: { x: 200, y: 280, fontSize: 22, color: "#FFD700", align: "center" }
    },
    {
      id: "sample-4",
      title: "Sankranti Wishes",
      title_te: "సంక్రాంతి శుభాకాంక్షలు",
      category: "festival",
      background_url: "https://static.prod-images.emergentagent.com/jobs/044ec1e0-0bbd-4371-8858-4deb764fc72a/images/c93634804f27546d1d02b94ba9064a9436d0b1370740f62f5bf37a3eeeae071b.png",
      thumbnail_url: "https://static.prod-images.emergentagent.com/jobs/044ec1e0-0bbd-4371-8858-4deb764fc72a/images/c93634804f27546d1d02b94ba9064a9436d0b1370740f62f5bf37a3eeeae071b.png",
      photo_position: { x: 200, y: 100, width: 110, height: 110, shape: "circle" },
      name_position: { x: 200, y: 340, fontSize: 20, color: "#ffffff", align: "center" }
    }
  ];

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      let url = `${API}/templates`;
      if (categoryFilter !== "all") {
        url += `?category=${categoryFilter}`;
      }
      const response = await axios.get(url);
      const apiTemplates = response.data?.templates || [];
      setTemplates(apiTemplates.length > 0 ? apiTemplates : sampleTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      setTemplates(sampleTemplates);
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
    setEditMode("preview");
    
    // Initialize positions from template
    if (template.photo_position) {
      setPhotoPosition({ x: template.photo_position.x, y: template.photo_position.y });
      setPhotoSize(template.photo_position.width || 120);
    }
    if (template.name_position) {
      setNamePosition({ x: template.name_position.x, y: template.name_position.y });
      setFontSize(template.name_position.fontSize || 24);
      setTextColor(template.name_position.color || "#ffffff");
    }
  };

  // Handle touch/mouse drag for photo
  const handlePhotoDragStart = (e) => {
    if (editMode !== "photo") return;
    e.preventDefault();
    setIsDraggingPhoto(true);
  };

  const handleNameDragStart = (e) => {
    if (editMode !== "name") return;
    e.preventDefault();
    setIsDraggingName(true);
  };

  const handleDragMove = useCallback((e) => {
    if (!previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = Math.max(0, Math.min(420, ((clientX - rect.left) / rect.width) * 420));
    const y = Math.max(0, Math.min(420, ((clientY - rect.top) / rect.height) * 420));
    
    if (isDraggingPhoto) {
      setPhotoPosition({ x: x - photoSize/2, y: y - photoSize/2 });
    }
    if (isDraggingName) {
      setNamePosition({ x, y });
    }
  }, [isDraggingPhoto, isDraggingName, photoSize]);

  const handleDragEnd = () => {
    setIsDraggingPhoto(false);
    setIsDraggingName(false);
  };

  useEffect(() => {
    if (isDraggingPhoto || isDraggingName) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDraggingPhoto, isDraggingName, handleDragMove]);

  // Nudge functions
  const nudgePhoto = (dx, dy) => {
    setPhotoPosition(prev => ({
      x: Math.max(0, Math.min(380, prev.x + dx)),
      y: Math.max(0, Math.min(380, prev.y + dy))
    }));
  };

  const nudgeName = (dx, dy) => {
    setNamePosition(prev => ({
      x: Math.max(0, Math.min(420, prev.x + dx)),
      y: Math.max(20, Math.min(400, prev.y + dy))
    }));
  };

  const generateStatus = async () => {
    if (!displayName.trim()) {
      toast.error(language === "te" ? "మీ పేరు ఎంటర్ చేయండి" : "Please enter your name");
      return;
    }

    setGenerating(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
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
        
        // Draw circular photo
        ctx.save();
        ctx.beginPath();
        const centerX = photoPosition.x + photoSize / 2;
        const centerY = photoPosition.y + photoSize / 2;
        const radius = photoSize / 2;
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(photoImg, photoPosition.x, photoPosition.y, photoSize, photoSize);
        ctx.restore();
        
        // Add border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Draw name with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = textColor;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(displayName, namePosition.x, namePosition.y);
      ctx.shadowColor = 'transparent';
      
      // Convert to image URL
      const dataUrl = canvas.toDataURL("image/png");
      setGeneratedImage(dataUrl);
      setEditMode("preview");
      
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
        downloadImage();
        toast.info(language === "te" ? "డౌన్‌లోడ్ చేసి షేర్ చేయండి" : "Download and share manually");
      }
    } catch (error) {
      console.error("Share error:", error);
      downloadImage();
    }
  };

  const resetPositions = () => {
    if (selectedTemplate) {
      if (selectedTemplate.photo_position) {
        setPhotoPosition({ x: selectedTemplate.photo_position.x, y: selectedTemplate.photo_position.y });
        setPhotoSize(selectedTemplate.photo_position.width || 120);
      }
      if (selectedTemplate.name_position) {
        setNamePosition({ x: selectedTemplate.name_position.x, y: selectedTemplate.name_position.y });
        setFontSize(selectedTemplate.name_position.fontSize || 24);
        setTextColor(selectedTemplate.name_position.color || "#ffffff");
      }
    }
    toast.success(language === "te" ? "రీసెట్ అయింది" : "Reset to default");
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

  const colorOptions = ["#ffffff", "#FFD700", "#FF6B6B", "#4ECDC4", "#333333", "#FF69B4"];

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
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-4">
            {selectedTemplate && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>{language === "te" ? "స్టేటస్ క్రియేట్ చేయండి" : "Create Status"}</span>
                    {!generatedImage && (
                      <Button variant="ghost" size="sm" onClick={resetPositions}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  {/* Interactive Preview */}
                  <div 
                    ref={previewRef}
                    className="aspect-square rounded-xl overflow-hidden bg-muted relative touch-none"
                    onMouseMove={handleDragMove}
                    onTouchMove={handleDragMove}
                  >
                    {generatedImage ? (
                      <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <img
                          src={selectedTemplate.background_url}
                          alt={selectedTemplate.title}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Draggable Photo Placeholder */}
                        {(userPhotoPreview || editMode === "photo") && (
                          <div
                            className={`absolute rounded-full overflow-hidden border-4 border-white shadow-lg cursor-move transition-transform ${
                              editMode === "photo" ? 'ring-4 ring-primary ring-offset-2' : ''
                            } ${isDraggingPhoto ? 'scale-105' : ''}`}
                            style={{
                              left: `${(photoPosition.x / 420) * 100}%`,
                              top: `${(photoPosition.y / 420) * 100}%`,
                              width: `${(photoSize / 420) * 100}%`,
                              height: `${(photoSize / 420) * 100}%`,
                            }}
                            onMouseDown={handlePhotoDragStart}
                            onTouchStart={handlePhotoDragStart}
                          >
                            {userPhotoPreview ? (
                              <img src={userPhotoPreview} alt="User" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Camera className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            {editMode === "photo" && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <Move className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Draggable Name */}
                        <div
                          className={`absolute cursor-move whitespace-nowrap transition-transform ${
                            editMode === "name" ? 'ring-2 ring-primary rounded px-2 bg-black/20' : ''
                          } ${isDraggingName ? 'scale-105' : ''}`}
                          style={{
                            left: `${(namePosition.x / 420) * 100}%`,
                            top: `${(namePosition.y / 420) * 100}%`,
                            transform: 'translateX(-50%)',
                            color: textColor,
                            fontSize: `${fontSize * 0.8}px`,
                            fontWeight: 'bold',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                          }}
                          onMouseDown={handleNameDragStart}
                          onTouchStart={handleNameDragStart}
                        >
                          {displayName || (language === "te" ? "మీ పేరు" : "Your Name")}
                          {editMode === "name" && (
                            <GripVertical className="inline-block ml-1 h-4 w-4" />
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {!generatedImage && (
                    <>
                      {/* Edit Mode Tabs */}
                      <div className="flex gap-2 p-1 bg-muted rounded-lg">
                        <Button 
                          variant={editMode === "preview" ? "default" : "ghost"} 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => setEditMode("preview")}
                        >
                          <ImageIcon className="h-3.5 w-3.5 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          variant={editMode === "photo" ? "default" : "ghost"} 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => setEditMode("photo")}
                        >
                          <Camera className="h-3.5 w-3.5 mr-1" />
                          Photo
                        </Button>
                        <Button 
                          variant={editMode === "name" ? "default" : "ghost"} 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => setEditMode("name")}
                        >
                          <Type className="h-3.5 w-3.5 mr-1" />
                          Name
                        </Button>
                      </div>

                      {/* Photo Controls */}
                      {editMode === "photo" && (
                        <Card className="border-primary/50 bg-primary/5">
                          <CardContent className="p-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium">
                                {language === "te" ? "ఫోటో అప్‌లోడ్" : "Upload Photo"}
                              </Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Camera className="h-3.5 w-3.5 mr-1" />
                                {userPhotoPreview ? "Change" : "Upload"}
                              </Button>
                            </div>
                            
                            {/* Size Control */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs">{language === "te" ? "సైజు" : "Size"}</Label>
                                <span className="text-xs text-muted-foreground">{photoSize}px</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                                <Slider
                                  value={[photoSize]}
                                  onValueChange={(v) => setPhotoSize(v[0])}
                                  min={60}
                                  max={180}
                                  step={10}
                                  className="flex-1"
                                />
                                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>

                            {/* Position Controls */}
                            <div className="space-y-2">
                              <Label className="text-xs">{language === "te" ? "పొజిషన్" : "Position"}</Label>
                              <div className="flex items-center justify-center gap-1">
                                <div className="grid grid-cols-3 gap-1">
                                  <div />
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => nudgePhoto(0, -10)}>
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <div />
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => nudgePhoto(-10, 0)}>
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <div className="h-8 w-8 rounded border flex items-center justify-center bg-muted">
                                    <Move className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => nudgePhoto(10, 0)}>
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                  <div />
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => nudgePhoto(0, 10)}>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  <div />
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground text-center">
                                {language === "te" ? "లేదా ఫోటోను డ్రాగ్ చేయండి" : "Or drag photo directly"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Name Controls */}
                      {editMode === "name" && (
                        <Card className="border-primary/50 bg-primary/5">
                          <CardContent className="p-3 space-y-3">
                            <div>
                              <Label className="text-xs font-medium mb-1.5 block">
                                {language === "te" ? "మీ పేరు" : "Your Name"}
                              </Label>
                              <Input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder={language === "te" ? "మీ పేరు ఎంటర్ చేయండి" : "Enter your name"}
                                className="h-10"
                              />
                            </div>
                            
                            {/* Font Size */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs">{language === "te" ? "ఫాంట్ సైజు" : "Font Size"}</Label>
                                <span className="text-xs text-muted-foreground">{fontSize}px</span>
                              </div>
                              <Slider
                                value={[fontSize]}
                                onValueChange={(v) => setFontSize(v[0])}
                                min={14}
                                max={36}
                                step={2}
                              />
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <Palette className="h-3.5 w-3.5" />
                                {language === "te" ? "రంగు" : "Color"}
                              </Label>
                              <div className="flex gap-2 flex-wrap">
                                {colorOptions.map((color) => (
                                  <button
                                    key={color}
                                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                                      textColor === color ? 'border-primary scale-110' : 'border-muted'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setTextColor(color)}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Position Controls */}
                            <div className="space-y-2">
                              <Label className="text-xs">{language === "te" ? "పొజిషన్" : "Position"}</Label>
                              <div className="flex items-center justify-center gap-1">
                                <div className="grid grid-cols-3 gap-1">
                                  <div />
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => nudgeName(0, -10)}>
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <div />
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => nudgeName(-10, 0)}>
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <div className="h-8 w-8 rounded border flex items-center justify-center bg-muted">
                                    <Type className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => nudgeName(10, 0)}>
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                  <div />
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => nudgeName(0, 10)}>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  <div />
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground text-center">
                                {language === "te" ? "లేదా టెక్స్ట్‌ను డ్రాగ్ చేయండి" : "Or drag text directly"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Preview Mode - Simple Photo/Name Input */}
                      {editMode === "preview" && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-14 w-14 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-muted-foreground/30"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              {userPhotoPreview ? (
                                <img src={userPhotoPreview} alt="User" className="w-full h-full object-cover" />
                              ) : (
                                <Camera className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <Input
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder={language === "te" ? "మీ పేరు" : "Your name"}
                                className="h-10"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            {language === "te" 
                              ? "ఫోటో మరియు టెక్స్ట్ పొజిషన్ మార్చడానికి ట్యాబ్‌లను ఉపయోగించండి" 
                              : "Use Photo/Name tabs to adjust positions"}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                <DialogFooter className="flex gap-2 mt-4">
                  {generatedImage ? (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => setGeneratedImage(null)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {language === "te" ? "మార్చండి" : "Edit"}
                      </Button>
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
                      disabled={generating || !displayName.trim()}
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
