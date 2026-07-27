package com.smartgovhealth.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // MUST be called before super.onCreate() to properly initialise the splash screen
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
    }
}
