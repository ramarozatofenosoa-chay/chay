package io.chay.app;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import com.getcapacitor.Bridge;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "AndroidMediaNotification",
    permissions = @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
)
public class AndroidMediaNotificationPlugin extends Plugin {
    private static Bridge staticBridge;

    @Override
    public void load() {
        staticBridge = bridge;
    }

    @com.getcapacitor.PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            getPermissionState("notifications") == PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", getPermissionState("notifications") == PermissionState.GRANTED);
        call.resolve(result);
    }

    @com.getcapacitor.PluginMethod
    public void update(PluginCall call) {
        Intent intent = new Intent(getContext(), MediaNotificationService.class)
            .setAction(MediaNotificationService.ACTION_UPDATE)
            .putExtra(MediaNotificationService.EXTRA_TITLE, call.getString("title", "Média"))
            .putExtra(MediaNotificationService.EXTRA_ARTIST, call.getString("artist", "CHAY"))
            .putExtra(MediaNotificationService.EXTRA_ARTWORK_URL, call.getString("artworkUrl", ""))
            .putExtra(MediaNotificationService.EXTRA_IS_PLAYING, call.getBoolean("isPlaying", false))
            .putExtra(MediaNotificationService.EXTRA_IS_LIVE, call.getBoolean("isLive", false))
            .putExtra(MediaNotificationService.EXTRA_CURRENT_TIME, call.getDouble("currentTime", 0.0))
            .putExtra(MediaNotificationService.EXTRA_DURATION, call.getDouble("duration", 0.0))
            .putExtra(MediaNotificationService.EXTRA_HAS_PREVIOUS, call.getBoolean("hasPrevious", false))
            .putExtra(MediaNotificationService.EXTRA_HAS_NEXT, call.getBoolean("hasNext", false));
        startService(intent);
        call.resolve();
    }

    @com.getcapacitor.PluginMethod
    public void clear(PluginCall call) {
        Intent intent = new Intent(getContext(), MediaNotificationService.class)
            .setAction(MediaNotificationService.ACTION_CLEAR);
        getContext().stopService(intent);
        call.resolve();
    }

    private void startService(Intent intent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
    }

    static void dispatchAction(String action, long positionMs) {
        Bridge currentBridge = staticBridge;
        if (currentBridge == null) return;
        PluginHandle handle = currentBridge.getPlugin("AndroidMediaNotification");
        if (handle == null) return;
        JSObject payload = new JSObject();
        payload.put("action", action);
        if (positionMs >= 0) payload.put("position", positionMs / 1000.0);
        ((AndroidMediaNotificationPlugin) handle.getInstance()).notifyListeners("mediaAction", payload, true);
    }
}
