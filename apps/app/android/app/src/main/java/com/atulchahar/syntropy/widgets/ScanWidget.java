package com.atulchahar.syntropy.widgets;

import android.content.Context;
import android.graphics.Paint;
import android.widget.RemoteViews;
import com.atulchahar.syntropy.R;
import com.atulchahar.syntropy.widgets.WidgetArt.Blob;
import org.json.JSONObject;

/** Small ember "Scan plate" widget: opens the camera screen directly. */
public class ScanWidget extends ArtWidget {

    @Override
    int[] defaultSize() {
        return new int[] { 160, 160 };
    }

    @Override
    void draw(WidgetArt a, JSONObject s) {
        float w = a.w, h = a.h;
        a.card(0xFFC9481C, 26,
            new Blob(0.5f, 0.58f, 0.62f, 0xFFFF8F5E),
            new Blob(0.1f, 0.0f, 0.55f, 0xFFFFC7A8),
            new Blob(1.0f, 1.0f, 0.6f, 0xFF7A230C));

        a.text("Scan", 18, 31, WidgetArt.geist, 13, 0xF2FFFFFF, Paint.Align.LEFT);
        a.text("plate", 18, 47, WidgetArt.geist, 13, 0xF2FFFFFF, Paint.Align.LEFT);
        a.plus(w - 26, 26, 14, 0xFFC9481C);

        float r = Math.min(w, h) * 0.2f;
        a.target(w / 2, h * 0.56f, r, 0xFFFFC7A8);
        a.ripples(w / 2, h - 22, w * 0.6f, 13);

    }

    @Override
    RemoteViews views(Context c, WidgetArt a, JSONObject s) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_scan);
        v.setImageViewBitmap(R.id.art, a.bitmap);
        v.setContentDescription(R.id.art, "Scan plate");
        v.setOnClickPendingIntent(R.id.root, WidgetActions.open(c, "scan"));
        return v;
    }
}
