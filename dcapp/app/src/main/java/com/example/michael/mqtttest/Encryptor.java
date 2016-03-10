package com.example.michael.mqtttest;

import java.io.UnsupportedEncodingException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.DESKeySpec;
import javax.crypto.spec.IvParameterSpec;

/**
 *  @desc - This is the encryption class used to encrypt all data send to the
 *          host server using the DES-CBC algortihim. Encryption is currently
 *          weak but this is to be used for demonstration purposes only.
 *          More complex algortihims can be integrated ater, e.g. AES-256.
 */
public class Encryptor {
    private SecretKey key;
    private Cipher cipher;
    private SecretKeyFactory keyFactory;

    private static final String PRIVATE_KEY = "somepriv";

    public Encryptor() {

    }

    /**
     * @desc - This is the encryption method. It is designed to take in a
     *         string and return an encrypted byte array.
     *
     *         TO-DO: If time permits, we should strengthen algorithim used.
     *
     * @param data {String} - The data to be encoded into DES-CBC
     *
     * @return {byte[]} - An encrypted byte array
     *
     * @throws NoSuchAlgorithmException
     * @throws InvalidKeySpecException
     * @throws NoSuchPaddingException
     * @throws InvalidAlgorithmParameterException
     * @throws InvalidKeyException
     * @throws BadPaddingException
     * @throws IllegalBlockSizeException
     * @throws UnsupportedEncodingException
     */
    public byte[] encryptData(String data) throws
            NoSuchAlgorithmException,
            InvalidKeySpecException,
            NoSuchPaddingException,
            InvalidAlgorithmParameterException,
            InvalidKeyException,
            BadPaddingException,
            IllegalBlockSizeException,
            UnsupportedEncodingException {

        byte[] dataToBytes = data.getBytes("UTF-8");
        byte[] encodedData;


        DESKeySpec keySpec = new DESKeySpec(PRIVATE_KEY.getBytes("UTF-8"));

        keyFactory = SecretKeyFactory.getInstance("DES");
        key = keyFactory.generateSecret(keySpec);
        cipher = Cipher.getInstance("DES/CBC/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new IvParameterSpec(new byte[8]));
        encodedData = cipher.doFinal(dataToBytes);

        return encodedData;

    }
}
