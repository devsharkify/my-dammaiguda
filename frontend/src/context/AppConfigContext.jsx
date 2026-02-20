import { createContext, useContext } from 'react';
import APP_CONFIG from '../config/appConfig';

const AppConfigContext = createContext(APP_CONFIG);

export const AppConfigProvider = ({ children, config = APP_CONFIG }) => {
  return (
    <AppConfigContext.Provider value={config}>
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

// Helper hooks for common config values
export const useAreaInfo = () => {
  const config = useAppConfig();
  return config.area;
};

export const useBranding = () => {
  const config = useAppConfig();
  return config.branding;
};

export const useCompanyInfo = () => {
  const config = useAppConfig();
  return config.company;
};

export const useFeatureFlags = () => {
  const config = useAppConfig();
  return config.features;
};

export default AppConfigContext;
