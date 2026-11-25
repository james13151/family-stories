import type { CapacitorConfig } from "@capacitor/cli";
import { capacitorServerUrl } from "./scripts/capacitor-server-url";

const url = capacitorServerUrl();
const hostname = new URL(url).hostname;

const config: CapacitorConfig = {
  appId: "app.hearthlight.family",
  appName: "家燈",
  webDir: "capacitor-www",
  server: {
    url,
    cleartext: url.startsWith("http://"),
    androidScheme: "https",
    allowNavigation: [hostname],
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
