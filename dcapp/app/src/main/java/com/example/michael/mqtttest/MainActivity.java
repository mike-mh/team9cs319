package com.example.michael.mqtttest;

import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.telephony.TelephonyManager;
import android.text.InputType;
import android.widget.EditText;
import android.widget.SeekBar;
import android.widget.SeekBar.OnSeekBarChangeListener;
import android.widget.TextView;
import android.view.View;

/**
 * @desc - The main entry point into DCAPP. Is responsible for rendering the
 * user intreface that the user will interact with. The primary responsibility
 * of this activity is to initialize the BroadcastService and to pass data
 * from the user to the BroadcastService to either delay its publication rate or
 * change the IP address to connect to.
 *
 * When started, the activity displays an alert to the user and waits for the
 * user to input an IP address to pass into the broadcast service, The user
 * retains the abaility to change this address through the 'change address'
 * button.
 *
 * This activity also implements the SensorEventListener to allow it to
 * display acceleration data to the user in real time.
 */
public class MainActivity extends AppCompatActivity implements SensorEventListener {

    private MainActivity mainActivity = this;

    private Intent startBroadcastService;

    private String androidId;
    private TelephonyManager telephonyManager;

    private String hostIpAddress;
    private String connectionStatus;

    private int speedSetting = 0;
    private SeekBar speedControl;

    private TextView publishRateView;

    private TextView currentX;
    private TextView currentY;
    private TextView currentZ;

    private TextView hostIpView;
    private TextView connectionStatusView;

    private SensorManager sensorManager;
    private Sensor accelerometer;

    private float lastReadX = 0;
    private float lastReadY = 0;
    private float lastReadZ = 0;

    // Maybe we should consider making a constants class
    private static final String IP_NEEDED_ALERT_MESSAGE = "Please enter " +
            "the IP address of the host including the port. e.g. " +
            "'192.168.0.164:1883'";

    private static final String HOST_IP_DISPLAY_PREFIX = "Host IP: ";
    private static final String BROADCAST_RATE_DISPLAY_PREFIX =
            "PublishRate (ms): ";
    private static final String CONNECTION_DISPLAY_PREFIX =
            "Connection Status: ";

    private static final String CONFIRM_BUTTON_TEXT = "Confirm";
    private static final String CANCEL_BUTTON_TEXT = "Cancel";

    private static final String DEVICE_ID_INTENT_EXTRA = "AndroidId";
    private static final String HOST_IP_INTENT_EXTRA = "hostIp";
    private static final String SPEED_SETTING_INTENT_EXTRA = "userSpeedInput";

    private static final int X_ACCELERATION_INDEX = 0;
    private static final int Y_ACCELERATION_INDEX = 1;
    private static final int Z_ACCELERATION_INDEX = 2;


    @Override
    /**
     * @desc - This method is run each time MainActivity is initialized. It is
     *         responsible for initializing the BroadcastService, registering
     *         listeners for acceleration data in this activity to present to
     *         the user, and discovering the Android devices IMEI ID to send
     *         to the BroadcastService to publish with all outgoing data.
     *
     * @param savedInstanceState - Bundle containing the state of the calling
     *         activity. On initialization, this value is null.
     */
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Get IMEI ID for the current device
        final TelephonyManager telephonyManager = (TelephonyManager) getBaseContext().getSystemService(Context.TELEPHONY_SERVICE);
        androidId = ""+android.provider.Settings.Secure.getString(getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
        setContentView(R.layout.activity_main);

        initializeViews();

        // Register acceleration listeners to display data
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) != null) {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            sensorManager.registerListener(mainActivity,
                    accelerometer,
                    SensorManager.SENSOR_DELAY_NORMAL);
        }

        // Configure actions when user interacts with seek bar
        speedControl.setOnSeekBarChangeListener(new OnSeekBarChangeListener() {
            int progress = 0;

            @Override
            // User touches seekbar
            public void onProgressChanged(SeekBar seekBar, int progressValue, boolean fromUser) {
                progress = progressValue;
            }

            @Override
            // User is changing the current value on the seekbar
            public void onStartTrackingTouch(SeekBar seekBar) {
                // Do nothing
            }

            @Override
            // User changed seekbar value
            public void onStopTrackingTouch(SeekBar seekBar) {
                // Start BroadcastService and pass data via Intent
                if (progress != speedSetting) {
                    if(BroadcastService.broadcastServiceIsRunning) {
                        stopService(startBroadcastService);
                    }
                    startBroadcastService = new Intent(mainActivity, BroadcastService.class);
                    speedSetting = progress;
                    startBroadcastService.putExtra(DEVICE_ID_INTENT_EXTRA,
                            androidId);
                    startBroadcastService.putExtra(HOST_IP_INTENT_EXTRA,
                            hostIpAddress);
                    startBroadcastService.putExtra(SPEED_SETTING_INTENT_EXTRA,
                            speedSetting);
                    startService(startBroadcastService);

                    publishRateView.setText(BROADCAST_RATE_DISPLAY_PREFIX +
                            BroadcastService.publishRateMilliSec);
                }
            }
        });

        // Display alert menu to user to inpt IP address
        openIpDialogBox(this.findViewById(android.R.id.content));

    }

    /**
     * @desc - This method is called to request an IP address from the user.
     *         After the user inputs an IP address, the BroadcastService is
     *         reset and given a new IP address to connect to.
     */
    public void openIpDialogBox(View view) {
        // Build alert box and render it into view
        AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(this);
        alertDialogBuilder.setMessage(IP_NEEDED_ALERT_MESSAGE);
        final EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_TEXT);
        alertDialogBuilder.setView(input);

        // Register click events to dialog box buttons
        alertDialogBuilder.setPositiveButton(CONFIRM_BUTTON_TEXT, new DialogInterface.OnClickListener() {

            @Override
            // If the user changed the IP address snd hit the confitm button,
            // reset BoradcastService and pass in all relevant data.
            public void onClick(DialogInterface dialog, int which) {
                if(BroadcastService.broadcastServiceIsRunning) {
                    stopService(startBroadcastService);
                }
                hostIpAddress = input.getText().toString();
                startBroadcastService = new Intent(mainActivity, BroadcastService.class);
                startBroadcastService.putExtra(DEVICE_ID_INTENT_EXTRA,
                        androidId);
                startBroadcastService.putExtra(HOST_IP_INTENT_EXTRA,
                        hostIpAddress);
                startService(startBroadcastService);
                hostIpView.setText(HOST_IP_DISPLAY_PREFIX + hostIpAddress);
            }
        });

        // Close the dialogue box id user hits cancel
        alertDialogBuilder.setNegativeButton(CANCEL_BUTTON_TEXT, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.cancel();
            }
        });

        // Show dialogue box
        AlertDialog alertDialog = alertDialogBuilder.create();
        alertDialog.show();
    }

    /**
     * @desc - Initialize all views.
     */
    public void initializeViews() {
        currentX = (TextView) findViewById(R.id.currentX);
        currentY = (TextView) findViewById(R.id.currentY);
        currentZ = (TextView) findViewById(R.id.currentZ);

        hostIpView = (TextView) findViewById(R.id.hostIpAddress);
        connectionStatusView = (TextView) findViewById(R.id.connectionStatus);

        publishRateView = (TextView) findViewById(R.id.publishRate);
        speedControl = (SeekBar) findViewById(R.id.publishRateControl);

        hostIpView.setText(HOST_IP_DISPLAY_PREFIX + hostIpAddress);
        connectionStatus = BroadcastService.connectionStatus;
        connectionStatusView.setText(CONNECTION_DISPLAY_PREFIX +
                connectionStatus);

        // Initialize the publishRate textview with '0'.
        publishRateView.setText(BROADCAST_RATE_DISPLAY_PREFIX +
                BroadcastService.publishRateMilliSec);
    }

    // Re-register acceleration listener on resume
    protected void onResume() {
        super.onResume();

        sensorManager.registerListener(
                mainActivity,
                accelerometer,
                SensorManager.SENSOR_DELAY_NORMAL);
    }

    // De-register acceleration listener on pause
    protected void onPause() {
        super.onPause();
        sensorManager.unregisterListener(mainActivity);
    }

    // display the current x,y,z accelerometer values
    public void displayCurrentValues() {
        currentX.setText(Float.toString(lastReadX));
        currentY.setText(Float.toString(lastReadY));
        currentZ.setText(Float.toString(lastReadZ));
    }

    @Override
    // When acceleration event is detected, update the views
    public void onSensorChanged(SensorEvent event) {

        // Check connection status
        if (!connectionStatus.equals(BroadcastService.connectionStatus)) {
            connectionStatus = BroadcastService.connectionStatus;
            connectionStatusView.setText(CONNECTION_DISPLAY_PREFIX +
                    connectionStatus);
        }

        publishRateView.setText(BROADCAST_RATE_DISPLAY_PREFIX +
                (BroadcastService.publishRateMilliSec));

        // Get acceleration values from event
        lastReadX = event.values[X_ACCELERATION_INDEX];
        lastReadY = event.values[Y_ACCELERATION_INDEX];
        lastReadZ = event.values[Z_ACCELERATION_INDEX];

        // display the current x,y,z accelerometer values
        displayCurrentValues();
    }

    @Override
    // Comes with SensorEventListener. Not needed.
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Do nothing
    }
}
