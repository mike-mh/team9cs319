package com.example.michael.mqtttest;

import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.BatteryManager;
import android.os.IBinder;
import android.os.BatteryManager;
import android.support.annotation.Nullable;

import org.eclipse.paho.android.service.MqttAndroidClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.UnsupportedEncodingException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;

import javax.crypto.BadPaddingException;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;

import static java.util.concurrent.TimeUnit.*;

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
    public static long publishRateMilliSec = 0;

    /* Use this to lock out connection attempts */
    public static boolean isConnecting = false;



    private long lastTimeCheck = System.currentTimeMillis();
    private MqttAndroidClient client;
    private int delayValue = 0;
    private String androidId = "NOTHING";
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private String hostIp;
    SensorEventListener accelerationListener;
    private Encryptor encryptor = new Encryptor();

    // This object is responsible
    private final ScheduledExecutorService publicationScheduler =
            Executors.newScheduledThreadPool(1);

    // The acceleration values read form the device. Change each time an
    // acceleration event occurs.
    private float xAcceleration = 0;
    private float yAcceleration = 0;
    private float zAcceleration = 0;

    // These variables are used for the gravity low-pass filter
    private float[] gravity = { 0 , 0 , 0};
    private final float alpha = (float) 0.8;

    // This variable holds the current battery life remaining as a percentage
    private float batteryLife = (float) 0.0;

    // More constants (probably should store in a class)
    private static final String TCP_PREFIX = "tcp://";

    private static final String DEVICE_ID_INTENT_EXTRA = "AndroidId";
    private static final String HOST_IP_INTENT_EXTRA = "hostIp";
    private static final String SPEED_SETTING_INTENT_EXTRA = "userSpeedInput";

    private static final String NO_IP_ADDRESS_FOUND = "NO ADDRESS FOUND";
    private static final String NO_ANDROID_ID_FOUND = "NO DATA";
    private static final int NO_USER_SPEED_INPUT = 0;

    private static final String WATCH_ID_JSON_INDEX = "watch_id";
    private static final String TIMESTAMP_JSON_INDEX = "timestamp";
    private static final String PUBLISH_RATE_JSON_INDEX = "publish_rate";
    private static final String BATTERY_PERCENTAGE_JSON_INDEX = "battery";
    private static final String ACC_X_JSON_INDEX = "acc_x";
    private static final String ACC_Y_JSON_INDEX = "acc_y";
    private static final String ACC_Z_JSON_INDEX = "acc_z";

    // This should change
    private static final String MQTT_ACCELERATION_CHANNEL = "$SYS";

    private static final int X_ACCELERATION_INDEX = 0;
    private static final int Y_ACCELERATION_INDEX = 1;
    private static final int Z_ACCELERATION_INDEX = 2;

    // Set the battery level receiver
    private BroadcastReceiver batteryLevelReceiver = new BroadcastReceiver() {

        /**
         * @desc - This method is responsible for receiving broadcasts from the
         *         Android Broadcast Actions and analyze battery data to
         *         calculate the percentage of battery life remaining.
         */
        @Override
        public void onReceive(Context context, Intent intent) {
            int currentLevel = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            if (currentLevel >= 0 && scale > 0) {
                batteryLife = currentLevel / (float) scale;
            }
        }
    }; 

    private IntentFilter batteryLevelFilter =
      new IntentFilter(Intent.ACTION_BATTERY_CHANGED);

    private static final int FASTEST_PUBLICATION_RATE = 200;

    // These are the threading components.
    private ScheduledFuture publicationHandle;
    private final Runnable publishData = new Runnable() {

        @Override
        /**
         * @desc - This is the work horse for broadcasting data and connecting
         *         the application to DCH. If a connection has not been
         *         established, or it has yet to establish a connection, it
         *         attempt to create a connection to the specified IP address
         *         and port until it is successful. After a conneciton is
         *         established, it will broadcast the acceleration data stored
         *         in this class in perpetuity at the pre-set intercal.
         */
        public void run() {

            if (client.isConnected()) {
                String data = "";

                // Calculate the rate between publish events
                long currentTimeMilliseconds = System.currentTimeMillis();
                publishRateMilliSec = currentTimeMilliseconds - lastTimeCheck;
                lastTimeCheck = currentTimeMilliseconds;

                JSONObject accelerationJson = new JSONObject();

                try {
                    accelerationJson.put(WATCH_ID_JSON_INDEX, androidId);

                    accelerationJson.put(ACC_X_JSON_INDEX,
                            xAcceleration);

                    accelerationJson.put(ACC_Y_JSON_INDEX,
                            yAcceleration);

                    accelerationJson.put(ACC_Z_JSON_INDEX,
                            zAcceleration);

                    accelerationJson.put(TIMESTAMP_JSON_INDEX,
                            currentTimeMilliseconds);

                    accelerationJson.put(BATTERY_PERCENTAGE_JSON_INDEX,
                            batteryLife);

                    accelerationJson.put(PUBLISH_RATE_JSON_INDEX,
                            publishRateMilliSec);

                    // Convert JSON to string and publish
                    data = accelerationJson.toString();
                    MQTTPublishHandler callback = new MQTTPublishHandler();

                    byte[] accelerationDataPayload = encryptor.encryptData(data);

                    client.publish(MQTT_ACCELERATION_CHANNEL,
                            accelerationDataPayload,
                            0,
                            false,
                            null,
                            callback);

                } catch (JSONException e) {
                    e.printStackTrace();
                } catch (MqttException e) {
                    e.printStackTrace();
                } catch (InvalidAlgorithmParameterException e) {
                    e.printStackTrace();
                } catch (InvalidKeyException e) {
                    e.printStackTrace();
                } catch (UnsupportedEncodingException e) {
                    e.printStackTrace();
                } catch (InvalidKeySpecException e) {
                    e.printStackTrace();
                } catch (BadPaddingException e) {
                    e.printStackTrace();
                } catch (NoSuchAlgorithmException e) {
                    e.printStackTrace();
                } catch (IllegalBlockSizeException e) {
                    e.printStackTrace();
                } catch (NoSuchPaddingException e) {
                    e.printStackTrace();
                }
            } else {

                    // Use the connecting flag to ensure that the client is
                    // not attempting a connection while another thread is
                    // trying to do so.
                if(!BroadcastService.isConnecting) {
                    BroadcastService.isConnecting = true;
                    try{
                        MQTTConnectionHandler callback =
                                new MQTTConnectionHandler();

                        client.connect(null, callback);
                    } catch (MqttException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    };

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

        // Ensure that the connection lock is reset
        isConnecting = false;

        client = new MqttAndroidClient(this, TCP_PREFIX + hostIp, androidId);

        sensorManager = (SensorManager) getApplicationContext()
                .getSystemService(SENSOR_SERVICE);
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        accelerationListener = new AccelerationListener();
        sensorManager.registerListener(accelerationListener,
                accelerometer,
                SensorManager.SENSOR_DELAY_NORMAL);

        // Register receiver for battery data from the Android device
        this.registerReceiver(batteryLevelReceiver, batteryLevelFilter);

        // Create new thread to boradcast data
        publicationHandle = publicationScheduler.scheduleAtFixedRate(
                                publishData,
                                0,
                                (FASTEST_PUBLICATION_RATE +
                                    delayValue * FASTEST_PUBLICATION_RATE),
                                MILLISECONDS);

        return START_STICKY;
    }

    @Override
    /**
     * @desc - This method is called every time BroadcastService is
     *         destroyed. When this occurs, the broadcastServiceIsRunning flag
     *         should be disabled and the accelerationListener unregistered.
     */
    public void onDestroy() {
        if(client != null) {
            client.unregisterResources();
        }
        broadcastServiceIsRunning = false;
        this.unregisterReceiver(batteryLevelReceiver);
        publicationHandle.cancel(true);
        sensorManager.unregisterListener(accelerationListener);
        super.onDestroy();
    }

    /**
     * @desc - This class is responsible for updating the acceleraiton values
     *         stored in the class. It is also responsible for filtering out
     *         gravity data from these values using a low-pass filter.
     */
    public class AccelerationListener implements SensorEventListener {

        private SensorEvent event;

        @Override
        public void onSensorChanged(SensorEvent event) {
            this.event = event;

            if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {


                    // Isolate the force of gravity with the low-pass filter.
                    gravity[0] = alpha * gravity[0] + (1 - alpha) * event.values[X_ACCELERATION_INDEX];
                    gravity[1] = alpha * gravity[1] + (1 - alpha) * event.values[Y_ACCELERATION_INDEX];
                    gravity[2] = alpha * gravity[2] + (1 - alpha) * event.values[Z_ACCELERATION_INDEX];

                    xAcceleration = event.values[X_ACCELERATION_INDEX] - gravity[0];
                    yAcceleration = event.values[Y_ACCELERATION_INDEX] - gravity[1];
                    zAcceleration = event.values[Z_ACCELERATION_INDEX] - gravity[2];
            }
        }

        @Override
        // Comes with SensorEventListener. Not needed.
        public void onAccuracyChanged(Sensor sensor, int accuracy) {
            // Do nothing
        }

    }
}
