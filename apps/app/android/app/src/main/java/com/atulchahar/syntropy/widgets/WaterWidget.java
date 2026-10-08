package com.atulchahar.syntropy.widgets;

import android.content.Context;
import android.graphics.Paint;
import android.widget.RemoteViews;
import com.atulchahar.syntropy.R;
import com.atulchahar.syntropy.widgets.WidgetArt.Blob;
import java.util.Locale;
import org.json.JSONObject;

/** Small interactive water widget: litres in dot numerals over a tick ruler; + adds 250 ml. */
public class WaterWidget extends ArtWidget {

    @Override
    int[] defaultSize() {
        return new int[] { 160, 160 };
    }

    @Override
    void draw(WidgetArt a, JSONObject s) {
        int water = s.optInt("waterMl", 0);
        int target = Math.max(1, s.optInt("waterTarget", 3000));

        float w = a.w, h = a.h;
        a.card(0xFF1F4462, 26,
            new Blob(0.25f, 0.0f, 0.8f, 0xFF9CC7E0),
            new Blob(0.9f, 0.45f, 0.55f, 0xFF4F87B0),
            new Blob(0.4f, 1.05f, 0.7f, 0xFF0D2236));

        a.text("Water", 18, 31, WidgetArt.geist, 13, 0xE6FFFFFF, Paint.Align.LEFT);
        a.plus(w - 26, 26, 14, 0xFF1F4462);

        String num = String.format(Locale.US, "%.2f", water / 1000f);
        float size = Math.min(50 * Math.min(1f, (w - 36) / a.dotsWidth(num, 50)), h * 0.32f);
        float base = h * 0.5f + size * 0.42f;
        a.dots(num, w / 2, base, size, 0xFFFFFFFF, Paint.Align.CENTER);
        int pct = Math.round(clamp01(water / (float) target) * 100);
        a.text(String.format(Locale.US, "of %.1f L · %d%%", target / 1000f, pct), w / 2, base + 17, WidgetArt.geist, 11.5f,
            0xBFFFFFFF, Paint.Align.CENTER);
        a.ruler(18, h - 18 - 15, w - 36, 15, water / (float) target);

    }

    @Override
    RemoteViews views(Context c, WidgetArt a, JSONObject s) {
        int water = s.optInt("waterMl", 0);
        int target = Math.max(1, s.optInt("waterTarget", 3000));
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_water);
        v.setImageViewBitmap(R.id.art, a.bitmap);
        v.setContentDescription(R.id.art, String.format(Locale.US, "Water %.2f of %.1f litres", water / 1000f, target / 1000f));
        v.setOnClickPendingIntent(R.id.add, WidgetActions.water(c, 250));
        v.setOnClickPendingIntent(R.id.root, WidgetActions.open(c, "food"));
        return v;
    }
}
