package com.atulchahar.syntropy.widgets;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.Toast;

/** Handles widget taps that should not open the app (water, quick add). */
public class WidgetActions extends BroadcastReceiver {

    public static final String ADD_WATER = "com.atulchahar.syntropy.ADD_WATER";
    public static final String ADD_FOOD = "com.atulchahar.syntropy.ADD_FOOD";

    @Override
    public void onReceive(Context c, Intent i) {
        if (ADD_WATER.equals(i.getAction())) {
            int ml = i.getIntExtra("ml", 250);
            WidgetStore.addWater(c, ml);
            Toast.makeText(c, "+" + ml + " ml water", Toast.LENGTH_SHORT).show();
        } else if (ADD_FOOD.equals(i.getAction())) {
            String id = i.getStringExtra("food");
            String name = i.getStringExtra("name");
            WidgetStore.addFood(c, id, i.getIntExtra("kcal", 0));
            Toast.makeText(c, "Added " + name + " to your last meal", Toast.LENGTH_SHORT).show();
        }
    }

    static PendingIntent water(Context c, int ml) {
        Intent i = new Intent(c, WidgetActions.class).setAction(ADD_WATER).putExtra("ml", ml);
        return PendingIntent.getBroadcast(c, 100 + ml, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static PendingIntent food(Context c, int code, String id, String name, int kcal) {
        Intent i = new Intent(c, WidgetActions.class).setAction(ADD_FOOD).putExtra("food", id).putExtra("name", name).putExtra("kcal", kcal);
        return PendingIntent.getBroadcast(c, 200 + code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Opens the app at a route through the syntropy:// deep link. */
    static PendingIntent open(Context c, String route) {
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("syntropy://" + route)).setPackage(c.getPackageName());
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(c, route.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
