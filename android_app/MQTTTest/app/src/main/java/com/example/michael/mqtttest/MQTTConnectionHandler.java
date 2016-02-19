package com.example.michael.mqtttest;

import org.eclipse.paho.client.mqttv3.IMqttActionListener;
import org.eclipse.paho.client.mqttv3.IMqttToken;

/**
 * Created by michael on 18/02/16.
 */
public class MQTTConnectionHandler implements IMqttActionListener {
    @Override
    public void onSuccess(IMqttToken iMqttToken) {
        BroadcastService.connectionStatus = "Connected";
    }

    @Override
    public void onFailure(IMqttToken iMqttToken, Throwable throwable) {
        BroadcastService.connectionStatus = "Disconnected";
    }
}
