import dotenv from 'dotenv';

dotenv.config();



async function startConvo(input) {
  const url = 'https://models3.p.rapidapi.com/?model_id=27&prompt=Write%20prompt%20in%20body%20not%20here!';
const options = {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'X-RapidAPI-Key': 'a8a9e9c4c3mshe0ef4e4ee113ad7p1c9a4fjsned93ec320d25',
    'X-RapidAPI-Host': 'models3.p.rapidapi.com'
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'assistant',
        content: "BERT Bot: 👋 Hi there! What's your name? Please type it below. User: Aakash Khamaru BERT Bot: 🎉 Great, nice to meet you, Aakash! 🎉 User: 2002/10/17 BERT Bot: 📅 Next, could you please provide your date of birth in YYYY/MM/DD format? User: 2002/10/17 BERT Bot: 🏠 Finally, what's your address? Please include the city and country. User: latitude:49.1, longitude:87 BERT Bot: 🍽️ Now, what would you like to order? You can type in your choices, and I'll provide some popular recommendations. User: recommendations BERT Bot: 🌟 Great choices! Here are some popular recommendations based on what you've selected: 1️⃣ 🍔 Burger from Burger Palace 2️⃣ 🍕 Pizza from Pizza Heaven 3️⃣ 🌮 Tacos from Taco Town 4️⃣ 🍝 Pasta from Pasta Paradise 5️⃣ 🍣 Sushi from Sushi Delight BERT Bot: 📍 Lastly, let's find some restaurants near you. Could you please confirm your address one more time? User: burger BERT Bot: 🍴 Here's a list of restaurants near you: 1️⃣ Burger Palace 2️⃣ Burger King 3️⃣ Big Burger Joint 4️⃣ Patty's Burgers 5️⃣ The Burger Shack User: the burger shack BERT Bot: 🛒 Great choice! Here's a summary of your order: Name: Aakash Date of Birth: 2002/10/17 Address: Latitude: 49.1, Longitude: 87 Order: Burger from The Burger Shack BERT Bot: Is everything correct? Once confirmed, your order will be on its way! User: confirm BERT Bot: Your order has been confirmed! 🎉 🚚 Your delicious burger from The Burger Shack will be delivered to Latitude: 49.1, Longitude: 87 shortly. Thank you for using BERT Bot for your food order! If you need any more assistance, feel free to ask. Enjoy your meal! 🍔"
      },
      {
        role: 'user',
        content: input
      }
    ]
  })
};

try {
  const response = await fetch(url, options);
  const result = await response.json();
  console.log(result.content);
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
      role: "User:Hi .BERT Bot: 👋 Hi there! What's your name? Please type it below. User: Aakash Khamaru BERT Bot: 🎉 Great, nice to meet you, Aakash! 🎉 User: 2002/10/17 BERT Bot: 📅 Next, could you please provide your date of birth in YYYY/MM/DD format? User: 2002/10/17 BERT Bot: 🏠 Finally, what's your address? Please include the city and country. User: latitude:49.1, longitude:87 BERT Bot: 🍽️ Now, what would you like to order? You can type in your choices, and I'll provide some popular recommendations. User: recommendations BERT Bot: 🌟 Great choices! Here are some popular recommendations based on what you've selected: 1️⃣ 🍔 Burger from Burger Palace 2️⃣ 🍕 Pizza from Pizza Heaven 3️⃣ 🌮 Tacos from Taco Town 4️⃣ 🍝 Pasta from Pasta Paradise 5️⃣ 🍣 Sushi from Sushi Delight BERT Bot: 📍 Lastly, let's find some restaurants near you. Could you please confirm your address one more time? User: burger BERT Bot: 🍴 Here's a list of restaurants near you: 1️⃣ Burger Palace 2️⃣ Burger King 3️⃣ Big Burger Joint 4️⃣ Patty's Burgers 5️⃣ The Burger Shack User: the burger shack BERT Bot: 🛒 Great choice! Here's a summary of your order: Name: Aakash Date of Birth: 2002/10/17 Address: Latitude: 49.1, Longitude: 87 Order: Burger from The Burger Shack BERT Bot: Is everything correct? Once confirmed, your order will be on its way! User: confirm BERT Bot: Your order has been confirmed! 🎉 🚚 Your delicious burger from The Burger Shack will be delivered to Latitude: 49.1, Longitude: 87 shortly. Thank you for using BERT Bot for your food order! If you need any more assistance, feel free to ask. Enjoy your meal! 🍔",
      message: input
    })
  };


  try {
    const response = await fetch(url, options);
    const result = await response.json();
    console.log(result.response);
  } catch (error) {
    console.log(error);
  }
}


process.stdin.on('data',(data)=>{
  startNewConvo(data.toString().trim(),"52f57b74-d47a-4362-ad33-974eae5b6334")
})

