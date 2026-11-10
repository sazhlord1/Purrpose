package space.purrpose.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Our own plugin (not from npm): Cafe Bazaar billing for the Iranian edition.
        registerPlugin(BazaarBillingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
