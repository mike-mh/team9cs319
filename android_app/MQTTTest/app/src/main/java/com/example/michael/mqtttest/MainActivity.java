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

import org.eclipse.paho.android.service.MqttAndroidClient;

public class MainActivity extends AppCompatActivity implements SensorEventListener {

    /**
     * This instance of <code>MainActivity</code> used to update the UI in {@link AccelerationListener}
     */
    private MainActivity mainActivity = this;
    private String androidId;
    private TelephonyManager telephonyManager;
    private String hostIpAddress;

    private String connectionStatus;

    private MqttAndroidClient client;

    private SeekBar seekBar;
    private TextView textView;

    private TextView currentX;
    private TextView currentY;
    private TextView currentZ;

    private TextView hostIpView;
    private TextView connectionStatusView;

    private float lastX;
    private float lastY;
    private float lastZ;
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private float deltaX = 0;
    private float deltaY = 0;
    private float deltaZ = 0;

    private int speedSetting = 0;
    private int increment = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        telephonyManager = (TelephonyManager)getSystemService(Context.TELEPHONY_SERVICE);
        androidId = telephonyManager.getDeviceId();
        setContentView(R.layout.activity_main);

        initializeViews();

        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) != null) {

            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            sensorManager.registerListener(mainActivity, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
        }
        seekBar.setOnSeekBarChangeListener(new OnSeekBarChangeListener() {
            int progress = 0;

            @Override
            public void onProgressChanged(SeekBar seekBar, int progressValue, boolean fromUser) {
                progress = progressValue;
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {
                // Do nothing
            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                if (progress != speedSetting) {
                    speedSetting = progress;
                    Intent startBroadcastService = new Intent(mainActivity, BroadcastService.class);
                    startBroadcastService.putExtra("AndroidId", androidId);
                    startBroadcastService.putExtra("hostIp", hostIpAddress);
                    startBroadcastService.putExtra("userSpeedInput", speedSetting);
                    startService(startBroadcastService);

                    textView.setText("PublishRate: " + BroadcastService.publishRateMilliSec);
                }
            }
        });

        open(this.findViewById(android.R.id.content));
//        Intent startBroadcastService = new Intent(mainActivity, BroadcastService.class);
//        startBroadcastService.putExtra("AndroidId", androidId);
//        startService(startBroadcastService);

    }

    public void open(View view) {
        AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(this);
        alertDialogBuilder.setMessage("Please enter the IP address of the host including the port. e.g. '192.168.0.164:1883'");
        final EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_TEXT);
        alertDialogBuilder.setView(input);

        alertDialogBuilder.setPositiveButton("Confirm", new DialogInterface.OnClickListener() {
            Intent startBroadcastService = new Intent(mainActivity, BroadcastService.class);

            @Override
            public void onClick(DialogInterface dialog, int which) {
                if(BroadcastService.broadcastServiceIsRunning) {
                    stopService(startBroadcastService);
                }
                hostIpAddress = input.getText().toString();
                Intent startBroadcastService = new Intent(mainActivity, BroadcastService.class);
                startBroadcastService.putExtra("AndroidId", androidId);
                startBroadcastService.putExtra("hostIp", hostIpAddress);
                startService(startBroadcastService);
                hostIpView.setText("Host IP: " + hostIpAddress);
            }
        });

        alertDialogBuilder.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                dialog.cancel();
            }
        });

        AlertDialog alertDialog = alertDialogBuilder.create();
        alertDialog.show();
    }

    public void initializeViews() {
        currentX = (TextView) findViewById(R.id.currentX);
        currentY = (TextView) findViewById(R.id.currentY);
        currentZ = (TextView) findViewById(R.id.currentZ);

        hostIpView = (TextView) findViewById(R.id.hostIpAddress);
        connectionStatusView = (TextView) findViewById(R.id.connectionStatus);

        textView = (TextView) findViewById(R.id.publishRate);
        seekBar = (SeekBar) findViewById(R.id.publishRateControl);

        hostIpView.setText("Host IP: " + hostIpAddress);
        connectionStatus = BroadcastService.connectionStatus;
        connectionStatusView.setText("Connection Status: " + connectionStatus);

        // Initialize the publishRate textview with '0'.
        textView.setText("PublishRate: " + BroadcastService.publishRateMilliSec);
    }

    protected void onResume() {
        super.onResume();
        sensorManager.registerListener(mainActivity, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
    }

    protected void onPause() {
        super.onPause();
        sensorManager.unregisterListener(mainActivity);
    }

    public void displayCleanValues() {
        currentX.setText("0.0");
        currentY.setText("0.0");
        currentZ.setText("0.0");
    }

    // display the current x,y,z accelerometer values
    public void displayCurrentValues() {
        currentX.setText(Float.toString(deltaX));
        currentY.setText(Float.toString(deltaY));
        currentZ.setText(Float.toString(deltaZ));
    }

    @Override
    public void onSensorChanged(SensorEvent event) {

        // Check connection status
        if (!connectionStatus.equals(BroadcastService.connectionStatus)) {
            connectionStatus = BroadcastService.connectionStatus;
            connectionStatusView.setText("Connection Status: " + connectionStatus);
        }

        textView.setText("PublishRate: " + (BroadcastService.publishRateMilliSec) + " ms");

        // get the change of the x,y,z values of the accelerometer
        deltaX = Math.abs(lastX - event.values[0]);
        deltaY = Math.abs(lastY - event.values[1]);
        deltaZ = Math.abs(lastZ - event.values[2]);

        // clean current values
        displayCleanValues();

        // display the current x,y,z accelerometer values
        displayCurrentValues();
        int userInput = seekBar.getProgress();

        // set the last know values of x,y,z
        lastX = event.values[0];
        lastY = event.values[1];
        lastZ = event.values[2];
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Do nothing
    }
}
