import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import {
  Download,
  FileSpreadsheet,
  FileJson,
  Users,
  AlertTriangle,
  BarChart3,
  Heart,
  Calendar,
  Loader2,
  CheckCircle
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const REPORT_ICONS = {
  users: Users,
  grievances: AlertTriangle,
  analytics: BarChart3,
  health: Heart
};

export default function ReportsPanel({ userRole = "admin" }) {
  const { token } = useAuth();
  const [downloading, setDownloading] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState("csv");
  const [status, setStatus] = useState("all");
  
  const headers = { Authorization: `Bearer ${token}` };

  const adminReports = [
    {
      id: "users",
      name: "Users Report",
      description: "All registered users with contact details, colony, and registration date",
      endpoint: "/api/reports/admin/users",
      filters: ["date"]
    },
    {
      id: "grievances",
      name: "Grievances Report",
      description: "All grievances/issues with status, category, reporter, and resolution details",
      endpoint: "/api/reports/admin/grievances",
      filters: ["date", "status"]
    },
    {
      id: "analytics",
      name: "Analytics Report",
      description: "Daily engagement metrics - page views, actions, feature usage, unique users",
      endpoint: "/api/reports/admin/analytics",
      filters: ["date"]
    },
    {
      id: "health",
      name: "Health Summary",
      description: "Aggregated fitness data - total steps, calories burned, active users per day",
      endpoint: "/api/reports/admin/health-summary",
      filters: ["date"]
    }
  ];

  const managerReports = [
    {
      id: "grievances",
      name: "Grievances Report",
      description: "Grievances in your assigned area with status and details",
      endpoint: "/api/reports/manager/grievances",
      filters: ["date", "status"]
    },
    {
      id: "users",
      name: "Users Report",
      description: "Users registered in your assigned area",
      endpoint: "/api/reports/manager/users",
      filters: ["date"]
    }
  ];

  const reports = userRole === "admin" ? adminReports : managerReports;

  const downloadReport = async (report) => {
    setDownloading(report.id);
    
    try {
      let url = `${report.endpoint}?format=${format}`;
      
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;
      if (status !== "all" && report.filters.includes("status")) {
        url += `&status=${status}`;
      }
      
      if (format === "json") {
        // For JSON, just fetch and display
        const res = await axios.get(url, { headers });
        
        // Create downloadable JSON file
        const dataStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${report.id}_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        
        toast.success(`${report.name} downloaded (JSON)`);
      } else {
        // For CSV, handle as blob
        const res = await axios.get(url, {
          headers,
          responseType: 'blob'
        });
        
        const blob = new Blob([res.data], { type: "text/csv" });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${report.id}_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        
        toast.success(`${report.name} downloaded (CSV)`);
      }
    } catch (err) {
      console.error("Download error:", err);
      toast.error(`Failed to download ${report.name}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6" data-testid="reports-panel">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Download className="h-6 w-6 text-primary" />
          Download Reports
        </h2>
        <p className="text-sm text-muted-foreground">
          Export data in CSV or JSON format for analysis
        </p>
      </div>

      {/* Global Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Report Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV (Excel)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      JSON
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status Filter</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => {
          const Icon = REPORT_ICONS[report.id] || FileSpreadsheet;
          const isDownloading = downloading === report.id;
          
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{report.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => downloadReport(report)}
                        disabled={isDownloading}
                        data-testid={`download-${report.id}`}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Download
                      </Button>
                      <div className="flex gap-1">
                        {report.filters.includes("date") && (
                          <Badge variant="outline" className="text-[10px]">
                            <Calendar className="h-3 w-3 mr-1" />
                            Date Range
                          </Badge>
                        )}
                        {report.filters.includes("status") && (
                          <Badge variant="outline" className="text-[10px]">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Status
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Report Tips</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• CSV files can be opened in Excel, Google Sheets, or any spreadsheet app</li>
                <li>• JSON format is useful for data analysis or importing into other systems</li>
                <li>• Use date filters to limit the report to a specific time period</li>
                <li>• Default period is last 30-90 days if no dates are selected</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
