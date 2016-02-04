# team9cs319
Before you try to run this app, be sure you have NodeJS installed:

https://nodejs.org/en/download/

You can run:

    sudo apt-get install nodejs

on Linux machines.


This is a basic NodeJS server that creates a basic table application using
AngularJS and requires the 'express' node module for routing.

To run this app you must navigate to the file containing the 'pacakge.json'
file and then install 'express' library using the command in your terminal:

    sudo npm install express --save

* 'sudo' may not be needed

This will create a file known as 'node_modules' that will allow the server to
run.

* NOTE: NEVER, EVER, EVER, EVER, EVER, EVER, EVER, EVER, EVER, EVER! Add the
node_modules directory and its contents to the git repo! It can get quit fat
and a real monstrosity to remove (or for that matter checkout). When you pull
the repo from git, install the libraries needed using npm.

When you are ready to experiment, run the server using the command:

    node ./index.js

This will launch the server at the address 'http://localhost:3000' (your 
localhost server). If you want to make changes to the app, feel free to do so
and refresh the page. If NodeJS is still running, you'll see your changes!
