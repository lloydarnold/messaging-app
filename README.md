If it ain't broke, don't fix it

# Messaging App
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
and then moving into this folder. From here, running `npm install` will install all dependencies (assuming that you have npm. If you do not, 
read this article: https://linuxize.com/post/how-to-install-node-js-on-ubuntu-18.04/).

If you do not have mongodb, this will also need to be installed. A guide on this can be found here : https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-18-04

Then, ``` npm start ``` should get the project up and running. However, for deployment, I opted to use Elastic Beanstalk, as this met my client's needs. 
More on this later.

## Setup for Windows
Not everyone is running Ubuntu - that's okay! This project can be made to work on a non-unix based system to. Pre-requisites are the git client (to clone this repo),
node js and npm (node package manager). If you don't have these, please take a second to install them to your windows environment. You will also need to install 
the Mongo client. Details on that can be found here : https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/.

Once these have all been obtained, open up git, navigate to an appropriate folder, and run the command `git clone https://github.com/lloydarnold/messaging-app`.
Now, open up windows command prompt (this can be done by pressing the windows key to pull up search, then searching for `cmd`. Once in here, navigate to the folder
that you cloned this repo into, and type `npm install`. Once this has been done, type `npm start`. This should start the application. To check, go to `localhost:8080`
in your browser. 

## System Components
The entry point for execution is server.js. This sets up an Express HTTP server, listening to all inbound IP addresses on port 8080. 
On connection to the server, the user is served index.html, which imports all clientside dependencies, including (clientside) controller.js. 
This manages and controls an Angular app, which communicates with the server using both HTTP requests and web sockets. On the server side, there is a script called 
controller.js, which is imported by server.js and controls all serverside operations. This implements a number of RESTful API / socket endpoints.

### Angular app
Clientside is dealt with in Angular. There are three possible states - login, loggedIn and admin. The first serves the login.html page, dealt with by the register
controller. The second is the standard user login; this features chat.html and is dealt with by the chat controller. Finally, admin serves admin.html, dealt with 
by the admin controller. Both logged in and admin states are dealt with by socket connections; the login state is served via express and then interacts with the server
using HTTP requests to send login credentials. 
