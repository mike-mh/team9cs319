# team9cs319

This is the first main commit with the DCH server. The server support supscription to the Mosquitto MQTT broker and a basic API to show all data currently isnerted into MongoDB. There is also an API available to view the total number of connected Android devices.

Before running the app be sure to install the following dependancies. And no matter what, do not *EVER* include the files generated in the node_modules folder when you install the pacakages. These can be quite fat and a nightmare to deal with if they enter the repo. 

Run:

npm install mqtt
npm install mongodb
npm install mongoose
npm install express

To run the app, navigate to the directory containing dch.js and run:

nodejs --harmony dch.js

The harmony param is necessarry to ensure that NodeJS will register the special keywords used for variable declaration.
