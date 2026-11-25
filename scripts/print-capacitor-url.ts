import { CAPACITOR_SERVER_PLACEHOLDER, capacitorServerUrl } from "./capacitor-server-url";

const url = capacitorServerUrl();
console.log(url);
if (url === CAPACITOR_SERVER_PLACEHOLDER) {
  console.error("This is the placeholder. Set CAPACITOR_SERVER_URL to the real https origin before you give the APK to the family.");
}
