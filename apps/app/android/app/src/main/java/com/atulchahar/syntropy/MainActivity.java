package com.atulchahar.syntropy;

import android.os.Bundle;
import com.atulchahar.syntropy.widgets.SyntropyWidgetsPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SyntropyWidgetsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
