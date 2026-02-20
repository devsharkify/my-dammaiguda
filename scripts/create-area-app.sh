#!/bin/bash
# =====================================================
# WHITE-LABEL APP GENERATOR
# Creates new area app from template
# 
# Usage: ./create-area-app.sh asraonagar "AS Rao Nagar" "#2563EB"
# =====================================================

AREA_ID=$1
AREA_NAME=$2
PRIMARY_COLOR=$3

if [ -z "$AREA_ID" ] || [ -z "$AREA_NAME" ]; then
    echo "Usage: ./create-area-app.sh <area_id> <area_name> [primary_color]"
    echo "Example: ./create-area-app.sh asraonagar 'AS Rao Nagar' '#2563EB'"
    exit 1
fi

PRIMARY_COLOR=${PRIMARY_COLOR:-"#0F766E"}

echo "🚀 Creating app for: $AREA_NAME"
echo "   Area ID: $AREA_ID"
echo "   Color: $PRIMARY_COLOR"
echo ""

# Create new directory
NEW_DIR="my-$AREA_ID"
echo "📁 Creating directory: $NEW_DIR"

# Copy current project
cp -r /app/frontend "$NEW_DIR-frontend"
cp -r /app/backend "$NEW_DIR-backend"

echo "✏️  Updating configuration..."

# Update appConfig.js
cat > "$NEW_DIR-frontend/src/config/appConfig.js" << EOF
const APP_CONFIG = {
  area: {
    id: "$AREA_ID",
    name: "$AREA_NAME",
    name_te: "$AREA_NAME", // Update Telugu name manually
    tagline: "Track Issues. Protect Health. Claim Benefits.",
  },
  branding: {
    appName: "My $AREA_NAME",
    appNameShort: "My $AREA_NAME",
    primaryColor: "$PRIMARY_COLOR",
    logo: "/logo512.png",
  },
  company: {
    name: "Sharkify Technology Pvt. Ltd.",
    email: "support@sharkify.in",
  },
  urls: {
    domain: "my$AREA_ID.in",
  },
  playStore: {
    packageName: "com.sharkify.my$AREA_ID",
    appId: "my-$AREA_ID-app",
  },
  features: {
    news: true,
    fitness: true,
    astrology: true,
    issues: true,
    aqi: true,
  },
};
export default APP_CONFIG;
EOF

echo "✅ App created successfully!"
echo ""
echo "📋 Next Steps:"
echo "   1. Update Telugu translations in appConfig.js"
echo "   2. Replace logo files in public/"
echo "   3. Update manifest.json"
echo "   4. Deploy to Railway"
echo "   5. Buy domain: my$AREA_ID.in"
echo ""
