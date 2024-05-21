const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const sdk = require('api')('@whapi/v1.7.5#13fxolr0rpbag');
const app = express();
const { connection } = require('./database/connection.js')
const Resturant = require('./database/models/resturants.js')
const {v4:uuidv4} = require('uuid');
const User = require('./database/models/users.js')
let api,isNewUser=false;




sdk.auth('PTYcnmTrIMXRaEgp0DcaNkQqiBqIufgb');

app.use(bodyParser.json());

let phoneNum,order;
let totalPrice=0;
let customerMenu,resturantInfo;

app.get('/', (req, res) => {
    res.send('Hi')
})

const newID = uuidv4();
const oldUserApi = `https://account.snatchbot.me/channels/api/api/id381084/appappu/apsakki?user_id=${newID}`
const newUserApi = `https://account.snatchbot.me/channels/api/api/id380883/appakku-1/apssecretkey?user_id=${newID}`


const comm = async (api,input) => {
  try {
    const response = await fetch(api, {
      method: 'POST',
      body: JSON.stringify({ message: input })
    });
    const responseBack = await response.json();
    return responseBack.messages[0].message;
  } catch (e) {
    console.log(e);
  }
};

app.post('/bot', async (req,res)=>{
    const result = req.body;
    try {
        const user = await User.findOne({phonenum:phoneNum});
        user.username = result.name;
        user.dob = result.date;
        user.gender = result.sex;
        user.address = result.location;
        user.preferences = result.preference;
        await user.save()

    } catch(e) {
        console.log(e)
        
        
    } 
    res.status(200).json({message:'good job'})


    
    
})
const fetchFromDB = async (input) =>{
    try {
        const regex = new RegExp(input, 'i');
        const resturants = await Resturant.find({'menu.name':regex});
        resturants.sort((a,b)=>a.distance - b.distance);
        return resturants;
        
    } catch(e) {
        
        console.log(e);
    }
    

}
app.post('/resturant', async (req,res)=>{
    const rest = req.body.message;
   try {
        const regex = new RegExp(rest, 'i');
        const orderegex = new RegExp(order,'i');
        const resturant = await Resturant.findOne({name:regex});
        resturantInfo = resturant;
        const menu = resturant.menu;
        const filteredMenu = menu.filter((item)=>item.name.match(orderegex))
        customerMenu = filteredMenu
        for await (const item of filteredMenu) {
            try {
             setTimeout( async ()=>{
               await sdk.sendMessageText({ typing_time: 0, to: phoneNum, body: `${item.name} : ${item.price}` });   
             },2000)
             

            } catch(e) {
                await sdk.sendMessageText({ typing_time: 0, to: phoneNum, body: `Error in comprehension, please type restart to try again...` });   
                console.log(e);
            }
        }
        
    } catch(e) {
        
        console.log(e);
    }
    res.status(200).json({message:'good job'})
})

const fetchPerson = async (num) => {
    try {
        const customer = await User.findOne({phonenum:num});
        return customer;
    } catch(e) {
        console.log(e)
    }
}

app.post('/update-location',async (req,res)=>{
    const newLocation = req.body.message;
    try {
        const user = await User.findOne({phonenum:phoneNum});
        user.address = newLocation;
        await user.save();
        console.log('Address updated...')
        
    } catch(e) {
        
        console.log(e);
    }
    res.status(200).json({message:'good job'})
})



app.post('/final', async (req,res)=>{
    try {
        const customer = await fetchPerson(phoneNum);
        let orderedFood=[];
        const foodItems = req.body.message;
        const foodArr = foodItems.split(',');
        foodArr.forEach((food,index)=>{
        const foodRegex = new RegExp(food,'gi')
        const dish = customerMenu.find((elem)=>elem.name.match(foodRegex));
        orderedFood.push(dish.name);
        totalPrice+=dish.price;
    })
        
        await sdk.sendMessageText({ typing_time: 0, to: phoneNum, body: `You have ordered ${orderedFood.join(', ')} from ${resturantInfo.name}. Your total comes to rupees ${totalPrice}.` });
        await sdk.sendMessageImage({media: 'https://i.postimg.cc/prBgc6NQ/Scan-to-Pay.png', to: phoneNum})
           .then(({ data }) => console.log(data))
           .catch(err => console.error(err));
        await sdk.sendMessageText({ typing_time: 0, to:`${resturantInfo.phonenum}`, body: `Customer Name: ${customer.username}\r\nCustomer Order: ${orderedFood.join(', ')}\r\nCustomer Address: ${customer.address}\r\nCustomer Contact number: ${customer.phonenum}` });   
        
        
    } catch(e) {
        
        console.log(e);
    }
    res.status(200).json({message:'Convo complete'})

})





app.post('/order', async (req,res)=>{
    try {
        order = req.body.extracted;
        const ans = await fetchFromDB(order);
        if(ans.length>0) {
          for(const rst of ans) {
            try {
             setTimeout(async ()=>{
               await sdk.sendMessageText({ typing_time: 0, to: phoneNum, body: rst.name });
             },2000)   
             

            } catch(e) {
                
                
                console.log(e);
            }
        }
        } else {
            await sdk.sendMessageText({ typing_time: 2, to: phoneNum, body: "No such item found. Type restart to order again..." });
        }
        
    } catch(e) {
        
        console.log(e);
    }
    res.status(200).json({message:'good job'})
})





app.post('/', async (req, res) => {
  console.log('received');
  const messages = req.body.messages;

  for (const message of messages) {
    if (!message.from_me) {
      phoneNum = message.chat_id.split('@')[0];

      
      const user = await User.findOne({ phonenum: phoneNum });

      if (user) {
        if (user.username !== 'ph' && isNewUser===false) {
          
         api = oldUserApi;
          
        } 

        try {
          const chat_name = message.from_name;
          const text = message.text.body;

          const response = await comm(api,text);
          await sdk.sendMessageText({ typing_time: 0, to: phoneNum, body: response });
          console.log('Message sent successfully');
        } catch (error) {
          console.error('Error sending message:', error);
        }
      } else {
        api = newUserApi;
        isNewUser = true;
        
        await User.create({
          phonenum: phoneNum,
          username: 'ph',
          dob: '20 oct 1987',
          gender: 'male',
          address: '123 sesame street',
          preferences: 'veg'
        });
        console.log('User created');

        try {
          const chat_name = message.from_name;
          const text = message.text.body;

          const response = await comm(api,text);
          await sdk.sendMessageText({ typing_time: 0, to: phoneNum, body: response });
          console.log('Message sent successfully');
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
    }
  }

  res.status(200).json({ status: 'success' });
});





            connection(process.env.DB)

app.listen(3000, () => {
console.log(`Server is running`);
});