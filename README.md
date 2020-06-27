If it ain't broke, don't fix it

# messaging-app
This is a project developed for the Black Excellence Network, who needed an online chat service for their mentoring system.
It is shared on here as per the terms of our contract; please see License.MD for the license.

## Database collections :
    users
    messages

## Installation instructions
This project is built on a MEAN stack -- Mongodb -> Express js -> Angular js -> Node js. I'm running & deploying it on
an Ubuntu system. The easiest way to get everything online quickly is to clone this to your machine, using ``` git clone https://github.com/lloydarnold/messaging-app```
and then moving into this folder. From here, running ```npm install``` will install all dependencies (assuming that you have npm. If you do not, 
read this article: https://linuxize.com/post/how-to-install-node-js-on-ubuntu-18.04/).
Then, ``` npm start ``` should get the project up and running. 

## Explanation of system
The entry point for execution is server.js. This sets up an express HTTP server, listening to all inbound IP addresses on port 1337. 

