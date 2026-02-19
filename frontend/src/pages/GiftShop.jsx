import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Layout from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import {
  Gift,
  Wallet,
  ShoppingBag,
  MapPin,
  Package,
  ChevronRight,
  Search,
  Filter,
  Star,
  Coins,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  History,
  Loader2
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function GiftShop() {
  const { language } = useLanguage();
  const { token } = useAuth();
  
  const [activeTab, setActiveTab] = useState("shop");
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Claim dialog
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    landmark: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: ""
  });
  
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [walletRes, productsRes, ordersRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/shop/wallet`, { headers }),
        axios.get(`${API}/shop/products`, { headers }),
        axios.get(`${API}/shop/orders`, { headers }),
        axios.get(`${API}/shop/categories`, { headers })
      ]);
      
      setWallet(walletRes.data);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
      setCategories(categoriesRes.data.categories || []);
    } catch (error) {
      console.error("Error fetching shop data:", error);
      toast.error(language === "te" ? "డేటా లోడ్ చేయడం విఫలమైంది" : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (category = null, search = "") => {
    try {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (search) params.append("search", search);
      
      const res = await axios.get(`${API}/shop/products?${params}`, { headers });
      setProducts(res.data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    fetchProducts(cat, searchQuery);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchProducts(selectedCategory, query);
  };

  const openClaimDialog = (product) => {
    if (!product.can_afford) {
      toast.error(language === "te" ? "తగినంత పాయింట్లు లేవు" : "Not enough points");
      return;
    }
    setSelectedProduct(product);
    setShowClaimDialog(true);
  };

  const handleClaim = async () => {
    // Validate address
    if (!deliveryAddress.full_name || !deliveryAddress.phone || !deliveryAddress.address_line1 || !deliveryAddress.pincode) {
      toast.error(language === "te" ? "అన్ని అవసరమైన ఫీల్డ్‌లను పూరించండి" : "Please fill all required fields");
      return;
    }
    
    if (deliveryAddress.phone.length !== 10) {
      toast.error(language === "te" ? "చెల్లుబాటు అయ్యే ఫోన్ నంబర్ నమోదు చేయండి" : "Enter valid phone number");
      return;
    }
    
    setClaimLoading(true);
    try {
      await axios.post(`${API}/shop/claim`, {
        product_id: selectedProduct.id,
        delivery_address: deliveryAddress
      }, { headers });
      
      toast.success(language === "te" ? "గిఫ్ట్ క్లెయిమ్ అయింది!" : "Gift claimed successfully!");
      setShowClaimDialog(false);
      setSelectedProduct(null);
      setDeliveryAddress({
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        landmark: "",
        city: "Hyderabad",
        state: "Telangana",
        pincode: ""
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to claim gift");
    } finally {
      setClaimLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", icon: Clock, label: language === "te" ? "పెండింగ్" : "Pending" },
      approved: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: CheckCircle, label: language === "te" ? "ఆమోదించబడింది" : "Approved" },
      shipped: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", icon: Truck, label: language === "te" ? "షిప్ అయింది" : "Shipped" },
      delivered: { color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle, label: language === "te" ? "డెలివరీ అయింది" : "Delivered" },
      rejected: { color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: XCircle, label: language === "te" ? "తిరస్కరించబడింది" : "Rejected" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Layout showBackButton title={language === "te" ? "గిఫ్ట్ షాప్" : "Gift Shop"}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">{language === "te" ? "లోడ్ అవుతోంది..." : "Loading..."}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton title={language === "te" ? "గిఫ్ట్ షాప్" : "Gift Shop"}>
      <div className="space-y-4 pb-6" data-testid="gift-shop-page">
        
        {/* Wallet Card */}
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500">
          <CardContent className="p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium flex items-center gap-1">
                  <Wallet className="h-4 w-4" />
                  {language === "te" ? "మీ పాయింట్లు" : "Your Points"}
                </p>
                <div className="flex items-baseline gap-3 mt-1">
                  <div>
                    <p className="text-3xl font-bold">{wallet?.balance?.toLocaleString() || 0}</p>
                    <p className="text-amber-100 text-[10px]">{language === "te" ? "సాధారణ" : "Normal"}</p>
                  </div>
                  <div className="text-amber-200">|</div>
                  <div>
                    <p className="text-2xl font-bold text-amber-100">{wallet?.privilege_balance?.toLocaleString() || 0}</p>
                    <p className="text-amber-100 text-[10px]">{language === "te" ? "ప్రివిలేజ్" : "Privilege"}</p>
                  </div>
                </div>
              </div>
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <Coins className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="shop" className="flex items-center gap-1">
              <Gift className="h-4 w-4" />
              {language === "te" ? "షాప్" : "Shop"}
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              {language === "te" ? "ఆర్డర్లు" : "Orders"}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              {language === "te" ? "హిస్టరీ" : "History"}
            </TabsTrigger>
          </TabsList>

          {/* Shop Tab */}
          <TabsContent value="shop" className="mt-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "te" ? "గిఫ్ట్‌లు వెతకండి..." : "Search gifts..."}
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 h-11"
                data-testid="gift-search"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(null)}
                className="whitespace-nowrap"
              >
                {language === "te" ? "అన్నీ" : "All"}
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.name}
                  variant={selectedCategory === cat.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(cat.name)}
                  className="whitespace-nowrap"
                >
                  {cat.name} ({cat.count})
                </Button>
              ))}
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {language === "te" ? "గిఫ్ట్‌లు ఇంకా అందుబాటులో లేవు" : "No gifts available yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                  <Card 
                    key={product.id} 
                    className={`overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${!product.can_afford ? 'opacity-60' : ''}`}
                    onClick={() => openClaimDialog(product)}
                    data-testid={`product-${product.id}`}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={product.image_url || "https://via.placeholder.com/200?text=Gift"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-amber-500 text-white">
                        <Coins className="h-3 w-3 mr-1" />
                        {product.points_required}
                      </Badge>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground line-through">
                          MRP Rs.{product.mrp}
                        </span>
                        {product.can_afford ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                            {language === "te" ? "క్లెయిమ్ చేయవచ్చు" : "Can Claim"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                            {product.points_required - (wallet?.balance || 0)} {language === "te" ? "అవసరం" : "needed"}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {language === "te" ? "ఆర్డర్లు ఇంకా లేవు" : "No orders yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <img
                        src={order.product_image || "https://via.placeholder.com/80?text=Gift"}
                        alt={order.product_name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1">{order.product_name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs flex items-center gap-1">
                            <Coins className="h-3 w-3 text-amber-500" />
                            {order.points_spent}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        {order.tracking_number && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Tracking: {order.tracking_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4 space-y-3">
            {wallet?.recent_transactions?.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {language === "te" ? "ట్రాన్సాక్షన్లు ఇంకా లేవు" : "No transactions yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              wallet?.recent_transactions?.map((txn) => (
                <Card key={txn.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(txn.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`font-bold ${txn.transaction_type.includes("credit") || txn.transaction_type === "earned" ? "text-green-600" : "text-red-600"}`}>
                      {txn.transaction_type.includes("credit") || txn.transaction_type === "earned" ? "+" : "-"}
                      {txn.points}
                    </span>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Claim Dialog */}
        <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === "te" ? "గిఫ్ట్ క్లెయిమ్ చేయండి" : "Claim Gift"}</DialogTitle>
            </DialogHeader>
            
            {selectedProduct && (
              <div className="space-y-4">
                {/* Product Preview */}
                <div className="flex gap-3 p-3 bg-muted rounded-lg">
                  <img
                    src={selectedProduct.image_url || "https://via.placeholder.com/80?text=Gift"}
                    alt={selectedProduct.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{selectedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground">MRP: Rs.{selectedProduct.mrp}</p>
                    <Badge className="mt-1 bg-amber-500 text-white">
                      <Coins className="h-3 w-3 mr-1" />
                      {selectedProduct.points_required} points
                    </Badge>
                  </div>
                </div>

                {/* Delivery Address Form */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {language === "te" ? "డెలివరీ చిరునామా" : "Delivery Address"}
                  </h4>
                  
                  <div className="space-y-2">
                    <Label>{language === "te" ? "పూర్తి పేరు" : "Full Name"} *</Label>
                    <Input
                      value={deliveryAddress.full_name}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, full_name: e.target.value})}
                      placeholder="Enter full name"
                      data-testid="delivery-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === "te" ? "ఫోన్ నంబర్" : "Phone Number"} *</Label>
                    <Input
                      type="tel"
                      value={deliveryAddress.phone}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value.replace(/\D/g, "").slice(0, 10)})}
                      placeholder="10-digit phone"
                      data-testid="delivery-phone"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === "te" ? "చిరునామా లైన్ 1" : "Address Line 1"} *</Label>
                    <Input
                      value={deliveryAddress.address_line1}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, address_line1: e.target.value})}
                      placeholder="House no, Street name"
                      data-testid="delivery-address1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === "te" ? "చిరునామా లైన్ 2" : "Address Line 2"}</Label>
                    <Input
                      value={deliveryAddress.address_line2}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, address_line2: e.target.value})}
                      placeholder="Area, Colony"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === "te" ? "ల్యాండ్‌మార్క్" : "Landmark"}</Label>
                    <Input
                      value={deliveryAddress.landmark}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, landmark: e.target.value})}
                      placeholder="Near temple, opposite mall"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{language === "te" ? "సిటీ" : "City"}</Label>
                      <Input
                        value={deliveryAddress.city}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "te" ? "పిన్‌కోడ్" : "Pincode"} *</Label>
                      <Input
                        value={deliveryAddress.pincode}
                        onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value.replace(/\D/g, "").slice(0, 6)})}
                        placeholder="6-digit"
                        data-testid="delivery-pincode"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowClaimDialog(false)}>
                {language === "te" ? "రద్దు" : "Cancel"}
              </Button>
              <Button 
                onClick={handleClaim} 
                disabled={claimLoading}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                data-testid="confirm-claim-btn"
              >
                {claimLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Gift className="h-4 w-4 mr-2" />
                )}
                {language === "te" ? "క్లెయిమ్ చేయండి" : "Claim Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
