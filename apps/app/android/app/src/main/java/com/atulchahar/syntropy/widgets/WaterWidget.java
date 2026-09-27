package com.atulchahar.syntropy.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;
import com.atulchahar.syntropy.R;
import java.util.Locale;
import org.json.JSONObject;

/** Small interactive water widget: one tap adds 250 ml without opening the app. */
public class WaterWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        JSONObject s = WidgetStore.snapshot(c);
        int water = s.optInt("waterMl", 0);
        int target = Math.max(1, s.optInt("waterTarget", 3000));
        for (int id : ids) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_water);
            v.setTextViewText(R.id.liters, String.format(Locale.US, "%.2f", water / 1000f));
            v.setTextViewText(R.id.target, String.format(Locale.US, "of %.1f L", target / 1000f));
            v.setProgressBar(R.id.water_bar, 100, Math.min(100, water * 100 / target), false);
            v.setOnClickPendingIntent(R.id.add, WidgetActions.water(c, 250));
            v.setOnClickPendingIntent(R.id.root, WidgetActions.open(c, "food"));
            m.updateAppWidget(id, v);
        }
    }
}
