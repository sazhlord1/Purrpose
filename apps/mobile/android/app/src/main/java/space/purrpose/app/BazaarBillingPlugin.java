package space.purrpose.app;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import ir.cafebazaar.poolakey.Connection;
import ir.cafebazaar.poolakey.ConnectionState;
import ir.cafebazaar.poolakey.Payment;
import ir.cafebazaar.poolakey.config.PaymentConfiguration;
import ir.cafebazaar.poolakey.config.SecurityCheck;
import ir.cafebazaar.poolakey.entity.PurchaseInfo;
import ir.cafebazaar.poolakey.request.PurchaseRequest;
import kotlin.Unit;

/**
 * Cafe Bazaar in-app billing (Poolakey) for the Iranian edition, called from the web app
 * as the Capacitor plugin "BazaarBilling" (apps/web/src/lib/bazaar.ts).
 *
 * The app only starts purchases and consumes them; the server checks every purchase token
 * with Bazaar's developer API before crediting anything. Poolakey also checks Bazaar's
 * signature on the device with the RSA public key passed to connect().
 */
@CapacitorPlugin(name = "BazaarBilling")
public class BazaarBillingPlugin extends Plugin {

    private Payment payment;
    private Connection connection;
    private String rsaKey;

    private boolean connected() {
        return connection != null && connection.getState() instanceof ConnectionState.Connected;
    }

    /** Connects to the Bazaar app on the phone. Resolves once connected; safe to call again. */
    @PluginMethod
    public void connect(PluginCall call) {
        String key = call.getString("rsaPublicKey", "");
        if (connected() && key.equals(rsaKey)) {
            call.resolve(new JSObject().put("connected", true));
            return;
        }
        try {
            if (connection != null) connection.disconnect();
            rsaKey = key;
            SecurityCheck check = key.isEmpty() ? SecurityCheck.Disable.INSTANCE : new SecurityCheck.Enable(key);
            payment = new Payment(getContext(), new PaymentConfiguration(check));
            final boolean[] answered = { false };
            connection = payment.connect(cb -> {
                cb.connectionSucceed(() -> {
                    if (!answered[0]) {
                        answered[0] = true;
                        call.resolve(new JSObject().put("connected", true));
                    }
                    return Unit.INSTANCE;
                });
                cb.connectionFailed(err -> {
                    if (!answered[0]) {
                        answered[0] = true;
                        // Usually: Cafe Bazaar is not installed, or too old.
                        call.reject(String.valueOf(err.getMessage()), "NOT_CONNECTED");
                    }
                    return Unit.INSTANCE;
                });
                cb.disconnected(() -> {
                    if (!answered[0]) {
                        answered[0] = true;
                        call.reject("Disconnected from Cafe Bazaar", "NOT_CONNECTED");
                    }
                    return Unit.INSTANCE;
                });
                return Unit.INSTANCE;
            });
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()), "NOT_CONNECTED");
        }
    }

    /** Opens Bazaar's payment screen for one product. Resolves with the purchase (to verify on the server). */
    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        if (productId == null || productId.isEmpty()) {
            call.reject("productId is required", "INVALID");
            return;
        }
        if (!connected()) {
            call.reject("Not connected to Cafe Bazaar", "NOT_CONNECTED");
            return;
        }
        String payload = call.getString("payload", "");
        getActivity().runOnUiThread(() -> {
            try {
                PurchaseRequest request = new PurchaseRequest(productId, payload, null);
                payment.purchaseProduct(getActivity().getActivityResultRegistry(), request, cb -> {
                    cb.purchaseFlowBegan(() -> Unit.INSTANCE);
                    cb.failedToBeginFlow(err -> {
                        call.reject(String.valueOf(err.getMessage()), "FAILED");
                        return Unit.INSTANCE;
                    });
                    cb.purchaseSucceed(info -> {
                        call.resolve(toJs(info));
                        return Unit.INSTANCE;
                    });
                    cb.purchaseCanceled(() -> {
                        call.reject("Purchase cancelled", "CANCELLED");
                        return Unit.INSTANCE;
                    });
                    cb.purchaseFailed(err -> {
                        call.reject(String.valueOf(err.getMessage()), "FAILED");
                        return Unit.INSTANCE;
                    });
                    return Unit.INSTANCE;
                });
            } catch (Exception e) {
                call.reject(String.valueOf(e.getMessage()), "FAILED");
            }
        });
    }

    /** Marks a purchase as used, so the same product can be bought again. Call after the server credited it. */
    @PluginMethod
    public void consume(PluginCall call) {
        String token = call.getString("purchaseToken");
        if (token == null || token.isEmpty()) {
            call.reject("purchaseToken is required", "INVALID");
            return;
        }
        if (!connected()) {
            call.reject("Not connected to Cafe Bazaar", "NOT_CONNECTED");
            return;
        }
        payment.consumeProduct(token, cb -> {
            cb.consumeSucceed(() -> {
                call.resolve(new JSObject().put("consumed", true));
                return Unit.INSTANCE;
            });
            cb.consumeFailed(err -> {
                call.reject(String.valueOf(err.getMessage()), "FAILED");
                return Unit.INSTANCE;
            });
            return Unit.INSTANCE;
        });
    }

    /** Purchases Bazaar knows about that were not consumed yet (e.g. the app closed before crediting). */
    @PluginMethod
    public void getPurchases(PluginCall call) {
        if (!connected()) {
            call.reject("Not connected to Cafe Bazaar", "NOT_CONNECTED");
            return;
        }
        payment.getPurchasedProducts(cb -> {
            cb.querySucceed(list -> {
                JSArray arr = new JSArray();
                for (PurchaseInfo info : list) arr.put(toJs(info));
                call.resolve(new JSObject().put("purchases", arr));
                return Unit.INSTANCE;
            });
            cb.queryFailed(err -> {
                call.reject(String.valueOf(err.getMessage()), "FAILED");
                return Unit.INSTANCE;
            });
            return Unit.INSTANCE;
        });
    }

    private static JSObject toJs(PurchaseInfo info) {
        JSObject o = new JSObject();
        o.put("productId", info.getProductId());
        o.put("purchaseToken", info.getPurchaseToken());
        o.put("orderId", info.getOrderId());
        o.put("payload", info.getPayload());
        o.put("purchaseTime", info.getPurchaseTime());
        return o;
    }

    @Override
    protected void handleOnDestroy() {
        if (connection != null) connection.disconnect();
        super.handleOnDestroy();
    }
}
