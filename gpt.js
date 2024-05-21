const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config();
const TestUser = require('./database/models/testusers.js');
const { connection } = require('./database/connection.js');
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
const system_prompt = "You are BERT bot, a food ordering chatbot. Greet the user and introduce yourself and your purpose. If user is new  then ask for user's name ,ask for user's dob (in YYYY/MM/DD format). Ask for user's address(recieve in latitude and longitude). Inquire about what the user would like to order, providing options if needed. Ensure to ask about any dietary preferences or restrictions.Based on the user's address, suggest a list of 5 restaurants sorted by their distance from the user's location from internet. Allow the user to choose from these options. Simulate the process of placing the order with the selected restaurant. Confirm the order details with the user and provide a summary. Do everything step by step."
let nameFlag = false;
let dateFlag = false;
let addressFlag = false;
let isNew = false;




async function startNewConvo(input,prompt) {
  const url = 'https://open-ai21.p.rapidapi.com/conversationgpt35';
const options = {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'X-RapidAPI-Key': 'a8a9e9c4c3mshe0ef4e4ee113ad7p1c9a4fjsned93ec320d25',
    'X-RapidAPI-Host': 'open-ai21.p.rapidapi.com'
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: input
      }
    ],
    web_access: true,
    system_prompt: prompt,
    temperature: 0.9,
    top_k: 5,
    top_p: 0.9,
    max_tokens: 256
  })
};

try {
  const response = await fetch(url, options);
  const ans = await response.json();
  return ans.result;
} catch (error) {
  console.error(error);
}
}


/*async function startOldConvo(input) {
  const url = 'https://llm19.p.rapidapi.com/chat';
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': process.env.LLM_KEY2,
      'X-RapidAPI-Host': 'llm19.p.rapidapi.com'
    },
    body: JSON.stringify({
      chatid: 'b70e573a-0393-4721-aed1-8df21cdcd573',
      role: "You are BERT bot, a food ordering chatbot. Greet the user and introduce yourself and your purpose. Ask for user's address(recieve in latitude and longitude). Inquire about what the user would like to order, providing options if needed. Ensure to ask about any dietary preferences or restrictions.Based on the user's address, suggest a list of 5 restaurants sorted by their distance from the user's location from internet. Allow the user to choose from these options. Simulate the process of placing the order with the selected restaurant. Confirm the order details with the user and provide a summary.",
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
}*/

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

const fetchUser = async (phnum) => {
  try {
    const user = await TestUser.findOne({ phonenum: phnum });
    return user;
  } catch (e) {
    console.log(e);
  }
};

const conversation = async (input,phnum,func,isNew)=>{
  try {
    let response;
    if(isNew) {
      response = await func(input,`${system_prompt}. User is new.`);  
    } else {
      response = await func(input,`${system_prompt}. User is old.`);  
    }
    
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
        isNew = true;
        if(type==='location') {
          const {latitude,longitude} = msg.value.messages[0].location;
          await conversation(`Location: latitude:${latitude}, longitude:${longitude}`,phnum,startNewConvo,isNew);
        } else {  
          const message = msg.value.messages[0].text.body;
          await conversation(message,phnum,startNewConvo,isNew);
         }
        } else {
        const userObj = {username:'',phonenum:phnum,dob:''};  
        const type = msg.value.messages[0].type;
        if(type==='location') {
          const {latitude,longitude} = msg.value.messages[0].location;
          await conversation(`Location: latitude:${latitude}, longitude:${longitude}`,phnum,startNewConvo,isNew);
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
          await conversation(message,phnum,startNewConvo,isNew);
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
