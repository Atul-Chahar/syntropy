package com.atulchahar.syntropy.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.os.Bundle;
import android.widget.RemoteViews;
import org.json.JSONObject;

/** A widget drawn by WidgetArt; redrawn when data changes or the user resizes it. */
abstract class ArtWidget extends AppWidgetProvider {

    /** Size in dp to draw at before the launcher reports one. */
    abstract int[] defaultSize();

    /** Paints the widget for snapshot `s`. */
    abstract void draw(WidgetArt a, JSONObject s);

    /** The RemoteViews around the drawn bitmap: tap targets and a spoken summary. */
    abstract RemoteViews views(Context c, WidgetArt a, JSONObject s);

    RemoteViews render(Context c, AppWidgetManager m, int id, JSONObject s) {
        int[] d = defaultSize();
        WidgetArt a = WidgetArt.forWidget(c, m, id, d[0], d[1]);
        draw(a, s);
        return views(c, a, s);
    }

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        JSONObject s = WidgetStore.snapshot(c);
        for (int id : ids) {
            try {
                m.updateAppWidget(id, render(c, m, id, s));
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, Bundle options) {
        onUpdate(c, m, new int[] { id });
    }

    static float clamp01(float v) {
        return Math.max(0f, Math.min(1f, v));
    }
}
