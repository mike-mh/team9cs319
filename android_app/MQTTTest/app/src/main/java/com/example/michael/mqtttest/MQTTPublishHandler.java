package com.example.michael.mqtttest;

import org.eclipse.paho.client.mqttv3.IMqttActionListener;
import org.eclipse.paho.client.mqttv3.IMqttToken;

/**
 * Created by michael on 18/02/16.
 */
public class MQTTPublishHandler implements IMqttActionListener {
    @Override
    public void onSuccess(IMqttToken iMqttToken) {
        // Do nothing. Yet...
    }

    @Override
    public void onFailure(IMqttToken iMqttToken, Throwable throwable) {
        // Do nothing. Yet...
    }
}
