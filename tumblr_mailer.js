var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js')
var mandrill = require('mandrill-api/mandrill');

var csvFile = fs.readFileSync('friend_list.csv','utf8');
var emailTemplate = fs.readFileSync('email_template.ejs', 'utf8');
var mandrill_client = new mandrill.Mandrill('lj5zNi4iVH05Soeo8S05dQ');

var client = tumblr.createClient({
  consumer_key: 'ok9Y9qSWxrq4Lg40fyC0YaOMJC4U1qX8INq53B3UvThNL4BVpw',
  consumer_secret: 'a4AjdxrGr7BFmcwtfupAiLrwzHyGjVN8pJGOAV5MPrAHouU64M',
  token: 'WFYS46guQOhOloTroA92Y4Mv4MfFBXkQiQDtGyIPQTcwgaDg1f',
  token_secret: 'naSV0HfFl1164eE40EHADc9FjXwQkkUlyiSLsBZC6tTeQb5uQd'
});

function csvParse(csv) {
  var lines = csv.trim().split('\n');
  var attributes = lines.shift().split(',');
  var entries = [];

  lines.forEach(function(line) {
    var entryValues = line.split(',');

    var entry = {};
    attributes.forEach(function(attribute, i) {
      entry[attribute] = entryValues[i];
    });

    entries.push(entry);
  });

  return entries;
}

client.posts('chsea.tumblr.com', function(err, blog){
  var latestPosts = [];
  blog.posts.forEach(function(post) {
    var now = new Date();
    var postDate = new Date(post.date);
    var difference = Math.round((now - postDate) / (1000 * 60 * 60 * 24) - 1);

    if (difference <= 7) {
      latestPosts.push(post);
    }
  })

  var contacts = csvParse(csvFile);
  contacts.forEach(function(contact) {
    var firstName = contact.firstName;
    var email = contact.emailAddress;
    var numMonthsSinceContact = contact.numMonthsSinceContact;

    var templateCopy = emailTemplate;
    var customizedTemplate = ejs.render(templateCopy, { 'firstName': firstName, 'numMonthsSinceContact': numMonthsSinceContact, 'latestPosts': latestPosts });

    sendEmail(firstName, email, 'Chel', 'chsea.du@gmail.com', 'Hi! :)', customizedTemplate);
  });
});

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
 }
