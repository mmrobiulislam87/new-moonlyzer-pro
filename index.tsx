import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CDRProvider } from './contexts/CDRContext';
import { IPDRProvider } from './contexts/IPDRContext';
import { LACProvider } from './contexts/LACContext';
import { SMSProvider } from './contexts/SMSContext';
import { NagadProvider } from './contexts/NagadContext';
import { BkashProvider } from './contexts/BkashContext';
import { RoketProvider } from './contexts/RoketContext';
import { VoIPProvider } from './contexts/VoIPContext';
import { InvestigationFileProvider } from './contexts/InvestigationFileContext';
import { SuspectRecognitionProvider } from './contexts/SuspectRecognitionContext';
import { LicenseProvider } from './contexts/LicenseContext';

// Function to load Google Maps script dynamically and securely
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If script is already loaded, resolve immediately
    if (window.google && window.google.maps) {
      window.googleMapsApiLoaded = true;
      resolve();
      return;
    }

    // Set a global callback function that the script will call upon loading
    window.initMapApp = () => {
      console.log("Google Maps API loaded dynamically.");
      window.googleMapsApiLoaded = true;
      resolve();
      // Clean up the global callback function after it's called
      delete window.initMapApp;
    };

    // Create the script tag
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization,marker,geocoding,drawing,geometry&callback=initMapApp`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      console.error("Google Maps script failed to load.");
      reject(new Error("Google Maps script failed to load. Check API key and network."));
      delete window.initMapApp; // Clean up on error as well
    };

    // Append the script to the document head
    document.head.appendChild(script);
  });
};


const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <InvestigationFileProvider>
    <SuspectRecognitionProvider>
      <LicenseProvider>
        <LACProvider>
          <CDRProvider>
            <IPDRProvider>
              <SMSProvider>
                <NagadProvider>
                  <BkashProvider>
                    <RoketProvider>
                      <VoIPProvider>
                        {children}
                      </VoIPProvider>
                    </RoketProvider>
                  </BkashProvider>
                </NagadProvider>
              </SMSProvider>
            </IPDRProvider>
          </CDRProvider>
        </LACProvider>
      </LicenseProvider>
    </SuspectRecognitionProvider>
  </InvestigationFileProvider>
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Load the Google Maps script first, then render the React app.
// The API key MUST be provided as an environment variable.
loadGoogleMapsScript(process.env.API_KEY || '')
  .then(() => {
    root.render(
      <React.StrictMode>
        <AppProviders>
          <App />
        </AppProviders>
      </React.StrictMode>
    );
  })
  .catch(error => {
    console.error("Could not load Google Maps API. Map features may be disabled or broken.", error);
    // Render the app anyway, but map-dependent features will fail.
    // The components themselves should handle the case where `window.google` is not available.
    root.render(
      <React.StrictMode>
        <AppProviders>
          <App />
        </AppProviders>
      </React.StrictMode>
    );
  });