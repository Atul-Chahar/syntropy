package com.atulchahar.syntropy.widgets;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;

/** JS bridge: apps/app/src/platform/widgets.ts. */
@CapacitorPlugin(name = "SyntropyWidgets")
public class SyntropyWidgetsPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        String snapshot = call.getString("snapshot", "{}");
        WidgetStore.saveSnapshot(getContext(), snapshot);
        call.resolve();
    }

    @PluginMethod
    public void takePendingWater(PluginCall call) {
        JSObject r = new JSObject();
        r.put("ml", WidgetStore.takeWater(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void takePendingFoods(PluginCall call) {
        JSONArray q = WidgetStore.takeFoods(getContext());
        JSArray foods = new JSArray();
        for (int i = 0; i < q.length(); i++) foods.put(q.optString(i));
        JSObject r = new JSObject();
        r.put("foods", foods);
        call.resolve(r);
    }
}
