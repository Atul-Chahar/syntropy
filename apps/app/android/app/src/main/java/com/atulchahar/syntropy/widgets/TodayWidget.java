package com.atulchahar.syntropy.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;
import com.atulchahar.syntropy.R;
import java.util.Locale;
import org.json.JSONObject;

/** Medium "Today" widget from Widgets.dc.html: kcal left, protein and water. */
public class TodayWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        JSONObject s = WidgetStore.snapshot(c);
        int left = s.optInt("kcalLeft", 0);
        int target = Math.max(1, s.optInt("kcalTarget", 2000));
        int eaten = s.optInt("kcalEaten", 0);
        int protein = s.optInt("proteinG", 0);
        int proteinT = Math.max(1, s.optInt("proteinTarget", 120));
        int water = s.optInt("waterMl", 0);
        int waterT = Math.max(1, s.optInt("waterTarget", 3000));
        for (int id : ids) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_today);
            v.setTextViewText(R.id.kcal, String.format(Locale.US, "%,d", Math.abs(left)));
            v.setTextViewText(R.id.kcal_label, left >= 0 ? "kcal left" : "kcal over");
            v.setProgressBar(R.id.kcal_ring, 100, Math.min(100, eaten * 100 / target), false);
            v.setTextViewText(R.id.protein_value, protein + " / " + proteinT + " g");
            v.setProgressBar(R.id.protein_bar, 100, Math.min(100, protein * 100 / proteinT), false);
            v.setTextViewText(R.id.water_value, String.format(Locale.US, "%.2f / %.1f L", water / 1000f, waterT / 1000f));
            v.setProgressBar(R.id.water_bar, 100, Math.min(100, water * 100 / waterT), false);
            v.setTextViewText(R.id.next, s.optString("nextSession", ""));
            v.setOnClickPendingIntent(R.id.root, WidgetActions.open(c, "food"));
            m.updateAppWidget(id, v);
        }
    }
}
