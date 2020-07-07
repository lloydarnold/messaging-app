If it ain't broke, don't fix it

# messaging-app
This is a project developed for the Black Excellence Network, who needed an online chat service for their mentoring system.
It is shared on here as per the terms of our contract; please see License.MD for the license.

## Database collections :
    users
    deleted_users
    online
    messages
    group_notices
    emailWhiteList

Schema for all of these collections can be found under model/model.js. This is fully documented, to explain each field.

## Personal Installation instructions
This project is built on a MEAN stack -- Mongodb -> Express js -> Angular js -> Node js. I developed and ran it locally it on
an Ubuntu system. The easiest way to get everything online quickly is to clone this to your machine, using ``` git clone https://github.com/lloydarnold/messaging-app```
and then moving into this folder. From here, running ```npm install``` will install all dependencies (assuming that you have npm. If you do not, 
read this article: https://linuxize.com/post/how-to-install-node-js-on-ubuntu-18.04/).
Then, ``` npm start ``` should get the project up and running. However, for deployment, I opted to use Elastic Beanstalk, as this met my client's needs. 
More on this later.

## System Components
The entry point for execution is server.js. This sets up an Express HTTP server, listening to all inbound IP addresses on port 8080. 
On connection to the server, the user is served index.html, which imports all clientside dependencies, including (clientside) controller.js. 
This manages and controls an Angular app, which communicates with the server using both HTTP requests and web sockets. On the server side, there is a script called 

## Angular app
