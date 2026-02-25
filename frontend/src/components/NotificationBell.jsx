/**
 * NotificationBell - Redesigned notification dropdown component
 * Modern, elegant design with right-side positioning
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { 
  Bell, Check, CheckCheck, AlertTriangle, Megaphone, 
  Calendar, Heart, X, Loader2, ChevronRight, Clock,
  AlertCircle, Info, Sparkles
} from "lucide-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NotificationBell() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem("dammaiguda_token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/notifications/unread-count`, { headers });
      setUnreadCount(res.data.count || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/notifications/user?limit=20`, { headers });
      setNotifications(res.data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`${API}/notifications/mark-read/${notificationId}`, {}, { headers });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axios.post(`${API}/notifications/mark-all-read`, {}, { headers });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get notification config based on type
  const getNotificationConfig = (type, priority) => {
    const configs = {
      sos: {
        icon: AlertCircle,
        bgColor: "bg-red-500",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        borderColor: "border-l-red-500",
        label: "SOS"
      },
      alert: {
        icon: AlertTriangle,
        bgColor: "bg-orange-500",
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        borderColor: "border-l-orange-500",
        label: "Alert"
      },
      announcement: {
        icon: Megaphone,
        bgColor: "bg-blue-500",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        borderColor: "border-l-blue-500",
        label: "Announcement"
      },
      reminder: {
        icon: Clock,
        bgColor: "bg-purple-500",
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
        borderColor: "border-l-purple-500",
        label: "Reminder"
      },
      event: {
        icon: Calendar,
        bgColor: "bg-teal-500",
        iconBg: "bg-teal-100",
        iconColor: "text-teal-600",
        borderColor: "border-l-teal-500",
        label: "Event"
      },
      health: {
        icon: Heart,
        bgColor: "bg-pink-500",
        iconBg: "bg-pink-100",
        iconColor: "text-pink-600",
        borderColor: "border-l-pink-500",
        label: "Health"
      },
      system: {
        icon: Info,
        bgColor: "bg-gray-500",
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        borderColor: "border-l-gray-400",
        label: "System"
      }
    };

    let config = configs[type] || configs.system;
    
    // Override for urgent priority
    if (priority === "urgent") {
      config = { ...config, borderColor: "border-l-red-500" };
    }
    
    return config;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      setIsOpen(false);
    }
  };

  if (!token) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/20 active:scale-95 transition-all"
        data-testid="notification-bell"
      >
        <Bell className={`h-5 w-5 text-white transition-transform ${isOpen ? 'scale-110' : ''}`} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Slide-out Panel from Right */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Notification Panel - Slides from Right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[360px] bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {language === "te" ? "నోటిఫికేషన్లు" : "Notifications"}
                      </h3>
                      {unreadCount > 0 && (
                        <p className="text-xs text-white/70">
                          {unreadCount} {language === "te" ? "చదవని" : "unread"}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                    data-testid="close-notifications"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
                
                {/* Mark All Read Button */}
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="mt-3 w-full text-sm text-white/90 hover:text-white flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <CheckCheck className="h-4 w-4" />
                    {language === "te" ? "అన్నీ చదివినట్లు గుర్తించు" : "Mark all as read"}
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-16 px-6 text-center">
                    <div className="h-20 w-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <Sparkles className="h-10 w-10 text-gray-300" />
                    </div>
                    <p className="text-gray-700 font-semibold text-lg mb-2">
                      {language === "te" ? "అన్నీ చదివారు!" : "All caught up!"}
                    </p>
                    <p className="text-sm text-gray-400 max-w-[200px] mx-auto">
                      {language === "te" ? "కొత్త నోటిఫికేషన్లు ఇక్కడ కనిపిస్తాయి" : "New notifications will appear here"}
                    </p>
                  </div>
                ) : (
                  <div className="py-2">
                    {notifications.map((notification, index) => {
                      const config = getNotificationConfig(notification.type, notification.priority);
                      const IconComponent = config.icon;
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleNotificationClick(notification)}
                          className={`mx-3 mb-2 p-4 cursor-pointer rounded-xl transition-all border-l-4 ${config.borderColor} ${
                            !notification.read 
                              ? "bg-gray-50 hover:bg-gray-100" 
                              : "bg-white hover:bg-gray-50 border border-gray-100"
                          }`}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className={`flex-shrink-0 h-11 w-11 rounded-xl ${config.iconBg} flex items-center justify-center`}>
                              <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm leading-snug ${!notification.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                                  {language === "te" && notification.title_te ? notification.title_te : notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="h-2.5 w-2.5 bg-teal-500 rounded-full flex-shrink-0 mt-1 animate-pulse"></span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {language === "te" && notification.message_te ? notification.message_te : notification.message}
                              </p>
                              
                              {/* Footer */}
                              <div className="flex items-center gap-3 mt-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.iconBg} ${config.iconColor} font-semibold uppercase tracking-wide`}>
                                  {config.label}
                                </span>
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {notification.time_ago}
                                </span>
                              </div>
                            </div>
                            
                            {notification.action_url && (
                              <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0 self-center" />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 flex-shrink-0">
                  <Button
                    variant="outline"
                    className="w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100 font-medium"
                    onClick={() => {
                      navigate("/notifications");
                      setIsOpen(false);
                    }}
                  >
                    {language === "te" ? "అన్ని నోటిఫికేషన్లు చూడండి" : "View all notifications"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
