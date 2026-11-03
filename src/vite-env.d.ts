/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_REALTIME_URL: string;
  /** JSON array of RTCIceServer (STUN/TURN). Optional: public STUN only when empty. */
  readonly VITE_ICE_SERVERS?: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// simple-peer's prebuilt browser bundle: it carries its own Buffer/process/events polyfills, which
// the package entry point expects from Node and Vite does not provide.
declare module "simple-peer/simplepeer.min.js" {
  import SimplePeer from "simple-peer";
  export default SimplePeer;
}
