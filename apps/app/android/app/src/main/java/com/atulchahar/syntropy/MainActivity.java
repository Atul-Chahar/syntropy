package com.atulchahar.syntropy;

import android.graphics.Bitmap;
import android.os.Bundle;
import com.atulchahar.syntropy.widgets.SyntropyWidgetsPlugin;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SyntropyWidgetsPlugin.class);
        super.onCreate(savedInstanceState);
        // The WebView paints a grey "play" poster on a <video> until its first frame arrives.
        // The camera previews must start from nothing, so the default poster is transparent.
        bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(bridge) {
            @Override
            public Bitmap getDefaultVideoPoster() {
                return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
            }
        });
    }
}
