document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  //document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  //document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  //document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  //document.querySelector('#compose').addEventListener('click', compose_email);
  
  //document.querySelector('#compose-form').addEventListener('submit', sendmail)

  // By default, load the inbox
  if (!localStorage.getItem('emailcount')) {
    localStorage.setItem('emailcount', 0);
  }
  if (!localStorage.getItem('mailbox')) {
    localStorage.setItem('mailbox', "inbox");
  }
  load_mailbox('inbox');
});

window.onpopstate = function(event) {
  console.log(event.state.section);
  if (event.state.section == "compose"){
    compose_email()
  }
  else{
    load_mailbox(event.state.section)
  }
}

function sendmail(){
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      console.log(Object.keys(result))
      console.log(Object.keys(result) == "error")
      if (Object.keys(result) == "message"){
        load_mailbox('sent')
      }
      else{
        document.querySelector("#passwordHelp").innerHTML= result.error ;
        return false;
        }
  }).catch(error => {
        /*const element = document.createElement('div');
        element.innerHTML = `<small id="passwordHelp" class="text-danger">${result.error}</small> `;
        var recipient = document.getElementById('compose-recipients');
        //var text = document.createTextNode("This is my caption.");
        recipient.parentNode.removeChild(recipient.parentNode.lastElementChild);
        recipient.parentNode.insertBefore(element, recipient.nextSibling);*/
        console.log(error)
        return false;
  });
}

function compose_email(id = null) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#mail').style.display = 'none';
  localStorage.setItem('mailbox', "compose");
  //update navtab
  document.querySelector(`#${localStorage.getItem('mailbox')}`).classList.remove("active");
  document.querySelector('#inbox').classList.remove("active");
  document.querySelector('#sent').classList.remove("active");
  document.querySelector('#archive').classList.remove("active");
  document.querySelector('#compose').classList.add("active");

  // Clear out composition fields
  if (id == null){
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
    history.pushState({section: "compose"}, "", 'compose');
  }else{
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      // Print email
      console.log(email);
      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = email.subject.includes("Re:")? email.subject : "Re:" + email.subject;
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: \r\n\r\n${email.body}`;
    });
  }

  // Clear out error fields
  document.querySelector("#passwordHelp").innerHTML = '';

}

function load_mailbox(mailbox) {

   //update navtab
   document.querySelector(`#${localStorage.getItem("mailbox")}`).classList.remove("active");
   document.querySelector('#inbox').classList.remove("active");
   document.querySelector('#sent').classList.remove("active");
   document.querySelector('#archive').classList.remove("active");
   document.querySelector('#compose').classList.remove("active");
   document.querySelector(`#${mailbox}`).classList.add("active");
   document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
   history.pushState({section: mailbox}, "", `${mailbox}`);
   localStorage.setItem('mailbox', `${mailbox}`);
   
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      if (mailbox == "inbox") {
        var count = 0;
        emails.forEach(element => {
          if (!element.read) { count += 1}
        });
        if( count == 0){
          document.getElementById("emailcount").hidden = true;
        }else{
          document.getElementById("emailcount").hidden = false;
          document.getElementById("emailcount").innerHTML = count;
        }
        localStorage.setItem("emailcount",count)
      }
      else{
        document.getElementById("emailcount").innerHTML = localStorage.getItem("emailcount");
      }
      if (emails.length > 0){
        for(var i = 0; i<emails.length;i++){
            addElement(emails[i], mailbox)
       } 
      }
      console.log(emails);

      // ... do something else with emails ...  
  });
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail').style.display = 'none';

 
  //document.querySelector(`#${malibox}`).
  // Show the mailbox name
}

function addElement(email, mailbox){
  const parent = document.querySelector('#emails-view')
  const element = document.createElement('div');
    element.innerHTML = `<div class="list-group">
    <a href="javascript:viewemail(${email.id})" class="list-group-item list-group-item-action ${email.read == true ? "list-group-item-dark" : "list-group-item-light" }" aria-current="true" id=${email.id}>
    <div class="d-flex w-100 justify-content-between">
    <h5 class="mb-1">${mailbox == "sent" ? email.recipients : email.sender}</h5>
    <small>${email.timestamp}</small>
    </div>
    <p class="mb-1">${email.subject.length > 0 ? email.subject : 'No subject'}</p>
    <small>${email.body.length > 0 ? email.body.substring(0,100) + ' . . .' : ''}</small>
    </a></div><br>`
   parent.append(element);
}

function viewemail(id){
  // Show the mailbox and hide other views
  history.pushState({section: localStorage.getItem("mailbox")}, "", localStorage.getItem('mailbox'));
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail').style.display = 'block';
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);
      if (localStorage.getItem("mailbox") != "sent"){
        markread(id, true, email.read)
      }
      // Check conditions for archive button
      if(localStorage.getItem("mailbox") == "sent"){
        document.getElementById("mailarchive").hidden = true;
        document.getElementById("mailunread").hidden = true;
      }
      else{
        document.querySelector(`#mailarchive`).hidden = false;
        document.getElementById("mailunread").hidden = false;
        if(email.archived){
          document.querySelector(`#mailarchive`).innerHTML = "Unarchive";
          document.querySelector(`#mailarchive`).setAttribute("onclick", `markarchive(${id},false)`);
          console.log("set unarchive");
        }else{
          document.querySelector(`#mailarchive`).innerHTML = "Archive";
          document.querySelector(`#mailarchive`).setAttribute("onclick", `markarchive(${id},true)`);
          console.log("set archive");
        }
      }

      // mark as unread button
      document.querySelector(`#mailunread`).innerHTML = "Mark as unread";
      document.querySelector(`#mailunread`).value = id
      document.querySelector(`#mailunread`).setAttribute("onclick", `markread(${id},false, ${email.read})`);

      // Reply button
      document.querySelector(`#mailreply`).value = id;
      document.querySelector(`#mailreply`).setAttribute("onclick",`compose_email(${id})`);

      // Email data
      document.querySelector(`#mailtimestamp`).innerHTML = email.timestamp;
      document.querySelector(`#mailsender`).innerHTML = email.sender;
      document.querySelector(`#mailrecipients`).innerHTML = email.recipients;
      document.querySelector(`#mailsubject`).innerHTML = email.subject;
      document.querySelector(`#mailbody`).innerHTML = email.body;
  });
}

function markread(mail, readvalue, readStatus){
  fetch(`/emails/${mail}`, {
    method: 'PUT',
    body: JSON.stringify({
        read : readvalue
    })
  });
  console.log(`email marked read, id : ${mail}`)
  var mailunread = document.getElementById("mailunread");
  if (readvalue){
    document.getElementById(`${mail}`).classList.add("list-group-item-dark");
    mailunread.innerHTML = "Mark as unread";
    mailunread.setAttribute("onclick", `markread(${mail},false, true)`);
  }
  else{
    document.getElementById(`${mail}`).classList.remove("list-group-item-dark");
    mailunread.innerHTML = "Mark as read";
    mailunread.setAttribute("onclick", `markread(${mail},true, false)`);
  }
  if(localStorage.getItem("mailbox") == "archive"){
    document.getElementById("emailcount").innerHTML = parseInt(localStorage.getItem("emailcount"));
    localStorage.setItem("emailcount",parseInt(localStorage.getItem("emailcount")));
  }else {
    if ((readvalue && readStatus)){
      if(parseInt(localStorage.getItem("emailcount")) == 0){
        document.getElementById("emailcount").hidden = true;
      }else{
        document.getElementById("emailcount").hidden = false;
        document.getElementById("emailcount").innerHTML = parseInt(localStorage.getItem("emailcount"));
      }
      localStorage.setItem("emailcount",parseInt(localStorage.getItem("emailcount")));
    }
    else{
      if (readvalue){
        localStorage.setItem("emailcount",parseInt(localStorage.getItem("emailcount"))-1);
        if(parseInt(localStorage.getItem("emailcount")) == 0){
          document.getElementById("emailcount").hidden = true;
        }else{
          document.getElementById("emailcount").hidden = false;
          document.getElementById("emailcount").innerHTML = parseInt(localStorage.getItem("emailcount"));
        }
      }
      else{
        localStorage.setItem("emailcount",parseInt(localStorage.getItem("emailcount"))+1);
        if(parseInt(localStorage.getItem("emailcount")) == 0){
          document.getElementById("emailcount").hidden = true;
        }else{
          document.getElementById("emailcount").hidden = false;
          document.getElementById("emailcount").innerHTML = parseInt(localStorage.getItem("emailcount"));
        }
      }
    }
  }
}

function markarchive(mail,value){
  fetch(`/emails/${mail}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived : value
    })
  });
  console.log(mail)
  console.log(mail.id)
  /*if (value){
    document.querySelector(`#mailarchive`).innerHTML = "Unarchive";
    document.querySelector(`#mailarchive`).setAttribute("onclick", `markarchive(${mail.id},false)`);
  }
  else{
    document.querySelector(`#mailarchive`).innerHTML = "Archive";
    document.querySelector(`#mailarchive`).setAttribute("onclick", `markarchive(${mail.id},true)`);
  }*/
  setTimeout(function() {
    //your code to be executed after 1 second
    load_mailbox('inbox');
  }, 100);
}

function checksender(email){
  console.log(document.getElementById("user").innerHTML)
  console.log(email.sender)
  console.log(document.getElementById("user").innerHTML == email.sender);
  return document.getElementById("user").innerHTML == email.sender;
}
