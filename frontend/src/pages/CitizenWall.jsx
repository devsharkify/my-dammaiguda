import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { toast } from "sonner";
import {
  PenSquare,
  Heart,
  MessageCircle,
  Share2,
  Globe,
  Building2,
  Users,
  Plus,
  Send,
  Loader2,
  Image as ImageIcon,
  Video,
  Trash2,
  UserPlus,
  Clock,
  Check,
  X,
  ChevronRight,
  ArrowLeft,
  MessageSquare
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// IndexedDB for client-side chat storage
const DB_NAME = "CitizenWallChat";
const DB_VERSION = 1;
const STORE_NAME = "messages";
const MAX_MESSAGES_PER_GROUP = 500;

const openChatDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("groupId", "groupId", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
};

const saveMessage = async (message) => {
  const db = await openChatDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.put(message);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getGroupMessages = async (groupId) => {
  const db = await openChatDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("groupId");
  const request = index.getAll(groupId);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const messages = request.result || [];
      // Sort by timestamp and limit to MAX_MESSAGES_PER_GROUP
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      resolve(messages.slice(-MAX_MESSAGES_PER_GROUP));
    };
    request.onerror = () => reject(request.error);
  });
};

const clearOldMessages = async (groupId) => {
  const db = await openChatDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("groupId");
  const request = index.getAll(groupId);
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const messages = request.result || [];
      if (messages.length > MAX_MESSAGES_PER_GROUP) {
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const toDelete = messages.slice(0, messages.length - MAX_MESSAGES_PER_GROUP);
        toDelete.forEach(msg => store.delete(msg.id));
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};

export default function CitizenWall() {
  const { language } = useLanguage();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("feed");
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupInvites, setGroupInvites] = useState([]);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newPost, setNewPost] = useState({ content: "", visibility: "public", image_url: "", video_url: "" });
  const [newGroup, setNewGroup] = useState({ name: "", description: "", is_private: false });
  const [posting, setPosting] = useState(false);
  const [visibility, setVisibility] = useState("all");
  
  // Media upload state
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef(null);
  
  // Comments state
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Group chat state
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchPosts = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/wall/posts?visibility=${visibility}`, { headers });
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [token, visibility]);

  const fetchGroups = useCallback(async () => {
    try {
      const [myGroups, invites, discover] = await Promise.all([
        axios.get(`${API}/wall/groups`, { headers }),
        axios.get(`${API}/wall/group-invites`, { headers }),
        axios.get(`${API}/wall/groups/discover`, { headers })
      ]);
      setGroups(myGroups.data || []);
      setGroupInvites(invites.data || []);
      setDiscoverGroups(discover.data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "feed") {
      fetchPosts();
    } else if (activeTab === "groups" && !selectedGroup) {
      fetchGroups();
    }
  }, [activeTab, fetchPosts, fetchGroups, selectedGroup]);

  // Load chat messages when group is selected
  useEffect(() => {
    if (selectedGroup) {
      loadChatMessages(selectedGroup.id);
    }
  }, [selectedGroup]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const loadChatMessages = async (groupId) => {
    try {
      const messages = await getGroupMessages(groupId);
      setChatMessages(messages);
    } catch (error) {
      console.error("Error loading chat messages:", error);
    }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error(language === "te" ? "చెల్లని ఫైల్ రకం" : "Invalid file type");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error(language === "te" ? "ఫైల్ చాలా పెద్దది (గరిష్ట 10MB)" : "File too large (max 10MB)");
      return;
    }

    setMediaType(isImage ? "image" : "video");
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
      // For demo, use the data URL directly. In production, upload to Cloudinary
      if (isImage) {
        setNewPost(prev => ({ ...prev, image_url: reader.result }));
      } else {
        setNewPost(prev => ({ ...prev, video_url: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
    setNewPost(prev => ({ ...prev, image_url: "", video_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createPost = async () => {
    if (!newPost.content.trim() && !newPost.image_url && !newPost.video_url) {
      toast.error(language === "te" ? "కంటెంట్ లేదా మీడియా అవసరం" : "Content or media is required");
      return;
    }

    setPosting(true);
    try {
      await axios.post(`${API}/wall/post`, newPost, { headers });
      toast.success(language === "te" ? "పోస్ట్ విజయవంతం!" : "Posted successfully!");
      setShowCreatePost(false);
      setNewPost({ content: "", visibility: "public", image_url: "", video_url: "" });
      clearMedia();
      fetchPosts();
    } catch (error) {
      toast.error("Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  const fetchComments = async (postId) => {
    setLoadingComments(true);
    try {
      const response = await axios.get(`${API}/wall/post/${postId}`, { headers });
      setComments(response.data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const openComments = (post) => {
    setSelectedPost(post);
    fetchComments(post.id);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await axios.post(`${API}/wall/post/${selectedPost.id}/comment`, 
        { content: newComment }, 
        { headers }
      );
      setNewComment("");
      fetchComments(selectedPost.id);
      // Update comment count in posts list
      setPosts(posts.map(p => 
        p.id === selectedPost.id 
          ? { ...p, comments_count: (p.comments_count || 0) + 1 }
          : p
      ));
      toast.success(language === "te" ? "వ్యాఖ్య జోడించబడింది!" : "Comment added!");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId: selectedGroup.id,
      content: newMessage.trim(),
      sender: {
        id: user.id,
        name: user.name || "Anonymous"
      },
      timestamp: new Date().toISOString()
    };

    try {
      await saveMessage(message);
      await clearOldMessages(selectedGroup.id);
      setChatMessages(prev => [...prev, message]);
      setNewMessage("");
    } catch (error) {
      console.error("Error saving message:", error);
      toast.error(language === "te" ? "సందేశం పంపడంలో విఫలమైంది" : "Failed to send message");
    }
  };

  const joinGroup = async (groupId) => {
    try {
      await axios.post(`${API}/wall/group/${groupId}/join`, {}, { headers });
      toast.success(language === "te" ? "గ్రూప్‌లో చేరారు!" : "Joined group!");
      fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to join group");
    }
  };

  const leaveGroup = async (groupId) => {
    try {
      await axios.post(`${API}/wall/group/${groupId}/leave`, {}, { headers });
      toast.success(language === "te" ? "గ్రూప్ విడిచిపెట్టారు" : "Left group");
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to leave group");
    }
  };

  const likePost = async (postId) => {
    try {
      const response = await axios.post(`${API}/wall/post/${postId}/like`, {}, { headers });
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, liked_by_me: response.data.action === "liked", likes_count: response.data.likes_count }
          : p
      ));
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const createGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error(language === "te" ? "గ్రూప్ పేరు అవసరం" : "Group name is required");
      return;
    }

    try {
      await axios.post(`${API}/wall/group`, newGroup, { headers });
      toast.success(language === "te" ? "గ్రూప్ సృష్టించబడింది!" : "Group created!");
      setShowCreateGroup(false);
      setNewGroup({ name: "", description: "", is_private: false });
      fetchGroups();
    } catch (error) {
      toast.error("Failed to create group");
    }
  };

  const respondToInvite = async (inviteId, action) => {
    try {
      await axios.post(`${API}/wall/group-invite/${inviteId}/respond?action=${action}`, {}, { headers });
      toast.success(action === "accept" ? "Joined group!" : "Invite declined");
      fetchGroups();
    } catch (error) {
      toast.error("Failed to respond to invite");
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return language === "te" ? "ఇప్పుడే" : "Just now";
    if (diffMins < 60) return `${diffMins}${language === "te" ? "ని" : "m"}`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}${language === "te" ? "గం" : "h"}`;
    return date.toLocaleDateString();
  };

  return (
    <Layout title={language === "te" ? "సిటిజన్ వాల్" : "Citizen Wall"} showBackButton>
      <div className="space-y-4" data-testid="citizen-wall">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-xl font-bold">
                {language === "te" ? "సిటిజన్ వాల్" : "Citizen Wall"}
              </h1>
              <p className="text-white/80 text-sm">
                {language === "te" ? "మీ కమ్యూనిటీతో కనెక్ట్ అవ్వండి" : "Connect with your community"}
              </p>
            </div>
            <Button
              onClick={() => setShowCreatePost(true)}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <PenSquare className="h-4 w-4 mr-2" />
              {language === "te" ? "పోస్ట్" : "Post"}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="feed" className="text-sm">
              <Globe className="h-4 w-4 mr-2" />
              {language === "te" ? "ఫీడ్" : "Feed"}
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-sm">
              <Users className="h-4 w-4 mr-2" />
              {language === "te" ? "గ్రూప్‌లు" : "Groups"}
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="space-y-4 mt-4">
            {/* Visibility Filter */}
            <div className="flex gap-2">
              {[
                { value: "all", label: language === "te" ? "అన్ని" : "All", icon: <Globe className="h-4 w-4" /> },
                { value: "public", label: language === "te" ? "పబ్లిక్" : "Public", icon: <Globe className="h-4 w-4" /> },
                { value: "colony", label: language === "te" ? "కాలనీ" : "Colony", icon: <Building2 className="h-4 w-4" /> }
              ].map((v) => (
                <Button
                  key={v.value}
                  variant={visibility === v.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVisibility(v.value)}
                >
                  {v.icon}
                  <span className="ml-1">{v.label}</span>
                </Button>
              ))}
            </div>

            {/* Posts */}
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <PenSquare className="h-16 w-16 mx-auto text-text-muted opacity-30 mb-4" />
                <p className="text-text-muted">
                  {language === "te" ? "ఇంకా పోస్ట్‌లు లేవు. మొదటి పోస్ట్ చేయండి!" : "No posts yet. Be the first to post!"}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="overflow-hidden" data-testid={`post-${post.id}`}>
                  <CardContent className="p-4">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {post.user_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{post.user_name}</p>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(post.created_at)}</span>
                            {post.visibility === "colony" && (
                              <Badge variant="secondary" className="text-xs">
                                <Building2 className="h-3 w-3 mr-1" />
                                {post.user_colony}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-text-primary mb-3 whitespace-pre-wrap">{post.content}</p>

                    {post.image_url && (
                      <img src={post.image_url} alt="Post" className="rounded-lg mb-3 w-full" />
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-4 pt-3 border-t border-border/30">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => likePost(post.id)}
                        className={post.liked_by_me ? "text-red-500" : "text-text-muted"}
                      >
                        <Heart className={`h-5 w-5 mr-1 ${post.liked_by_me ? "fill-red-500" : ""}`} />
                        {post.likes_count || 0}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-text-muted">
                        <MessageCircle className="h-5 w-5 mr-1" />
                        {post.comments_count || 0}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-text-muted">
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4 mt-4">
            <Button
              onClick={() => setShowCreateGroup(true)}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              {language === "te" ? "కొత్త గ్రూప్ సృష్టించండి" : "Create New Group"}
            </Button>

            {/* Group Invites */}
            {groupInvites.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-text-muted">
                  {language === "te" ? "గ్రూప్ ఆహ్వానాలు" : "Group Invites"}
                </h3>
                {groupInvites.map((invite) => (
                  <Card key={invite.id} className="border-orange-200 bg-orange-50">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{invite.group_name}</p>
                        <p className="text-xs text-text-muted">
                          {language === "te" ? "ఆహ్వానించినవారు:" : "Invited by:"} {invite.invited_by_name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => respondToInvite(invite.id, "accept")} className="bg-green-500">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => respondToInvite(invite.id, "decline")}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* My Groups */}
            <h3 className="font-semibold text-sm text-text-muted">
              {language === "te" ? "నా గ్రూప్‌లు" : "My Groups"}
            </h3>
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-text-muted opacity-30 mb-3" />
                <p className="text-text-muted text-sm">
                  {language === "te" ? "ఇంకా గ్రూప్‌లు లేవు" : "No groups yet"}
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <Card key={group.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      {group.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{group.name}</p>
                        {group.is_private && (
                          <Badge variant="secondary" className="text-xs">
                            {language === "te" ? "ప్రైవేట్" : "Private"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-muted">
                        {group.members_count} {language === "te" ? "సభ్యులు" : "members"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Create Post Dialog */}
        <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PenSquare className="h-5 w-5 text-primary" />
                {language === "te" ? "కొత్త పోస్ట్" : "New Post"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <textarea
                placeholder={language === "te" ? "మీరు ఏమి ఆలోచిస్తున్నారు?" : "What's on your mind?"}
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                className="w-full min-h-[120px] p-3 rounded-lg border border-input resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              
              <div className="flex gap-2">
                <Button
                  variant={newPost.visibility === "public" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewPost({ ...newPost, visibility: "public" })}
                >
                  <Globe className="h-4 w-4 mr-1" />
                  {language === "te" ? "పబ్లిక్" : "Public"}
                </Button>
                <Button
                  variant={newPost.visibility === "colony" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewPost({ ...newPost, visibility: "colony" })}
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  {language === "te" ? "కాలనీ మాత్రమే" : "Colony Only"}
                </Button>
              </div>

              <Button
                onClick={createPost}
                disabled={posting}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {language === "te" ? "పోస్ట్ చేయండి" : "Post"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Group Dialog */}
        <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {language === "te" ? "కొత్త గ్రూప్" : "New Group"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder={language === "te" ? "గ్రూప్ పేరు" : "Group Name"}
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
              />
              <textarea
                placeholder={language === "te" ? "వివరణ (ఐచ్ఛికం)" : "Description (optional)"}
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                className="w-full min-h-[80px] p-3 rounded-lg border border-input resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newGroup.is_private}
                  onChange={(e) => setNewGroup({ ...newGroup, is_private: e.target.checked })}
                  className="rounded border-input"
                />
                <span className="text-sm">
                  {language === "te" ? "ప్రైవేట్ గ్రూప్ (ఆహ్వానం మాత్రమే)" : "Private group (invite only)"}
                </span>
              </label>

              <Button
                onClick={createGroup}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === "te" ? "గ్రూప్ సృష్టించండి" : "Create Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
