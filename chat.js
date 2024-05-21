const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config();
const TestUser = require('./database/models/testusers.js');
const { connection } = require('./database/connection.js');
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

let nameFlag = false;
let dateFlag = false;
let isNew = false;

async function createChatId() {
  const url = 'https://llm19.p.rapidapi.com/generate-id';
  const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': process.env.LLM_KEY1,
    'X-RapidAPI-Host': 'llm19.p.rapidapi.com'
  }
};

try {
  const response = await fetch(url, options);
  const result = await response.json();
  return result.id;
} catch (error) {
  console.error(error);
}
}


async function startNewConvo(input,id) {
  const url = 'https://llm19.p.rapidapi.com/chat';
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.LLM_KEY1,
      'X-RapidAPI-Host': 'llm19.p.rapidapi.com'
    },
    body: JSON.stringify({
      chatid: id,
      role: "User: Hi there! What's your name? Please type it below. BERT Bot: 👋 Hi there! What's your name? Please type it below. User: Aakash Khamaru BERT Bot: 🎉 Great, nice to meet you, Aakash! 🎉 User: 2002/10/17 BERT Bot: 📅 Next, could you please provide your date of birth in YYYY/MM/DD format? User: 2002/10/17 BERT Bot: 🏠 Finally, what's your address? Please include the city and country. User: latitude:49.1, longitude:87 BERT Bot: 🍽️ Now, what would you like to order? You can type in your choices, and I'll provide some popular recommendations. User: recommendations BERT Bot: 🌟 Great choices! Here are some popular recommendations based on what you've selected: 1️⃣ 🍔 Burger from Burger Palace 2️⃣ 🍕 Pizza from Pizza Heaven 3️⃣ 🌮 Tacos from Taco Town 4️⃣ 🍝 Pasta from Pasta Paradise 5️⃣ 🍣 Sushi from Sushi Delight BERT Bot: 📍 Lastly, let's find some restaurants near you. Could you please confirm your address one more time? User: burger BERT Bot: 🍴 Here's a list of restaurants near you: 1️⃣ Burger Palace 2️⃣ Burger King 3️⃣ Big Burger Joint 4️⃣ Patty's Burgers 5️⃣ The Burger Shack User: the burger shack BERT Bot: 🛒 Great choice! Here's a summary of your order: Name: Aakash Date of Birth: 2002/10/17 Address: Latitude: 49.1, Longitude: 87 Order: Burger from The Burger Shack BERT Bot: Is everything correct? Once confirmed, your order will be on its way! User: confirm BERT Bot: Your order has been confirmed! 🎉 🚚 Your delicious burger from The Burger Shack will be delivered to Latitude: 49.1, Longitude: 87 shortly. Thank you for using BERT Bot for your food order! If you need any more assistance, feel free to ask. Enjoy your meal! 🍔",
      message: input
    })
  };







  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result.response;
  } catch (error) {
    console.log(error);
  }
}


async function startOldConvo(input,id) {
  const url = 'https://llm19.p.rapidapi.com/chat';
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.LLM_KEY1,
      'X-RapidAPI-Host': 'llm19.p.rapidapi.com'
    },
    body: JSON.stringify({
      chatid: id,
      role: "You are BERT bot, a food ordering chatbot. Greet the user and introduce yourself and your purpose. Ask for user's address. Inquire about what the user would like to order, providing options if needed. Ensure to ask about any dietary preferences or restrictions.Based on the user's address, suggest a list of 5 restaurants sorted by their distance from the user's location from internet. Allow the user to choose from these options. Simulate the process of placing the order with the selected restaurant. Confirm the order details with the user and provide a summary.",
      message: input
    })
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return result.response;
  } catch (error) {
    console.log(error);
  }
}

async function sendMessage(input, reciever) {
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
          body: input
        }
      })
    });
    console.log('message sent')

  } catch (error) {
    console.log(error);
  }

}



const conversation = async (input,phnum,func,chatid)=>{
  try {
    const response = await func(input,chatid)
    
    if(response.includes('name')) {
      nameFlag = true;
    } else if(response.includes('date of birth') || response.includes('dob')) {
      dateFlag = true;
    } 
    await sendMessage(response,phnum); 
  } catch(e) {
    
    console.log(e);
  }
}




app.post('/', async (req,res)=>{
  try {
    
    const body = req.body.entry[0].changes;
    for await (const msg of body) {
      
      const phnum = msg.value.contacts[0].wa_id;
      if(phnum!==process.env.TEST) {
        console.log('message recieved')
        const user = await TestUser.findOne({phonenum:phnum});
        if(user) {
        const type = msg.value.messages[0].type;
        const chatid = user.chatid;
        if(type==='location') {
          const {latitude,longitude} = msg.value.messages[0].location;
          await conversation(`Location: latitude:${latitude}, longitude:${longitude}`,phnum,startOldConvo,chatid);
        } else {  
          const message = msg.value.messages[0].text.body;
          await conversation(message,phnum,startOldConvo,chatid);
         }
        } else {
        const id = await createChatId(); 
        isNew = true;
        const userObj = {username:'',phonenum:phnum,dob:'',chatid:id};  
        const type = msg.value.messages[0].type;
        if(type==='location') {
          const {latitude,longitude} = msg.value.messages[0].location;
          await conversation(`Location: latitude:${latitude}, longitude:${longitude}`,phnum,startNewConvo,id);
        } else {  
          const message = msg.value.messages[0].text.body;
          if(nameFlag) {
            userObj.username = message;
            console.log(message)
          }
          if(dateFlag) {
            userObj.dob = message;
            console.log(message)
          }
          if(userObj.username.length>0 && userObj.dob.length>0) {
            const user = new TestUser(userObj);
            await user.save();
            console.log(`User created:${user}`)
          }
          await conversation(message,phnum,startNewConvo,id);
        }
        }
      }

    }
  } catch(e) {
    
    console.log(e);
  }
  res.status(200).json({msg:'recieved'})
})


app.get('/', async (req, res) => {
  try {
    const chall = req.originalUrl.split('&')[1].split('=')[1];
    res.send(chall);
  } catch (e) {
    console.log(e);
  }
  res.status(200).json({ msg: 'good job' });
});

connection(process.env.DB);
app.listen(3000, () => {
  console.log('Server is listening');
});
