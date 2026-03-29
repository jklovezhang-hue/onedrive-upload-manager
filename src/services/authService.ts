import { Configuration, PublicClientApplication } from '@azure/msal-browser';
import { MSAL_CONFIG } from '@/utils/constants';

export const msalConfig: Configuration = {
  auth: {
    clientId: MSAL_CONFIG.clientId,
    authority: MSAL_CONFIG.authority,
    redirectUri: MSAL_CONFIG.redirectUri,
    postLogoutRedirectUri: MSAL_CONFIG.postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log(`[MSAL ${level}]`, message);
      },
    },
  },
};

export { MSAL_CONFIG };