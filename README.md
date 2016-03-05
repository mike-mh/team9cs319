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
npm install
```

## Run the DCH server

To run DCH, navigate to the team9cs319/dch/ directory and run:

```
node dch.js
```

The harmony param is necessarry to ensure that NodeJS will register the special keywords used for variable declaration.

After DCH has launched successfully, you will have access to the DCGUI at the URL http://localhost:3000.

Be sure that your Mosquitto MQTT broker is running if you wish to have data published by an Android device persist in MongoDB. DCH can still run without this broker but data will not persist.

## Testing DCH and DCGUI

After you have installed the neceearry packages with:

```
npm install
```

You can then run unit tests by running:

```
npm test
```

For DCGUI testing, Karma is capable of running tests on Opera, IE11, Edge, Chrome, Firefox and Safari browsers. To run tests for a specific browser installed. Then to test those browsers ensure that they are set in the 'karma.conf.js' file.

```
// Karma will run tests on IE11, Chrome and Opera
browsers: ['Chrome', 'IE', 'Opera'],
```

Note that to run on Travis a browser 'CromeCanary' is used. To have Karma run on your own device, this browser should be removed.

## Protractor Testing for DCGUI

Protractor is a powerful automated end to end test tool frequently used for AngularJS apps. Tests written in Protractor physically call up an instance of the browser to be tested and executes sequential user interactions such as clicks and keystrokes and examines the DOM to confirm expected behavior.

To install the protractor tool run:

```
npm install -g protractor@2.5.1
```

You can then run the protractor test by navigating to the DCH directory and running:
```
webdriver-manager update --standalone
webdriver-manager start
protractor ./conf.js

```


## Installing DCAPP on your Android device

If you wish to install and run DCAPP on a Vandrico Solutions smart watch, navigate to team9cs319/dcapp_apk/ and run:

```
adb install app-debug.apk
```

This works for all Android devices. The name of the ap is presently app-debug.apk but this will likely change.

If you wish to install DCAPP on your own Android device through Android Studio, you can accomplish this by importing the contents of team9cs319/dcapp/ into Android Studio as a project then with your device connected via USB select 'run'. But note, this will not work on the Vandrico Solutions watch.

## Testing DCAPP

To run unit tests on the DCAPP you ensure that you have Gradle installed on your devuce. navigate to the DCAPP directory and run:

```
gradle build test
```

If you wish to run gradke to only display test results run:

```
gradle build test -q
```

