import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("dammaiguda_token"));
  const [loading, setLoading] = useState(true);

  // Set axios default header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Fetch user on mount if token exists
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API}/auth/me`);
        setUser(response.data);
      } catch (error) {
        console.error("Auth error:", error);
        // Token invalid, clear it
        localStorage.removeItem("dammaiguda_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const sendOTP = async (phone) => {
    const response = await axios.post(`${API}/auth/send-otp`, { phone });
    return response.data;
  };

  const verifyOTP = async (phone, otp, userData = {}) => {
    const response = await axios.post(`${API}/auth/verify-otp`, {
      phone,
      otp,
      ...userData
    });
    
    if (response.data.success) {
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem("dammaiguda_token", newToken);
      setToken(newToken);
      setUser(newUser);
    }
    
    return response.data;
  };

  const updateProfile = async (updates) => {
    const params = new URLSearchParams();
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await axios.put(`${API}/auth/profile?${params.toString()}`);
    setUser(response.data);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("dammaiguda_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      sendOTP,
      verifyOTP,
      updateProfile,
      logout,
      isAuthenticated: !!user,
      isVolunteer: user?.role === "volunteer" || user?.role === "admin",
      isAdmin: user?.role === "admin"
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
