# Some General Reading I would recommend to help you understand what's going on (for new programmers)
This project is built on the MEAN stack -- this is an open source stack (collection of platforms) that is often used
for web development. It has the advantage of being javascript on all levels, hopefully making understanding it a bit easier.
That said, it is a steep learning curve. This article helps try to make sense of it:

https://www.freecodecamp.org/news/cjn-understanding-mean-stack-through-diagrams/

In the clientside controller, I had to dynamically add some angular elements. This was harder than one might reasonably
have expected, and took me a fair amount of time to work out. This article explains it well.

https://medium.com/@jsoo1/dynamic-content-with-angularjs-7a88b931c136

## Reading for GSuite code
Whilst this project does not include any google Apps script code, I understand that the B.E.N. are using 
google sheets as their current mentor registration management platform. To send data from there to here, a RESTful 
API endpoint exists (https://en.wikipedia.org/wiki/Representational_state_transfer if you want, but not hugely important).

To add an account to the email whitelist (for mentor registration), an HTTP Post request should be sent to \<address\>\/addAllowedEmail.
  The body of this request should be a JSON, as follows. { "API_key" : \<key\>, "Name" : \<mentor name\>, "Email" : \<email\> }.
  Some rough pseudo code for looping through google sheets : 
  
  ''' 
    key = import key from secret file
    
    for row in column:
        email <- text value of row
        name <- text value of row next to it
        
        HTTP Post (address/addAllowedEmail, {our JSON (see above) }
        
    set on event listener (event = new data in table OR new form submission - latter may be easier ? )
    send email name etc in same way as above
  '''
  
  A bit of reading on g Suite apps script : 
  
  > General : https://developers.google.com/gsuite/aspects/appsscript
  
  > Iterating through spreadsheet : https://yagisanatode.com/2017/12/13/google-apps-script-iterating-through-ranges-in-sheets-the-right-and-wrong-way/
  
  > For HTTP requests : https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app
 
  > For form handling : https://developers.google.com/apps-script/quickstart/forms
