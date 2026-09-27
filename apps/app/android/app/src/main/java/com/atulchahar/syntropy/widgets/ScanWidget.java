package com.atulchahar.syntropy.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;
import com.atulchahar.syntropy.R;

/** Small ember "Scan plate" widget: opens the camera screen directly. */
public class ScanWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_scan);
            v.setOnClickPendingIntent(R.id.root, WidgetActions.open(c, "scan"));
            m.updateAppWidget(id, v);
        }
    }
}
