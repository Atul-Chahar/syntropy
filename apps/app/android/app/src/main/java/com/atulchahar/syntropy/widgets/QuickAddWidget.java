package com.atulchahar.syntropy.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;
import com.atulchahar.syntropy.R;
import org.json.JSONObject;

/** Medium quick-add widget: roti, dahi, chai and dal in one tap each. */
public class QuickAddWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        JSONObject s = WidgetStore.snapshot(c);
        String next = s.optString("nextSession", "");
        for (int id : ids) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_quick);
            v.setOnClickPendingIntent(R.id.roti, WidgetActions.food(c, 1, "roti", "1 roti", 105));
            v.setOnClickPendingIntent(R.id.dahi, WidgetActions.food(c, 2, "dahi", "1 katori dahi", 95));
            v.setOnClickPendingIntent(R.id.chai, WidgetActions.food(c, 3, "chai", "1 masala chai", 80));
            v.setOnClickPendingIntent(R.id.dal, WidgetActions.food(c, 4, "dal-tadka", "1 katori dal", 170));
            v.setTextViewText(R.id.session, next.isEmpty() ? "Open plan" : next);
            v.setOnClickPendingIntent(R.id.session, WidgetActions.open(c, "plan"));
            m.updateAppWidget(id, v);
        }
    }
}
