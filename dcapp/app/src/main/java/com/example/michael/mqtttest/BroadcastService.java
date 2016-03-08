package com.example.michael.mqtttest;

import android.app.Service;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.IBinder;
import android.support.annotation.Nullable;

import org.eclipse.paho.android.service.MqttAndroidClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.*;
import java.util.concurrent.TimeUnit;
import android.util.Log;
import java.util.concurrent.ScheduledExecutorService;


/**
 * @desc - This is the work horse for acceleration data broadcasting. When
 *         this service is run,it will attempt to connect to an MQTT broker at
 *         the IP address provided by the activity calling this service. The
 *         AccelerationListener class in this service is responsible for
 *         calling the 'publish' method of the MQTT client to send data to the
 *         MQTT broker. The acceleration listener is also responsible for
 *         detecting when the device is disconnected and perpetually
 *         attempting to re-establish connection.
 *
 *         TO-DO:
 *         We should consider moving the responsibility of publishing data
 *         from the AccelerationListener to a running thread that triggers a
 *         publish event in discrete time and have the AccelerationListener
 *         change the values published rather than tirggering publications on
 *         acceleration events based on a delay
 */
public class BroadcastService extends Service {
    /* Use this to determine if the service is running */
    public static Boolean broadcastServiceIsRunning = false;

    /* Use this to show the connection status */
    public static String connectionStatus = "Disconnected";

    /* Use this to show the publish rate */
    public static long publishRateMilliSec = 5000;


    // Use this to enable delays
    private int tickAccumulator = 0;
    private long lastTimeCheck = System.currentTimeMillis();
    private MqttAndroidClient client;
    private int delayValue = 0;
    private String androidId = "NOTHING";
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private String hostIp;
    SensorEventListener accelerationListener;

    // More constants (probably should store in a class)
    private JSONObject accelerationJson;
    private static final String TCP_PREFIX = "tcp://";

    private static final String DEVICE_ID_INTENT_EXTRA = "AndroidId";
    private static final String HOST_IP_INTENT_EXTRA = "hostIp";
    private static final String SPEED_SETTING_INTENT_EXTRA = "userSpeedInput";

    private static final String NO_IP_ADDRESS_FOUND = "NO ADDRESS FOUND";
    private static final String NO_ANDROID_ID_FOUND = "NO DATA";
    private static final int NO_USER_SPEED_INPUT = 0;

    private static final String WATCH_ID_JSON_INDEX = "watch_id";
    private static final String TIMESTAMP_JSON_INDEX = "timestamp";
    private static final String ACC_X_JSON_INDEX = "acc_x";
    private static final String ACC_Y_JSON_INDEX = "acc_y";
    private static final String ACC_Z_JSON_INDEX = "acc_z";

    // This should change
    private static final String MQTT_ACCELERATION_CHANNEL = "$SYS";

    private static final int X_ACCELERATION_INDEX = 0;
    private static final int Y_ACCELERATION_INDEX = 1;
    private static final int Z_ACCELERATION_INDEX = 2;

    @Nullable
    @Override
    // Comes with Service class. Not needed.
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    /**
     * @desc - This method is called every time BroadcastService is
     *         initialized. This method will set all the IP address, device ID
     *         and delay settings based on data retrieved from the calling
     *         activity. This method will then register an acceleration
     *         listener based on the AccelerationListener class below. Also
     *         sets the broadcastServiceIsRunning flag to alert activities
     *         the service is active.
     *
     * @return - This method returns 'STAR_STICKY' to indicate that the the
     *         system should attempt to recreate the service if the process is
     *         killed.
     */
    public int onStartCommand(Intent intent, int flags, int startId) {

        broadcastServiceIsRunning = true;

        // Intent becomes null when DCAPP closes. Need to make sure intent is
        // not null to prevent crash from accessing unset extras
        androidId = (intent != null) ?
                intent.getStringExtra(DEVICE_ID_INTENT_EXTRA) :
                NO_ANDROID_ID_FOUND;

        hostIp = (intent != null) ?
                intent.getStringExtra(HOST_IP_INTENT_EXTRA) :
                NO_IP_ADDRESS_FOUND;

        delayValue = (intent != null) ?
                intent.getIntExtra(SPEED_SETTING_INTENT_EXTRA, 0) :
                NO_USER_SPEED_INPUT;

        client = new MqttAndroidClient(this, TCP_PREFIX + hostIp, androidId);

        sensorManager = (SensorManager) getApplicationContext()
                .getSystemService(SENSOR_SERVICE);
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        accelerationListener = new AccelerationListener();
        sensorManager.registerListener(accelerationListener,
                accelerometer,
                SensorManager.SENSOR_DELAY_NORMAL);

        //Scheduled to publish data at a fixed rate even when no change are made to data (device not moving)
        ScheduledExecutorService scheduler =
                Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(new Runnable() {

            public void run() {
                Log.i("publishMQTT", "publish!");
                publishMQTT();
            }
        }, 5000, publishRateMilliSec, TimeUnit.MILLISECONDS);


        return START_STICKY;
    }


    public void publishMQTT(){
        if (client.isConnected()) {
            String data = "";

            // Calculate the rate between publish events
            long currentTimeMilliseconds = System.currentTimeMillis();
            publishRateMilliSec = currentTimeMilliseconds - lastTimeCheck;
            lastTimeCheck = currentTimeMilliseconds;

            try {
                accelerationJson.put(TIMESTAMP_JSON_INDEX,
                        currentTimeMilliseconds);

            } catch (JSONException e) {
                e.printStackTrace();
            }
            try {

                // Convert JSON to string and publish
                data = accelerationJson.toString();
                MQTTPublishHandler callback = new MQTTPublishHandler();

                client.publish(MQTT_ACCELERATION_CHANNEL,
                        data.getBytes(),
                        0,
                        false,
                        null,
                        callback);

            } catch (MqttException e) {
                e.printStackTrace();
            }
        } else {
            try {

                MQTTConnectionHandler callback =
                        new MQTTConnectionHandler();

                client.connect(null, callback);

            } catch (MqttException e) {
                e.printStackTrace();
            }
        }
    }



    @Override
    /**
     * @desc - This method is called every time BroadcastService is
     *         destroyed. When this occurs, the broadcastServiceIsRunning flag
     *         should be disabled and the accelerationListener unregistered.
     */
    public void onDestroy() {
        broadcastServiceIsRunning = false;

        sensorManager.unregisterListener(accelerationListener);
        super.onDestroy();
    }

    /**
     * @desc - This class is responsible for ensuring a connection is
     *         established with the MQTT broker and publishing data to the
     *         MQTT broker as a JSON on each acceleration event. Delays
     *         between broadcasts are calculated based on input from the
     *         user which will kill the function before publishing data
     *         if insufficient time has elapsed.
     *
     *         NOTE: See description for BroadcastService above. We should
     *         change this in the future.
     */
    public class AccelerationListener implements SensorEventListener {

        private SensorEvent event;

        @Override
        public void onSensorChanged(SensorEvent event) {
            this.event = event;

            if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
                // Kill function if not enough time has elapsed between
                // acceleration events (Should re-work this)
                if(tickAccumulator++ % (delayValue * 5 + 1) != 0) {
                    return;
                }

                // If client is connected, publish data. Otherwise, attempt
                // to connect client.
                    String data = "";

                    // Calculate the rate between publish events

                    accelerationJson = new JSONObject();

                    try {
                        accelerationJson.put(WATCH_ID_JSON_INDEX, androidId);

                        accelerationJson.put(ACC_X_JSON_INDEX,
                                event.values[X_ACCELERATION_INDEX]);

                        accelerationJson.put(ACC_Y_JSON_INDEX,
                                event.values[Y_ACCELERATION_INDEX]);

                        accelerationJson.put(ACC_Z_JSON_INDEX,
                                event.values[Z_ACCELERATION_INDEX]);


                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

            }
        }

        @Override
        // Comes with SensorEventListener. Not needed.
        public void onAccuracyChanged(Sensor sensor, int accuracy) {
            // Do nothing
        }

    }
}
