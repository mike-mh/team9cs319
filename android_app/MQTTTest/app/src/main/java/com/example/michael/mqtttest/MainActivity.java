package com.example.michael.mqtttest;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Vibrator;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.SeekBar;
import android.widget.SeekBar.OnSeekBarChangeListener;
import android.widget.TextView;


import org.eclipse.paho.android.service.MqttAndroidClient;
import org.eclipse.paho.client.mqttv3.IMqttActionListener;
import org.eclipse.paho.client.mqttv3.IMqttToken;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.MqttPersistenceException;

import static android.view.Surface.ROTATION_0;

public class MainActivity extends AppCompatActivity implements SensorEventListener {

    /**
     * This instance of <code>MainActivity</code> used to update the UI in {@link AccelerationListener}
     */
    private MainActivity mainActivity = this;

    //private AccelerationListener accelerationListener = new AccelerationListener();

    private MqttAndroidClient client;

    private SeekBar seekBar;
    private TextView textView;

    private TextView currentX;
    private TextView currentY;
    private TextView currentZ;

    private float lastX;
    private float lastY;
    private float lastZ;
    private SensorManager sensorManager;
    private Sensor accelerometer;
    private float deltaX = 0;
    private float deltaY = 0;
    private float deltaZ = 0;
    private int increment = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_main);

        initializeViews();

        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) != null) {
            // success! we have an accelerometer
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
        } else {
            // fai! we dont have an accelerometer!
        }

        seekBar.setOnSeekBarChangeListener(new OnSeekBarChangeListener() {
            int progress = 0;

            @Override
            public void onProgressChanged(SeekBar seekBar, int progresValue, boolean fromUser) {
                progress = progresValue;
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {
                // Do nothing
            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                textView.setText("PublishRate: " + progress);
            }
        });

        client = new MqttAndroidClient(this, "tcp://192.168.0.164:1883", "testing");
        try {
            ActionListener callback = new ActionListener();
            client.connect(null, callback);
        } catch (MqttException e) {
            e.printStackTrace();
        }

    }

    public void initializeViews() {
        currentX = (TextView) findViewById(R.id.currentX);
        currentY = (TextView) findViewById(R.id.currentY);
        currentZ = (TextView) findViewById(R.id.currentZ);

        textView = (TextView) findViewById(R.id.publishRate);
        seekBar = (SeekBar) findViewById(R.id.publishRateControl);

        // Initialize the publishRate textview with '0'.
        textView.setText("PublishRate: " + seekBar.getProgress());
    }

    //onResume() register the accelerometer for listening the events
    protected void onResume() {
        super.onResume();
        sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
    }

            //onPause() unregister the accelerometer for stop listening the events
    protected void onPause() {
        super.onPause();
        sensorManager.unregisterListener(this);
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

        // get the change of the x,y,z values of the accelerometer
        deltaX = Math.abs(lastX - event.values[0]);
        deltaY = Math.abs(lastY - event.values[1]);
        deltaZ = Math.abs(lastZ - event.values[2]);

        // clean current values
        displayCleanValues();

        // display the current x,y,z accelerometer values
        displayCurrentValues();
        int userInput = seekBar.getProgress();

        // Only execute based on total user input
        if(increment++ % (5 * (userInput + 1)) != 0) {
            return;
        }

        if (client.isConnected()) {
            String data = "";
            MqttMessage m = new MqttMessage();
            data += String.valueOf(deltaX);
            data += " ";
            data += String.valueOf(deltaY);
            data += " ";
            data += String.valueOf(deltaZ);
            try {
                ActionListener callback = new ActionListener();
                client.publish("$SYS", data.getBytes(), 0, false, null, callback);
            } catch (MqttException e) {
                e.printStackTrace();
            }
        }

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
