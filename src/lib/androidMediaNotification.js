import { Capacitor, registerPlugin } from "@capacitor/core";

const AndroidMediaNotification = registerPlugin("AndroidMediaNotification");

export function isAndroidApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function requestAndroidMediaNotificationPermission() {
  return AndroidMediaNotification.requestNotificationPermission();
}

export async function updateAndroidMediaNotification(media) {
  return AndroidMediaNotification.update(media);
}

export async function clearAndroidMediaNotification() {
  return AndroidMediaNotification.clear();
}

export function subscribeAndroidMediaActions(listener) {
  return AndroidMediaNotification.addListener("mediaAction", listener);
}
