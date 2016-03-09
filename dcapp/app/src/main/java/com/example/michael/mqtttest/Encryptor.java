package com.example.michael.mqtttest;

import android.util.Base64;
import android.util.Log;

import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.KeyGenerator;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.DESKeySpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Created by michael on 08/03/16.
 */
public class Encryptor {
    private SecretKey key;
    private Cipher cipher;

    private static final String PRIVATE_KEY = "somepriv";

    public Encryptor() {

    }

    public byte[] encryptData(String data)
            throws UnsupportedEncodingException,
                   InvalidAlgorithmParameterException,
                   InvalidKeyException
    {
        byte[] dataToBytes = data.getBytes("UTF-8");
        byte[] encodedData = null;


        DESKeySpec keySpec = new DESKeySpec(PRIVATE_KEY.getBytes("UTF-8"));
        SecretKeyFactory keyFactory = null;
        try {
            keyFactory = SecretKeyFactory.getInstance("DES");
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        try {
            key = keyFactory.generateSecret(keySpec);
        } catch (InvalidKeySpecException e) {
            e.printStackTrace();
        }

        try {
            cipher = Cipher.getInstance("DES/CBC/PKCS5Padding");
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        } catch (NoSuchPaddingException e) {
            e.printStackTrace();
        }
        cipher.init(Cipher.ENCRYPT_MODE, key, new IvParameterSpec(new byte[8]));

        try {
            encodedData = cipher.doFinal(dataToBytes);
        } catch (IllegalBlockSizeException e) {
            e.printStackTrace();
        } catch (BadPaddingException e) {
            e.printStackTrace();
        }
        return encodedData;

    }
}
