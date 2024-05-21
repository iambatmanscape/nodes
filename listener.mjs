
import Agenda from 'agenda';
import dotenv from 'dotenv';

dotenv.config();
const agenda = new Agenda({
    db: {address: process.env.DB, collection: 'Scheduling'},
    processEvery: '24 hours'
});


agenda.define('send reminder', (job, done) => {
    
    done();
});

(async () => {
    await agenda.start();
    await agenda.every('10 seconds', 'say hi');
})();



async function sendReminder(name,reminders,reciever) {
 
 const url = `https://graph.facebook.com/v18.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUD_API_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: reciever,
        type: 'text',
        text: {
          preview_url: false,
          body: `Hi ${name}, your reminders for the day are:`
        }
      })
    });
    console.log('message sent')

    for await (const msg of reminders) {
       const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUD_API_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: reciever,
        type: 'text',
        text: {
          preview_url: false,
          body: msg
        }
      })
    });
    console.log('Reminder sent')
    }


  } catch (error) {
    console.log(error);
  }

}