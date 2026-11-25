package app.hearthlight.family;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;

/**
 * Asks for the microphone, camera, and photo access the hosted site already
 * uses through getUserMedia, MediaRecorder, and the photo file input.
 * Capacitor only forwards a WebView media request after Android has granted it.
 */
public class MainActivity extends BridgeActivity {
    private static final int MEDIA_PERMISSIONS = 41023;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestMediaPermissions();
    }

    private void requestMediaPermissions() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        ArrayList<String> needed = new ArrayList<>();
        addIfMissing(needed, Manifest.permission.RECORD_AUDIO);
        addIfMissing(needed, Manifest.permission.CAMERA);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            addIfMissing(needed, Manifest.permission.READ_MEDIA_IMAGES);
            addIfMissing(needed, Manifest.permission.READ_MEDIA_AUDIO);
        } else {
            addIfMissing(needed, Manifest.permission.READ_EXTERNAL_STORAGE);
        }
        if (!needed.isEmpty()) {
            requestPermissions(needed.toArray(new String[0]), MEDIA_PERMISSIONS);
        }
    }

    private void addIfMissing(ArrayList<String> needed, String permission) {
        if (checkSelfPermission(permission) != PackageManager.PERMISSION_GRANTED) {
            needed.add(permission);
        }
    }
}
