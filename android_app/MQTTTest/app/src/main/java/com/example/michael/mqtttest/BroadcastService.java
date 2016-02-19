package com.example.michael.mqtttest;

import android.app.Service;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.IBinder;
import android.support.annotation.Nullable;
import android.widget.SeekBar;

import org.eclipse.paho.android.service.MqttAndroidClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.json.JSONException;
import org.json.JSONObject;

import java.sql.Timestamp;
import java.util.Date;

/**
 * Created by michael on 17/02/16.
 */
public class BroadcastService extends Service {
    /* Use this to determine if the service is running */
    public static Boolean broadcastServiceIsRunning = false;

    /* Use this to show the connection status */
    public static String connectionStatus = "Disconnected";

    /* Use this to show the publish rate */
    public static long publishRateMilliSec = 0;


    private int tickAccumulator = 0;
    private long lastTimeCheck = System.currentTimeMillis();
    private MqttAndroidClient client;
    private int delayValue = 0;
    private String androidId = "NOTHING";
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private String hostIp;
    SensorEventListener accelerationListener;


    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // TODO Auto-generated method stub

        broadcastServiceIsRunning = true;

        androidId = (intent != null) ?
                intent.getStringExtra("AndroidId") :
                "NO DATA";

        hostIp = (intent != null) ?
                intent.getStringExtra("hostIp") :
                "NO ADDRESS FOUND";

        delayValue = (intent != null) ?
                intent.getIntExtra("userSpeedInput", 0) :
                0;


        client = new MqttAndroidClient(this, "tcp://" + hostIp, "testing");

        sensorManager = (SensorManager) getApplicationContext()
                .getSystemService(SENSOR_SERVICE);
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        accelerationListener = new AccelerationListener();
        sensorManager.registerListener(accelerationListener, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        // TODO Auto-generated method stub
        broadcastServiceIsRunning = false;

        sensorManager.unregisterListener(accelerationListener);
        super.onDestroy();
    }

    public class AccelerationListener implements SensorEventListener {

        private SensorEvent event;

        @Override
        public void onSensorChanged(SensorEvent event) {
            this.event = event;
            // TODO Auto-generated method stub
            if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
                if(tickAccumulator++ % (delayValue * 5 + 1) != 0) {
                    return;
                }

                if (client.isConnected()) {
                    String data = "";
                    long currentTimeMilliseconds = System.currentTimeMillis();
                    publishRateMilliSec = currentTimeMilliseconds - lastTimeCheck;
                    lastTimeCheck = currentTimeMilliseconds;
                    //Date currentTimestamp = new Timestamp(System.currentTimeMillis());
                    //String timeData = currentTimestamp.toString();
                    JSONObject accelerationJson = new JSONObject();

                    try {
                        accelerationJson.put("watch_id", androidId);
                        accelerationJson.put("acc_x", this.event.values[0]);
                        accelerationJson.put("acc_y", this.event.values[1]);
                        accelerationJson.put("acc_z", this.event.values[2]);
                        accelerationJson.put("timestamp", currentTimeMilliseconds);
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                    try {
                        data = accelerationJson.toString();
                        MQTTPublishHandler callback = new MQTTPublishHandler();
                        client.publish("$SYS", data.getBytes(), 0, false, null, callback);
                    } catch (MqttException e) {
                        e.printStackTrace();
                    }
                } else {
                    try {
                        MQTTConnectionHandler callback = new MQTTConnectionHandler();
                        client.connect(null, callback);
                    } catch (MqttException e) {
                        e.printStackTrace();
                    }
                }
            }
        }

        @Override
        public void onAccuracyChanged(Sensor sensor, int accuracy) {

        }

    }
}
