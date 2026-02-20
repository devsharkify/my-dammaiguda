import { createContext, useContext, useMemo } from 'react';
import APP_CONFIG from '../config/appConfig';

const AppConfigContext = createContext(APP_CONFIG);

export const AppConfigProvider = ({ children, config = APP_CONFIG }) => {
  // Memoize config to prevent unnecessary re-renders
  const memoizedConfig = useMemo(() => config, [config]);
  
  return (
    <AppConfigContext.Provider value={memoizedConfig}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const config = useContext(AppConfigContext);
  if (!config) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return config;
};

// ============== HELPER HOOKS ==============

// Area information (name, location, etc.)
export const useAreaInfo = () => {
  const config = useAppConfig();
  return config.area;
};

// Branding (app name, colors, logos)
export const useBranding = () => {
  const config = useAppConfig();
  return config.branding;
};

// Company information
export const useCompanyInfo = () => {
  const config = useAppConfig();
  return config.company;
};

// Feature flags (what features are enabled)
export const useFeatureFlags = () => {
  const config = useAppConfig();
  return config.features;
};

// Check if a specific feature is enabled
export const useFeature = (featureName) => {
  const features = useFeatureFlags();
  return features[featureName] ?? false;
};

// Stats for landing page
export const useStats = () => {
  const config = useAppConfig();
  return config.stats;
};

// AQI configuration
export const useAqiConfig = () => {
  const config = useAppConfig();
  return config.aqi;
};

// Dump yard configuration
export const useDumpYardConfig = () => {
  const config = useAppConfig();
  return config.dumpYard;
};

// URLs and domain info
export const useUrls = () => {
  const config = useAppConfig();
  return config.urls;
};

// Play Store info
export const usePlayStoreInfo = () => {
  const config = useAppConfig();
  return config.playStore;
};

// SMS/OTP config
export const useSmsConfig = () => {
  const config = useAppConfig();
  return config.sms;
};

// Social links
export const useSocialLinks = () => {
  const config = useAppConfig();
  return config.social;
};

// Get localized text (supports language context)
export const useLocalizedConfig = (language = 'en') => {
  const config = useAppConfig();
  const isTeluguLanguage = language === 'te';
  
  return useMemo(() => ({
    areaName: isTeluguLanguage ? config.area.name_te : config.area.name,
    tagline: isTeluguLanguage ? config.area.tagline_te : config.area.tagline,
    companyName: isTeluguLanguage ? config.company.name_te : config.company.name,
    appName: config.branding.appName,
    stats: {
      benefitsAmount: config.stats.benefitsAmount,
      benefitsLabel: isTeluguLanguage ? config.stats.benefitsLabel_te : config.stats.benefitsLabel,
      problemsSolved: config.stats.problemsSolved,
      problemsLabel: isTeluguLanguage ? config.stats.problemsLabel_te : config.stats.problemsLabel,
      peopleBenefited: config.stats.peopleBenefited,
      peopleLabel: isTeluguLanguage ? config.stats.peopleLabel_te : config.stats.peopleLabel,
    },
    primaryAqi: isTeluguLanguage ? config.aqi.stations.primary.name_te : config.aqi.stations.primary.name,
    secondaryAqi: isTeluguLanguage ? config.aqi.stations.secondary.name_te : config.aqi.stations.secondary.name,
    dumpYardName: config.dumpYard?.enabled 
      ? (isTeluguLanguage ? config.dumpYard.name_te : config.dumpYard.name) 
      : null,
  }), [config, isTeluguLanguage]);
};

export default AppConfigContext;
