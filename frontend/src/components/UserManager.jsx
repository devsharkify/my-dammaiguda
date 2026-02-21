import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import {
  Users,
  Search,
  Shield,
  UserCog,
  User,
  Loader2,
  Edit,
  Phone,
  Calendar,
  MapPin
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ROLE_OPTIONS = [
  { value: "citizen", label: "Citizen", color: "bg-gray-500" },
  { value: "manager", label: "Manager", color: "bg-blue-500" },
  { value: "admin", label: "Admin", color: "bg-red-500" }
];

export default function UserManager({ token }) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchPhone, setSearchPhone] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({ total: 0, admins: 0, managers: 0, citizens: 0 });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchStats();
    fetchRecentUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/admin/users/stats`, { headers });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchRecentUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/users?limit=20`, { headers });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchPhone.trim()) {
      toast.error("Enter a phone number to search");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/users/search?phone=${searchPhone}`, { headers });
      setSearchResults(res.data.users || []);
      if (res.data.users?.length === 0) {
        toast.info("No users found with that phone number");
      }
    } catch (err) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowEditDialog(true);
  };

  const updateUserRole = async () => {
    if (!selectedUser || !newRole) return;
    
    setUpdating(true);
    try {
      await axios.put(`${API}/admin/users/${selectedUser.id}/role`, {
        role: newRole
      }, { headers });
      
      toast.success(`Role updated to ${newRole}!`);
      setShowEditDialog(false);
      setSelectedUser(null);
      
      // Refresh data
      fetchStats();
      fetchRecentUsers();
      if (searchPhone) searchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update role");
    } finally {
      setUpdating(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[0];
    return (
      <Badge className={`${roleConfig.color} text-white`}>
        {role === "admin" && <Shield className="w-3 h-3 mr-1" />}
        {role === "manager" && <UserCog className="w-3 h-3 mr-1" />}
        {role === "citizen" && <User className="w-3 h-3 mr-1" />}
        {roleConfig.label}
      </Badge>
    );
  };

  const UserCard = ({ user }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{user.name || "No Name"}</p>
            {getRoleBadge(user.role)}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {user.phone}
            </span>
            {user.colony && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {user.colony}
              </span>
            )}
            {user.created_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
        <Edit className="w-4 h-4 mr-1" />
        Edit Role
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <UserCog className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Managers</p>
                <p className="text-2xl font-bold">{stats.managers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Citizens</p>
                <p className="text-2xl font-bold">{stats.citizens}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search User by Phone</CardTitle>
          <CardDescription>Find and manage user roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter phone number (e.g., 9100063133)"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value.replace(/\D/g, ''))}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              />
            </div>
            <Button onClick={searchUsers} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
              Search
            </Button>
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Search Results:</p>
              {searchResults.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Latest registered users</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedUser.name || "No Name"}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
                <div className="mt-2">
                  Current Role: {getRoleBadge(selectedUser.role)}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">New Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          {role.value === "admin" && <Shield className="w-4 h-4 text-red-500" />}
                          {role.value === "manager" && <UserCog className="w-4 h-4 text-blue-500" />}
                          {role.value === "citizen" && <User className="w-4 h-4 text-gray-500" />}
                          {role.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={updateUserRole} disabled={updating || newRole === selectedUser?.role}>
              {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
