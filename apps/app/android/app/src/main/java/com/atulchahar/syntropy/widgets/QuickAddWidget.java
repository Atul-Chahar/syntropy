package com.atulchahar.syntropy.widgets;

import android.content.Context;
import android.graphics.Paint;
import android.graphics.RectF;
import android.widget.RemoteViews;
import com.atulchahar.syntropy.R;
import com.atulchahar.syntropy.widgets.WidgetArt.Blob;
import org.json.JSONObject;

/** Medium quick-add widget: roti, dahi, chai and dal in one tap each, as glass tiles. */
public class QuickAddWidget extends ArtWidget {

    /** Geometry shared with res/layout/widget_quick.xml, in dp. */
    static final float HEADER = 54, EDGE = 10, GAP = 6;

    private static final String[] NAMES = { "Roti", "Dahi", "Chai", "Dal" };
    private static final int[] KCAL = { 105, 95, 80, 170 };
    private static final int[] TINT = { 0xFFF0A04B, 0xFF4FB548, 0xFFF0588C, 0xFF8BC34A };

    @Override
    int[] defaultSize() {
        return new int[] { 320, 150 };
    }

    @Override
    void draw(WidgetArt a, JSONObject s) {
        String next = s.optString("nextSession", "");

        float w = a.w, h = a.h;
        a.card(0xFF4A2E38, 26,
            new Blob(0.9f, 0.0f, 0.7f, 0xFFD9708F),
            new Blob(0.05f, 0.2f, 0.55f, 0xFFB98E9C),
            new Blob(0.5f, 1.1f, 0.7f, 0xFF1F1418));

        a.text("Quick add", 18, 29, WidgetArt.geist, 14.5f, 0xF2FFFFFF, Paint.Align.LEFT);
        a.text("One tap adds to this meal", 18, 44, WidgetArt.geist, 11, 0x80FFFFFF, Paint.Align.LEFT);
        String session = next.isEmpty() ? "Open plan" : next;
        a.text(a.clip(session, WidgetArt.geist, 11.5f, w * 0.42f), w - 18, 29, WidgetArt.geist, 11.5f, 0xFFFFC7B0, Paint.Align.RIGHT);

        float tw = (w - EDGE * 2 - GAP * 3) / 4;
        float top = HEADER, bottom = h - EDGE;
        for (int i = 0; i < 4; i++) {
            float x = EDGE + i * (tw + GAP);
            RectF r = new RectF(x, top, x + tw, bottom);
            int tint = TINT[i];
            a.tile(r, 18, (tint & 0x00FFFFFF) | 0x66000000,
                new Blob(0.5f, 0.85f, 0.9f, tint),
                new Blob(0.35f, -0.05f, 0.65f, 0x66FFFFFF));
            float ks = Math.min(22, Math.min(r.height() * 0.26f, tw * 0.3f));
            float cy = r.top + r.height() * 0.42f;
            a.dots(String.valueOf(KCAL[i]), r.centerX(), cy + ks * 0.36f, ks, 0xFFFFFFFF, Paint.Align.CENTER);
            a.text("KCAL", r.centerX(), cy + ks * 0.36f + 13, WidgetArt.mono, 8.5f, 0xB3FFFFFF, Paint.Align.CENTER, 0.1f);
            a.text(NAMES[i], r.left + 11, r.bottom - 12, WidgetArt.geist, 13, 0xFFFFFFFF, Paint.Align.LEFT);
            float pr = Math.min(9, tw * 0.13f);
            a.plusGlass(r.right - pr - 8, r.bottom - 12 - 4.5f, pr);
        }

    }

    @Override
    RemoteViews views(Context c, WidgetArt a, JSONObject s) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_quick);
        v.setImageViewBitmap(R.id.art, a.bitmap);
        v.setContentDescription(R.id.art, "Quick add: roti, dahi, chai, dal");
        v.setOnClickPendingIntent(R.id.roti, WidgetActions.food(c, 1, "roti", "1 roti", 105));
        v.setOnClickPendingIntent(R.id.dahi, WidgetActions.food(c, 2, "dahi", "1 katori dahi", 95));
        v.setOnClickPendingIntent(R.id.chai, WidgetActions.food(c, 3, "chai", "1 masala chai", 80));
        v.setOnClickPendingIntent(R.id.dal, WidgetActions.food(c, 4, "dal-tadka", "1 katori dal", 170));
        v.setOnClickPendingIntent(R.id.session, WidgetActions.open(c, "plan"));
        return v;
    }
}
