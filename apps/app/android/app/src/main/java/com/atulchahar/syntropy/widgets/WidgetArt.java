package com.atulchahar.syntropy.widgets;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapShader;
import android.graphics.BlurMaskFilter;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import java.util.Random;

/**
 * Draws a widget as one bitmap: frosted glass over soft colour fields, grain, a lit edge, and the
 * app's own fonts (Geist, Geist Mono, Doto), which RemoteViews text cannot use. Units are dp.
 */
final class WidgetArt {

    /** A soft colour field: centre (fraction of the box), radius (fraction of its long side). */
    static final class Blob {
        final float x, y, r;
        final int color;

        Blob(float x, float y, float r, int color) {
            this.x = x;
            this.y = y;
            this.r = r;
            this.color = color;
        }
    }

    static Typeface geist, geistLight, mono, doto;
    private static Bitmap grain;

    final Bitmap bitmap;
    final float w, h;
    private final Canvas c;
    private final float k;
    private final Paint p = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);

    private WidgetArt(float wDp, float hDp, float k) {
        this.w = wDp;
        this.h = hDp;
        this.k = k;
        bitmap = Bitmap.createBitmap(Math.max(1, Math.round(wDp * k)), Math.max(1, Math.round(hDp * k)), Bitmap.Config.ARGB_8888);
        c = new Canvas(bitmap);
    }

    /** A canvas the size of widget `id` (portrait), or the default size before the launcher reports one. */
    static WidgetArt forWidget(Context ctx, AppWidgetManager m, int id, int defW, int defH) {
        loadFonts(ctx);
        Bundle o = m.getAppWidgetOptions(id);
        int wDp = o == null ? 0 : o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
        int hDp = o == null ? 0 : o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        if (wDp <= 0) wDp = defW;
        if (hDp <= 0) hDp = defH;
        return forSize(ctx, wDp, hDp);
    }

    /** A canvas of `wDp` x `hDp` at the screen's density. */
    static WidgetArt forSize(Context ctx, int wDp, int hDp) {
        loadFonts(ctx);
        float k = ctx.getResources().getDisplayMetrics().density;
        // RemoteViews bitmaps cross a binder; keep each under ~3.6 MB.
        double px = (double) wDp * k * hDp * k;
        if (px > 900_000) k *= (float) Math.sqrt(900_000 / px);
        return new WidgetArt(wDp, hDp, k);
    }

    private static synchronized void loadFonts(Context ctx) {
        if (doto != null) return;
        geist = font(ctx, "geist.ttf", "'wght' 400");
        geistLight = font(ctx, "geist.ttf", "'wght' 300");
        mono = font(ctx, "geist_mono.ttf", "'wght' 400");
        doto = font(ctx, "doto.ttf", "'wght' 700, 'ROND' 100");
    }

    private static Typeface font(Context ctx, String file, String axes) {
        Typeface t = null;
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                t = new Typeface.Builder(ctx.getAssets(), "fonts/" + file).setFontVariationSettings(axes).build();
            }
            if (t == null) t = Typeface.createFromAsset(ctx.getAssets(), "fonts/" + file);
        } catch (Exception e) {
            t = Typeface.DEFAULT;
        }
        return t;
    }

    float px(float dp) {
        return dp * k;
    }

    // ── surfaces ────────────────────────────────────────────────────────────────────────────

    /** The widget's own card: base colour, colour fields, grain, top light and a lit edge. */
    void card(int base, float radius, Blob... blobs) {
        RectF r = new RectF(0, 0, w, h);
        surface(r, radius, base, 0.07f, blobs);
    }

    /** A glass tile inside the card, with a soft drop shadow. */
    void tile(RectF r, float radius, int fill, Blob... blobs) {
        p.reset();
        p.setAntiAlias(true);
        p.setColor(0x33000000);
        p.setMaskFilter(new BlurMaskFilter(px(10), BlurMaskFilter.Blur.NORMAL));
        c.drawRoundRect(sc(new RectF(r.left + 2, r.top + 5, r.right - 2, r.bottom + 4)), px(radius), px(radius), p);
        p.setMaskFilter(null);
        surface(r, radius, fill, 0.05f, blobs);
    }

    private void surface(RectF rDp, float radius, int base, float grainAlpha, Blob... blobs) {
        RectF r = sc(rDp);
        float rad = px(radius);
        Path clip = new Path();
        clip.addRoundRect(r, rad, rad, Path.Direction.CW);
        c.save();
        c.clipPath(clip);
        p.reset();
        p.setAntiAlias(true);
        p.setColor(base);
        c.drawRect(r, p);
        float big = Math.max(r.width(), r.height());
        for (Blob b : blobs) {
            float cx = r.left + b.x * r.width();
            float cy = r.top + b.y * r.height();
            int mid = (b.color & 0x00FFFFFF) | ((int) (Color.alpha(b.color) * 0.45f) << 24);
            p.setShader(new RadialGradient(cx, cy, Math.max(1, b.r * big),
                new int[] { b.color, mid, b.color & 0x00FFFFFF }, new float[] { 0f, 0.5f, 1f }, Shader.TileMode.CLAMP));
            c.drawRect(r, p);
        }
        // Film grain keeps the gradients from banding and gives the frosted feel.
        p.setShader(new BitmapShader(grain(), Shader.TileMode.REPEAT, Shader.TileMode.REPEAT));
        p.setAlpha((int) (255 * grainAlpha));
        c.drawRect(r, p);
        p.setAlpha(255);
        // Light from above, a little weight below.
        p.setShader(new LinearGradient(0, r.top, 0, r.top + r.height() * 0.45f, 0x24FFFFFF, 0x00FFFFFF, Shader.TileMode.CLAMP));
        c.drawRect(r, p);
        p.setShader(new LinearGradient(0, r.bottom - r.height() * 0.4f, 0, r.bottom, 0x00000000, 0x24000000, Shader.TileMode.CLAMP));
        c.drawRect(r, p);
        c.restore();
        // Lit edge, brightest at the top.
        p.setShader(new LinearGradient(0, r.top, 0, r.bottom, 0x52FFFFFF, 0x0FFFFFFF, Shader.TileMode.CLAMP));
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(px(1));
        float in = px(0.5f);
        c.drawRoundRect(new RectF(r.left + in, r.top + in, r.right - in, r.bottom - in), rad - in, rad - in, p);
        p.setShader(null);
        p.setStyle(Paint.Style.FILL);
    }

    private static synchronized Bitmap grain() {
        if (grain != null) return grain;
        int n = 160;
        Bitmap b = Bitmap.createBitmap(n, n, Bitmap.Config.ARGB_8888);
        Random rnd = new Random(7);
        int[] px = new int[n * n];
        for (int i = 0; i < px.length; i++) {
            int v = rnd.nextInt(256);
            px[i] = Color.argb(255, v, v, v);
        }
        b.setPixels(px, 0, n, 0, 0, n, n);
        grain = b;
        return b;
    }

    // ── type ────────────────────────────────────────────────────────────────────────────────

    /** Draws text with its baseline at y; returns its width in dp. */
    float text(String s, float x, float y, Typeface tf, float size, int color, Paint.Align align) {
        return text(s, x, y, tf, size, color, align, 0f);
    }

    float text(String s, float x, float y, Typeface tf, float size, int color, Paint.Align align, float tracking) {
        prepText(tf, size, color, align, tracking);
        c.drawText(s, px(x), px(y), p);
        return p.measureText(s) / k;
    }

    /**
     * Dot-matrix numerals (Doto). Doto's "." is a cross of dots, so the decimal point is drawn as
     * one round dot instead. Returns the width in dp.
     */
    float dots(String s, float x, float y, float size, int color, Paint.Align align) {
        int i = s.indexOf('.');
        float gap = size * 0.34f;
        float total = i < 0 ? measure(s, doto, size, 0f)
            : measure(s.substring(0, i), doto, size, 0f) + gap + measure(s.substring(i + 1), doto, size, 0f);
        float left = align == Paint.Align.CENTER ? x - total / 2 : align == Paint.Align.RIGHT ? x - total : x;
        if (i < 0) return text(s, left, y, doto, size, color, Paint.Align.LEFT);
        float a = text(s.substring(0, i), left, y, doto, size, color, Paint.Align.LEFT);
        p.reset();
        p.setAntiAlias(true);
        p.setColor(color);
        float r = size * 0.055f;
        c.drawCircle(px(left + a + gap / 2), px(y - r), px(r), p);
        text(s.substring(i + 1), left + a + gap, y, doto, size, color, Paint.Align.LEFT);
        return total;
    }

    float dotsWidth(String s, float size) {
        int i = s.indexOf('.');
        return i < 0 ? measure(s, doto, size, 0f)
            : measure(s.substring(0, i), doto, size, 0f) + size * 0.34f + measure(s.substring(i + 1), doto, size, 0f);
    }

    float measure(String s, Typeface tf, float size, float tracking) {
        prepText(tf, size, 0, Paint.Align.LEFT, tracking);
        return p.measureText(s) / k;
    }

    /** Largest size (up to `max`) at which `s` fits in `width`. */
    float fit(String s, Typeface tf, float max, float width) {
        float m = measure(s, tf, max, 0f);
        return m <= width ? max : max * width / m;
    }

    /** Text cut with an ellipsis to fit `width`. */
    String clip(String s, Typeface tf, float size, float width) {
        if (measure(s, tf, size, 0f) <= width) return s;
        while (s.length() > 1 && measure(s + "…", tf, size, 0f) > width) s = s.substring(0, s.length() - 1);
        return s.trim() + "…";
    }

    private void prepText(Typeface tf, float size, int color, Paint.Align align, float tracking) {
        p.reset();
        p.setAntiAlias(true);
        p.setSubpixelText(true);
        p.setTypeface(tf);
        p.setTextSize(px(size));
        p.setColor(color);
        p.setTextAlign(align);
        p.setLetterSpacing(tracking);
    }

    // ── marks ───────────────────────────────────────────────────────────────────────────────

    /** White disc with a thin plus, as on the reference cards. */
    void plus(float cx, float cy, float r, int ink) {
        p.reset();
        p.setAntiAlias(true);
        p.setColor(0x26000000);
        p.setMaskFilter(new BlurMaskFilter(px(6), BlurMaskFilter.Blur.NORMAL));
        c.drawCircle(px(cx), px(cy + 2), px(r), p);
        p.setMaskFilter(null);
        p.setColor(0xF2FFFFFF);
        c.drawCircle(px(cx), px(cy), px(r), p);
        p.setColor(ink);
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(px(1.6f));
        p.setStrokeCap(Paint.Cap.ROUND);
        float a = r * 0.36f;
        c.drawLine(px(cx - a), px(cy), px(cx + a), px(cy), p);
        c.drawLine(px(cx), px(cy - a), px(cx), px(cy + a), p);
        p.setStyle(Paint.Style.FILL);
    }

    /** A frosted round button with a plus (for buttons on top of tiles). */
    void plusGlass(float cx, float cy, float r) {
        p.reset();
        p.setAntiAlias(true);
        p.setColor(0x2EFFFFFF);
        c.drawCircle(px(cx), px(cy), px(r), p);
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(px(1));
        p.setColor(0x40FFFFFF);
        c.drawCircle(px(cx), px(cy), px(r - 0.5f), p);
        p.setColor(0xE6FFFFFF);
        p.setStrokeWidth(px(1.5f));
        p.setStrokeCap(Paint.Cap.ROUND);
        float a = r * 0.38f;
        c.drawLine(px(cx - a), px(cy), px(cx + a), px(cy), p);
        c.drawLine(px(cx), px(cy - a), px(cx), px(cy + a), p);
        p.setStyle(Paint.Style.FILL);
    }

    /** Ruler of ticks; ticks up to `progress` are lit and a tall marker shows where it stands. */
    void ruler(float x, float y, float width, float height, float progress) {
        progress = Math.max(0f, Math.min(1f, progress));
        int n = Math.max(12, (int) (width / 5.2f));
        float step = width / (n - 1);
        int at = Math.round(progress * (n - 1));
        p.reset();
        p.setAntiAlias(true);
        p.setStrokeCap(Paint.Cap.ROUND);
        for (int i = 0; i < n; i++) {
            boolean major = i % 5 == 0;
            float th = major ? height * 0.62f : height * 0.4f;
            float tx = x + i * step;
            p.setStrokeWidth(px(1));
            p.setColor(i <= at ? 0x99FFFFFF : 0x40FFFFFF);
            if (i == at) continue;
            c.drawLine(px(tx), px(y + height - th), px(tx), px(y + height), p);
        }
        p.setStrokeWidth(px(2.2f));
        p.setColor(0xFFFFFFFF);
        float mx = x + at * step;
        c.drawLine(px(mx), px(y), px(mx), px(y + height), p);
    }

    /**
     * A dot-matrix bar strip: `values` (0..1) become columns of dots `rows` high. Columns at or
     * before `lit` are bright, the rest faint, like the reference score strip.
     */
    void dotBars(float x, float y, float width, float height, float[] values, int lit) {
        int cols = values.length;
        float gap = width / cols;
        int rows = Math.max(3, (int) (height / gap));
        float rowGap = height / rows;
        float r = Math.min(gap, rowGap) * 0.24f;
        p.reset();
        p.setAntiAlias(true);
        for (int i = 0; i < cols; i++) {
            int on = Math.max(1, Math.round(values[i] * rows));
            for (int j = 0; j < rows; j++) {
                boolean filled = j < on;
                int col = !filled ? 0x14FFFFFF : i <= lit ? 0xE6FFFFFF : 0x40FFFFFF;
                p.setColor(col);
                c.drawCircle(px(x + gap * (i + 0.5f)), px(y + height - rowGap * (j + 0.5f)), px(r), p);
            }
        }
    }

    /** A dot progress strip, `rows` high, lit left to right up to `progress`. */
    void dotMeter(float x, float y, float width, int rows, float progress, int on) {
        float gap = 5.5f;
        int cols = Math.max(4, (int) (width / gap));
        int lit = Math.round(Math.max(0f, Math.min(1f, progress)) * cols);
        p.reset();
        p.setAntiAlias(true);
        for (int i = 0; i < cols; i++) {
            for (int j = 0; j < rows; j++) {
                p.setColor(i < lit ? on : 0x1FFFFFFF);
                c.drawCircle(px(x + gap * (i + 0.5f)), px(y + gap * (j + 0.5f)), px(1.15f), p);
            }
        }
    }

    /** Concentric target rings with a bright centre, like the tracker card. */
    void target(float cx, float cy, float r, int core) {
        p.reset();
        p.setAntiAlias(true);
        p.setStyle(Paint.Style.STROKE);
        float[] rings = { 1f, 0.74f, 0.5f };
        int[] alpha = { 0x1F, 0x33, 0x52 };
        for (int i = 0; i < rings.length; i++) {
            p.setStrokeWidth(px(1));
            p.setColor(alpha[i] << 24 | 0xFFFFFF);
            c.drawCircle(px(cx), px(cy), px(r * rings[i]), p);
        }
        p.setStyle(Paint.Style.FILL);
        p.setColor(0x33FFFFFF);
        p.setMaskFilter(new BlurMaskFilter(px(r * 0.3f), BlurMaskFilter.Blur.NORMAL));
        c.drawCircle(px(cx), px(cy), px(r * 0.34f), p);
        p.setMaskFilter(null);
        p.setColor(0xFFFFFFFF);
        c.drawCircle(px(cx), px(cy), px(r * 0.2f), p);
        p.setColor(core);
        c.drawCircle(px(cx), px(cy), px(r * 0.11f), p);
    }

    /** A row of overlapping outlined ovals that swell toward the middle. */
    void ripples(float cx, float cy, float width, float height) {
        int n = 11;
        p.reset();
        p.setAntiAlias(true);
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(px(1));
        float step = width / n;
        for (int i = 0; i < n; i++) {
            float t = 1f - Math.abs(i - (n - 1) / 2f) / ((n - 1) / 2f);
            float ow = step * (0.9f + t * 0.9f);
            float oh = height * (0.55f + t * 0.45f);
            float x = cx - width / 2 + step * (i + 0.5f);
            p.setColor(((int) (0x30 + t * 0x90)) << 24 | 0xFFFFFF);
            c.drawOval(sc(new RectF(x - ow / 2, cy - oh / 2, x + ow / 2, cy + oh / 2)), p);
        }
        p.setStyle(Paint.Style.FILL);
    }

    /** A small line icon drawn from simple strokes: "drop", "leaf", "fork". */
    void icon(String name, float cx, float cy, float size, int color) {
        p.reset();
        p.setAntiAlias(true);
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(px(1.3f));
        p.setStrokeCap(Paint.Cap.ROUND);
        p.setStrokeJoin(Paint.Join.ROUND);
        p.setColor(color);
        float s = size / 2;
        Path path = new Path();
        if ("drop".equals(name)) {
            path.moveTo(px(cx), px(cy - s));
            path.cubicTo(px(cx + s * 0.9f), px(cy - s * 0.05f), px(cx + s * 0.75f), px(cy + s), px(cx), px(cy + s));
            path.cubicTo(px(cx - s * 0.75f), px(cy + s), px(cx - s * 0.9f), px(cy - s * 0.05f), px(cx), px(cy - s));
        } else if ("leaf".equals(name)) {
            path.moveTo(px(cx - s * 0.8f), px(cy + s * 0.8f));
            path.cubicTo(px(cx - s), px(cy - s * 0.6f), px(cx + s * 0.2f), px(cy - s), px(cx + s * 0.85f), px(cy - s * 0.85f));
            path.cubicTo(px(cx + s), px(cy + s * 0.2f), px(cx + s * 0.1f), px(cy + s), px(cx - s * 0.8f), px(cy + s * 0.8f));
            path.lineTo(px(cx + s * 0.2f), px(cy - s * 0.2f));
        } else {
            path.addCircle(px(cx), px(cy), px(s * 0.85f), Path.Direction.CW);
        }
        c.drawPath(path, p);
        p.setStyle(Paint.Style.FILL);
    }

    /** Outline circle frame around an icon, as on the reference tiles. */
    void ring(float cx, float cy, float r) {
        p.reset();
        p.setAntiAlias(true);
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(px(1));
        p.setColor(0x4DFFFFFF);
        c.drawCircle(px(cx), px(cy), px(r), p);
        p.setStyle(Paint.Style.FILL);
    }

    private RectF sc(RectF dp) {
        return new RectF(px(dp.left), px(dp.top), px(dp.right), px(dp.bottom));
    }
}
