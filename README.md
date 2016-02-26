# MAADC (MQTT Android Data Collector)

MAADC is a system designed to allow for the collection and retrieval of acceleration data from Android
hardware via MQTT. After you have run through these instructions you should have a working DCH server, access to the DCGUI at the address http://localhost:3000 and, if you elect to use an Android device, an Android device with DCAPP that will allow you to broadcast acceleration data to the DCH.

# Setup Instructions

Before setting up MAADC be sure you have the following installed on your machine:

NodeJS 
https://nodejs.org/en/download/

Mosquitto MQTT broker
http://mosquitto.org/download/

MongoDB
https://docs.mongodb.org/manual/installation/

Android Debug Bridge (ADB comes with Android Studio or Android SDK and its recommended you install it from there instead. )
http://lifehacker.com/the-easiest-way-to-install-androids-adb-and-fastboot-to-1586992378

Android Studio (Recommended if you plan on developing for DCAPP)
http://developer.android.com/sdk/index.html

## Setup the DCH server

The DCH server support supscription to the Mosquitto MQTT broker and a basic API to show all data currently isnerted into MongoDB. There is also an API available to view the total number of connected Android devices.

Before running the app be sure to install the following dependancies. And no matter what, do not *EVER* include the files generated in the node_modules folder when you install the pacakages when you push a branch to the repo. These can be quite fat and a nightmare to deal with if they enter the repo. 

Run:

```
npm install mqtt
npm install mongodb
npm install mongoose
npm install express
```

## Run the DCH server

To run DCH, navigate to the team9cs319/dch/ directory and run:

```
nodejs --harmony dch.js
```

The harmony param is necessarry to ensure that NodeJS will register the special keywords used for variable declaration.

After DCH has launched successfully, you will have access to the DCGUI at the URL http://localhost:3000.

Be sure that your Mosquitto MQTT broker is running if you wish to have data published by an Android device persist in MongoDB. DCH can still run without this broker but data will not persist.


## Installing DCAPP on your Android device

If you wish to install and run DCAPP on a Vandrico Solutions smart watch, navigate to team9cs319/dcapp_apk/ and run:

```
adb install app-debug.apk
```

This works for all Android devices. The name of the ap is presently app-debug.apk but this will likely change.

If you wish to install DCAPP on your own Android device through Android Studio, you can accomplish this by importing the contents of team9cs319/dcapp/ into Android Studio as a project then with your device connected via USB select 'run'. But note, this will not work on the Vandrico Solutions watch.


