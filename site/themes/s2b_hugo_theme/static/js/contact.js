console.log("contact.js - loading");

function sendMail() {
  console.log("sendMail - starting")
  //Form values:
  var formEmail = document.querySelector('input[name="sendto"]:checked').value;
  var formFromName = $("#ContactName").val();
  var formBody = $("#Message").val();
  var formFromEmail = $("#EmailContact").val();

  console.log("formEmail: ", formEmail, " formFromName: ", formFromName, " formBody: ", formBody, " formFromEmail: ", formFromEmail)

  //Email values:
  var emailAddress="";
  var subject="Mail From Shift 2 Bikes Contact Form - From: " + formFromName;
  var body="From name: " + formFromName + "\n"
      + "From email: " + formFromEmail + "\n"
      + "Message: \n"
      + formBody;

  //Put it all together
  var link='mailto:' + formEmail
    + emailAddress
    + '?subject='
    + encodeURIComponent(subject)
    + "&body="
    + encodeURIComponent(body)

  console.log("sendMail - composed link: " + link)

  $(location).attr('href', link);

}
