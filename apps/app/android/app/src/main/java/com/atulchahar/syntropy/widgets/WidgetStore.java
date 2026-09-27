package com.atulchahar.syntropy.widgets;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Shared state between the app and the home-screen widgets. The app writes a snapshot after
 * every change; widget taps (water, quick add) are queued here and collected by the app on resume.
 */
public final class WidgetStore {

    private static final String PREFS = "syntropy_widgets";
    private static final Class<?>[] PROVIDERS = { TodayWidget.class, WaterWidget.class, ScanWidget.class, QuickAddWidget.class };

    private WidgetStore() {}

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static JSONObject snapshot(Context c) {
        try {
            return new JSONObject(prefs(c).getString("snapshot", "{}"));
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    public static void saveSnapshot(Context c, String json) {
        prefs(c).edit().putString("snapshot", json).apply();
        refreshAll(c);
    }

    public static synchronized void addWater(Context c, int ml) {
        SharedPreferences p = prefs(c);
        JSONObject s = snapshot(c);
        try {
            s.put("waterMl", s.optInt("waterMl", 0) + ml);
        } catch (Exception ignored) {}
        p.edit().putInt("pendingWater", p.getInt("pendingWater", 0) + ml).putString("snapshot", s.toString()).apply();
        refreshAll(c);
    }

    public static synchronized void addFood(Context c, String foodId, int kcal) {
        SharedPreferences p = prefs(c);
        JSONObject s = snapshot(c);
        try {
            JSONArray q = new JSONArray(p.getString("pendingFoods", "[]"));
            q.put(foodId);
            s.put("kcalEaten", s.optInt("kcalEaten", 0) + kcal);
            s.put("kcalLeft", s.optInt("kcalLeft", 0) - kcal);
            p.edit().putString("pendingFoods", q.toString()).putString("snapshot", s.toString()).apply();
        } catch (Exception ignored) {}
        refreshAll(c);
    }

    public static synchronized int takeWater(Context c) {
        SharedPreferences p = prefs(c);
        int ml = p.getInt("pendingWater", 0);
        p.edit().putInt("pendingWater", 0).apply();
        return ml;
    }

    public static synchronized JSONArray takeFoods(Context c) {
        SharedPreferences p = prefs(c);
        try {
            JSONArray q = new JSONArray(p.getString("pendingFoods", "[]"));
            p.edit().putString("pendingFoods", "[]").apply();
            return q;
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    public static void refreshAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        for (Class<?> cls : PROVIDERS) {
            int[] ids = m.getAppWidgetIds(new ComponentName(c, cls));
            if (ids.length == 0) continue;
            Intent i = new Intent(c, cls);
            i.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            i.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            c.sendBroadcast(i);
        }
    }
}
