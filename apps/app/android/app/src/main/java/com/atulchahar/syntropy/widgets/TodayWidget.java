package com.atulchahar.syntropy.widgets;

import android.content.Context;
import android.graphics.Paint;
import android.graphics.RectF;
import android.widget.RemoteViews;
import com.atulchahar.syntropy.R;
import com.atulchahar.syntropy.widgets.WidgetArt.Blob;
import java.util.Locale;
import org.json.JSONObject;

/** Medium "Today" widget: kcal left in dot numerals, protein and water tiles on green glass. */
public class TodayWidget extends ArtWidget {

    @Override
    int[] defaultSize() {
        return new int[] { 320, 150 };
    }

    @Override
    void draw(WidgetArt a, JSONObject s) {
        int left = s.optInt("kcalLeft", 0);
        int target = Math.max(1, s.optInt("kcalTarget", 2000));
        int eaten = s.optInt("kcalEaten", 0);
        int protein = s.optInt("proteinG", 0);
        int proteinT = Math.max(1, s.optInt("proteinTarget", 120));
        int water = s.optInt("waterMl", 0);
        int waterT = Math.max(1, s.optInt("waterTarget", 3000));
        String next = s.optString("nextSession", "");

        float w = a.w, h = a.h;
        a.card(0xFF2C6A2B, 26,
            new Blob(0.18f, 0.05f, 0.75f, 0xFFA9D98C),
            new Blob(0.55f, 0.55f, 0.6f, 0xFF4FA645),
            new Blob(0.95f, 1.0f, 0.7f, 0xFF123F17));

        // Left: kicker, the number, its label, a dot meter of the day so far.
        float x = 18, colW = w * 0.5f - 26;
        String kicker = next.isEmpty() ? "Today" : next;
        a.text(a.clip(kicker, WidgetArt.geist, 12.5f, colW), x, 30, WidgetArt.geist, 12.5f, 0xE6FFFFFF, Paint.Align.LEFT);
        String num = String.valueOf(Math.abs(left));
        float size = Math.min(a.fit(num, WidgetArt.doto, 50, colW), h * 0.36f);
        float base = 30 + 8 + size * 0.86f;
        a.dots(num, x - 2, base, size, 0xFFFFFFFF, Paint.Align.LEFT);
        a.text(left >= 0 ? "kcal left" : "kcal over target", x, base + 18, WidgetArt.geist, 12, 0xBFFFFFFF, Paint.Align.LEFT);
        a.dotMeter(x - 1, h - 16 - 11, colW, 2, eaten / (float) target, 0xF2FFFFFF);

        // Right: protein and water tiles.
        float tx = w * 0.5f, tr = w - 12, gap = 8;
        float th = (h - 24 - gap) / 2;
        tile(a, new RectF(tx, 12, tr, 12 + th), "leaf", "Protein", String.valueOf(protein), " / " + proteinT + " g",
            protein / (float) proteinT, new Blob(0.15f, 0.2f, 0.9f, 0x5CC9F2B0));
        tile(a, new RectF(tx, 12 + th + gap, tr, h - 12), "drop", "Water", String.format(Locale.US, "%.2f", water / 1000f),
            String.format(Locale.US, " / %.1f L", waterT / 1000f), water / (float) waterT, new Blob(0.85f, 0.9f, 0.9f, 0x5C9CC7E0));

    }

    @Override
    RemoteViews views(Context c, WidgetArt a, JSONObject s) {
        int left = s.optInt("kcalLeft", 0);
        int protein = s.optInt("proteinG", 0);
        int proteinT = Math.max(1, s.optInt("proteinTarget", 120));
        int water = s.optInt("waterMl", 0);
        int waterT = Math.max(1, s.optInt("waterTarget", 3000));
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_today);
        v.setImageViewBitmap(R.id.art, a.bitmap);
        v.setContentDescription(R.id.art, String.format(Locale.US, "%d kcal %s, protein %d of %d grams, water %.2f of %.1f litres",
            Math.abs(left), left >= 0 ? "left" : "over", protein, proteinT, water / 1000f, waterT / 1000f));
        v.setOnClickPendingIntent(R.id.root, WidgetActions.open(c, "food"));
        return v;
    }

    private static void tile(WidgetArt a, RectF r, String icon, String label, String value, String unit, float progress, Blob blob) {
        a.tile(r, 20, 0x2EFFFFFF, blob);
        float cy = r.top + Math.min(20, r.height() * 0.32f);
        a.ring(r.left + 20, cy, 9.5f);
        a.icon(icon, r.left + 20, cy, 9, 0xE6FFFFFF);
        a.text(label, r.left + 36, cy + 4.2f, WidgetArt.geist, 12, 0xD9FFFFFF, Paint.Align.LEFT);
        a.text(Math.round(ArtWidget.clamp01(progress) * 100) + "%", r.right - 12, cy + 4, WidgetArt.mono, 10, 0x99FFFFFF, Paint.Align.RIGHT);
        float vs = Math.min(22, r.height() * 0.36f);
        float vb = r.bottom - Math.max(9, r.height() * 0.16f);
        float vw = a.dots(value, r.left + 12, vb, vs, 0xFFFFFFFF, Paint.Align.LEFT);
        a.text(unit, r.left + 13 + vw, vb, WidgetArt.geist, 11, 0xA6FFFFFF, Paint.Align.LEFT);
    }
}
