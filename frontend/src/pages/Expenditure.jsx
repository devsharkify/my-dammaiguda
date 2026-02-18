import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import Layout from "../components/Layout";
import {
  BarChart3,
  TrendingUp,
  FileText,
  ExternalLink,
  IndianRupee,
  Calendar,
  TreePine,
  Trash2,
  Construction,
  Dumbbell,
  Info
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Expenditure() {
  const { language } = useLanguage();
  const [expenditures, setExpenditures] = useState([]);
  const [summary, setSummary] = useState({});
  const [selectedYear, setSelectedYear] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, summaryRes] = await Promise.all([
        axios.get(`${API}/expenditure`),
        axios.get(`${API}/expenditure/summary`)
      ]);
      setExpenditures(expRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Error fetching expenditure data:", error);
    } finally {
      setLoading(false);
    }
  };

  const years = ["all", "2025", "2024", "2023", "2022", "2021"];

  const categoryInfo = {
    parks: { 
      icon: <TreePine className="h-5 w-5" />, 
      label: { en: "Parks", te: "పార్కులు" },
      color: "bg-green-100 text-green-600"
    },
    sports: { 
      icon: <Dumbbell className="h-5 w-5" />, 
      label: { en: "Sports Complex", te: "స్పోర్ట్స్ కాంప్లెక్స్" },
      color: "bg-blue-100 text-blue-600"
    },
    sanitation: { 
      icon: <Trash2 className="h-5 w-5" />, 
      label: { en: "Sanitation", te: "పారిశుధ్యం" },
      color: "bg-yellow-100 text-yellow-600"
    },
    roads: { 
      icon: <Construction className="h-5 w-5" />, 
      label: { en: "Roads", te: "రోడ్లు" },
      color: "bg-gray-100 text-gray-600"
    },
    dump_yard: { 
      icon: <Trash2 className="h-5 w-5" />, 
      label: { en: "Dump Yard", te: "డంప్ యార్డ్" },
      color: "bg-red-100 text-red-600"
    }
  };

  const formatAmount = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const filteredExpenditures = selectedYear === "all" 
    ? expenditures 
    : expenditures.filter(e => e.year === parseInt(selectedYear));

  // Calculate totals
  const totalByCategory = {};
  filteredExpenditures.forEach(exp => {
    if (!totalByCategory[exp.category]) {
      totalByCategory[exp.category] = 0;
    }
    totalByCategory[exp.category] += exp.amount;
  });

  const grandTotal = Object.values(totalByCategory).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "ఖర్చుల పారదర్శకత" : "Expenditure"}>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "ఖర్చుల పారదర్శకత" : "Expenditure"}>
      <div className="space-y-6" data-testid="expenditure">
        {/* Year Filter */}
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="flex-1 h-12" data-testid="year-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year === "all" 
                    ? (language === "te" ? "అన్ని సంవత్సరాలు" : "All Years")
                    : year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-primary to-teal-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">
                  {language === "te" ? "మొత్తం ఖర్చు" : "Total Expenditure"}
                </p>
                <p className="text-3xl font-bold">{formatAmount(grandTotal)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(totalByCategory).slice(0, 4).map(([cat, amount]) => (
                <div key={cat} className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/70 text-xs">
                    {categoryInfo[cat]?.label[language] || cat}
                  </p>
                  <p className="font-bold mt-1">{formatAmount(amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="details" className="text-sm">
              {language === "te" ? "వివరాలు" : "Details"}
            </TabsTrigger>
            <TabsTrigger value="comparison" className="text-sm">
              {language === "te" ? "పోలిక" : "Comparison"}
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-4 space-y-3">
            {filteredExpenditures.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-text-muted">
                  {language === "te" ? "ఖర్చు డేటా లేదు" : "No expenditure data"}
                </p>
              </div>
            ) : (
              filteredExpenditures.map((exp) => (
                <Card key={exp.id} className="border-border/50" data-testid={`expenditure-${exp.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg ${categoryInfo[exp.category]?.color || "bg-gray-100"} flex items-center justify-center`}>
                          {categoryInfo[exp.category]?.icon || <BarChart3 className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary">
                            {categoryInfo[exp.category]?.label[language] || exp.category}
                          </h3>
                          <p className="text-xs text-text-muted">{exp.year}</p>
                        </div>
                      </div>
                      <Badge className="bg-primary/10 text-primary font-bold">
                        {formatAmount(exp.amount)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-text-secondary">
                      {language === "te" ? exp.description_te : exp.description}
                    </p>
                    
                    {exp.ground_reality_notes && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-xs font-medium text-orange-800 mb-1">
                          {language === "te" ? "వాస్తవ పరిస్థితి:" : "Ground Reality:"}
                        </p>
                        <p className="text-sm text-orange-700">{exp.ground_reality_notes}</p>
                      </div>
                    )}
                    
                    {exp.rti_document_url && (
                      <a
                        href={exp.rti_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        {language === "te" ? "RTI పత్రం చూడండి" : "View RTI Document"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="mt-4 space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {language === "te" ? "వర్గం వారీగా ఖర్చు" : "Expenditure by Category"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(totalByCategory).map(([cat, amount]) => {
                    const percentage = grandTotal > 0 ? (amount / grandTotal * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded ${categoryInfo[cat]?.color || "bg-gray-100"} flex items-center justify-center`}>
                              {categoryInfo[cat]?.icon}
                            </div>
                            <span className="text-sm font-medium">
                              {categoryInfo[cat]?.label[language] || cat}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-primary">
                            {formatAmount(amount)}
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-text-muted text-right mt-1">
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Year-wise comparison */}
            {Object.keys(summary).length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {language === "te" ? "సంవత్సరం వారీగా" : "Year-wise"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(summary).sort((a, b) => b[0] - a[0]).map(([year, categories]) => {
                      const yearTotal = Object.values(categories).reduce((a, b) => a + b, 0);
                      return (
                        <div key={year} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="font-semibold text-text-primary">{year}</span>
                          <span className="font-bold text-primary">{formatAmount(yearTotal)}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              {language === "te"
                ? "ఈ డేటా RTI ద్వారా సేకరించబడింది. అధికారిక పత్రాలు అందుబాటులో ఉంటాయి."
                : "This data is collected through RTI. Official documents are available for reference."}
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
