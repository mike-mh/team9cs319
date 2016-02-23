package com.example.michael.mqtttest;

import org.eclipse.paho.client.mqttv3.IMqttActionListener;
import org.eclipse.paho.client.mqttv3.IMqttToken;

/**
 * @desc - This is the callback class used to handle publish events from a
 *         MQTT client. It's current just a stub but it could provide some
 *         functionality if we need it later. (A call back class is needed
 *         by MQTTclient to perform a publish).
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
