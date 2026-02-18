import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";
import Layout from "../components/Layout";
import {
  Trash2,
  Droplets,
  Lightbulb,
  TreePine,
  Construction,
  AlertTriangle,
  Camera,
  MapPin,
  Check,
  Loader2,
  X,
  Factory
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ReportIssue() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const categories = [
    { 
      value: "dump_yard", 
      label: { en: "Dump Yard", te: "డంప్ యార్డ్" },
      icon: <Factory className="h-6 w-6" />,
      color: "bg-red-100 text-red-600 border-red-200"
    },
    { 
      value: "garbage", 
      label: { en: "Garbage", te: "చెత్త" },
      icon: <Trash2 className="h-6 w-6" />,
      color: "bg-orange-100 text-orange-600 border-orange-200"
    },
    { 
      value: "drainage", 
      label: { en: "Drainage", te: "డ్రైనేజీ" },
      icon: <Droplets className="h-6 w-6" />,
      color: "bg-blue-100 text-blue-600 border-blue-200"
    },
    { 
      value: "water", 
      label: { en: "Drinking Water", te: "తాగునీరు" },
      icon: <Droplets className="h-6 w-6" />,
      color: "bg-cyan-100 text-cyan-600 border-cyan-200"
    },
    { 
      value: "roads", 
      label: { en: "Roads", te: "రోడ్లు" },
      icon: <Construction className="h-6 w-6" />,
      color: "bg-gray-100 text-gray-600 border-gray-200"
    },
    { 
      value: "lights", 
      label: { en: "Street Lights", te: "వీధి దీపాలు" },
      icon: <Lightbulb className="h-6 w-6" />,
      color: "bg-yellow-100 text-yellow-600 border-yellow-200"
    },
    { 
      value: "parks", 
      label: { en: "Parks", te: "పార్కులు" },
      icon: <TreePine className="h-6 w-6" />,
      color: "bg-green-100 text-green-600 border-green-200"
    }
  ];

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(language === "te" ? "మీ బ్రౌజర్ లొకేషన్‌ను సపోర్ట్ చేయదు" : "Your browser doesn't support location");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setAddress(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        setLocationLoading(false);
        toast.success(language === "te" ? "లొకేషన్ సంగ్రహించబడింది" : "Location captured");
      },
      (error) => {
        setLocationLoading(false);
        toast.error(language === "te" ? "లొకేషన్ పొందడంలో విఫలం" : "Failed to get location");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaFiles.length > 5) {
      toast.error(language === "te" ? "గరిష్టంగా 5 ఫైల్‌లు అనుమతించబడతాయి" : "Maximum 5 files allowed");
      return;
    }

    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image"
    }));

    setMediaFiles([...mediaFiles, ...newFiles]);
  };

  const removeFile = (index) => {
    const newFiles = [...mediaFiles];
    URL.revokeObjectURL(newFiles[index].preview);
    newFiles.splice(index, 1);
    setMediaFiles(newFiles);
  };

  const handleSubmit = async () => {
    if (!category) {
      toast.error(language === "te" ? "వర్గం ఎంచుకోండి" : "Please select a category");
      return;
    }
    if (!description.trim()) {
      toast.error(language === "te" ? "సమస్యను వివరించండి" : "Please describe the issue");
      return;
    }

    setLoading(true);
    try {
      // For now, using mock URLs since Cloudinary isn't configured
      const mediaUrls = mediaFiles.map((f, i) => 
        `https://placeholder.dammaiguda.app/issues/${Date.now()}_${i}.jpg`
      );

      const response = await axios.post(`${API}/issues`, {
        category,
        description: description.trim(),
        location,
        address,
        media_urls: mediaUrls
      });

      toast.success(language === "te" ? "సమస్య విజయవంతంగా నివేదించబడింది!" : "Issue reported successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to report issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showBackButton title={language === "te" ? "సమస్య నివేదించు" : "Report Issue"}>
      <div className="space-y-6" data-testid="report-issue">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                step >= s ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold text-center text-text-primary">
              {language === "te" ? "సమస్య రకం ఎంచుకోండి" : "Select Issue Type"}
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <Card
                  key={cat.value}
                  className={`cursor-pointer transition-all ${
                    category === cat.value 
                      ? "ring-2 ring-primary border-primary" 
                      : "border-border/50 hover:border-primary/50"
                  }`}
                  onClick={() => setCategory(cat.value)}
                  data-testid={`category-${cat.value}`}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`h-14 w-14 mx-auto rounded-xl ${cat.color} flex items-center justify-center mb-2`}>
                      {cat.icon}
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {cat.label[language]}
                    </span>
                    {category === cat.value && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!category}
              className="w-full h-12 bg-primary text-white rounded-full mt-4"
              data-testid="next-step-btn"
            >
              {language === "te" ? "తదుపరి" : "Next"}
            </Button>
          </div>
        )}

        {/* Step 2: Details & Media */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold text-center text-text-primary">
              {language === "te" ? "వివరాలు జోడించండి" : "Add Details"}
            </h2>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                {language === "te" ? "సమస్యను వివరించండి" : "Describe the issue"} *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === "te" 
                  ? "సమస్య గురించి వివరంగా రాయండి..."
                  : "Describe the issue in detail..."}
                className="min-h-[120px] resize-none"
                data-testid="description-input"
              />
            </div>

            {/* Media Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                {language === "te" ? "ఫోటో/వీడియో జోడించండి" : "Add Photo/Video"}
              </label>
              
              <div className="flex flex-wrap gap-2">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted">
                    {file.type === "image" ? (
                      <img src={file.preview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <video src={file.preview} className="h-full w-full object-cover" />
                    )}
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                      data-testid={`remove-file-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {mediaFiles.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    data-testid="add-media-btn"
                  >
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-xs">
                      {language === "te" ? "జోడించు" : "Add"}
                    </span>
                  </button>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 h-12 rounded-full"
                data-testid="back-btn"
              >
                {language === "te" ? "వెనుకకు" : "Back"}
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!description.trim()}
                className="flex-1 h-12 bg-primary text-white rounded-full"
                data-testid="next-step-btn"
              >
                {language === "te" ? "తదుపరి" : "Next"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Location & Submit */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-semibold text-center text-text-primary">
              {language === "te" ? "స్థానం జోడించండి" : "Add Location"}
            </h2>

            {/* Location Button */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <Button
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="w-full h-12 border-2 border-dashed"
                  data-testid="get-location-btn"
                >
                  {locationLoading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : location ? (
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                  ) : (
                    <MapPin className="h-5 w-5 mr-2" />
                  )}
                  {location 
                    ? (language === "te" ? "లొకేషన్ సంగ్రహించబడింది" : "Location Captured")
                    : (language === "te" ? "ప్రస్తుత లొకేషన్ పొందండి" : "Get Current Location")}
                </Button>
                
                {location && (
                  <p className="text-xs text-text-muted text-center mt-2">
                    {address}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-border/50 bg-muted/50">
              <CardContent className="p-4">
                <h3 className="font-medium text-text-primary mb-2">
                  {language === "te" ? "సారాంశం" : "Summary"}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">
                      {language === "te" ? "వర్గం" : "Category"}
                    </span>
                    <span className="font-medium">
                      {categories.find(c => c.value === category)?.label[language]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">
                      {language === "te" ? "మీడియా" : "Media"}
                    </span>
                    <span className="font-medium">
                      {mediaFiles.length} {language === "te" ? "ఫైల్‌లు" : "files"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">
                      {language === "te" ? "లొకేషన్" : "Location"}
                    </span>
                    <span className="font-medium">
                      {location ? "✓" : "—"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 h-12 rounded-full"
                data-testid="back-btn"
              >
                {language === "te" ? "వెనుకకు" : "Back"}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-12 bg-secondary text-white rounded-full"
                data-testid="submit-btn"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    {language === "te" ? "నివేదించు" : "Report"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
