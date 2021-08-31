const { Telegraf } = require("telegraf");
const { token } = require("./config.json");

var mysql = require("mysql");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const WizardScene = require("telegraf/scenes/wizard");
const axios = require("axios");

function validateEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}



/*
hashmap <entry> 
user id  , database status : true /false

when node index.js 
    fetch db;
    add to hash map localy O(1)
    when new client comes verifies with hash not db hence reduces db interaction 


*/

const hashmap = new Map();



if (hashmap.size == 0) {

  let res = axios.get('http://127.0.0.1:3000/data')
        .then((res) => {
          console.log(res.data);
          if (res.data[0] != undefined) {
            for (r in res.data) {
              hashmap.set(res.data[r].client_id);
            }
          }
          //console.log(hashmap)
          
        })
        .catch((error) => {
          console.error(error);
        });

 
}

const superWizard = new WizardScene(
  "name-email-wizard",
  (ctx) => {
    if (hashmap.has(ctx.message.from.id)) {
      ctx.reply("You are alreday registered", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "HyperSign", url: "https://wallet.hypersign.id" }],
          ],
        },
      });
      return ctx.scene.leave();
    }
    hashmap.set(ctx.message.from.id);

    ctx.reply(`Hi ${ctx.message.from.first_name} \nWhat's your full name?`);
    ctx.wizard.state.data = {};
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.data.name = ctx.message.text;
    ctx.reply("Enter your Email");
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.data.email = ctx.message.text;

    
        
    if (!validateEmail(ctx.wizard.state.data.email)) {
      hashmap.delete(ctx.message.from.id);
      ctx.reply("Try again with your valid email using command /setcreds");
    } else {
      ctx.reply(`Your name is ${ctx.wizard.state.data.name}`);
      ctx.reply(`Your email is ${ctx.wizard.state.data.email}`);
      var id = ctx.message.from.id;
      var name = ctx.wizard.state.data.name;
      var email = ctx.wizard.state.data.email;
      var stats = true;
     //var values = [[id, name, email, stats]];
      
      let res = axios.post('http://127.0.0.1:3000/data',{client_id:id,name:name,email:email,stats:stats})
        .then((res) => {
          console.log(`statusCode: ${res.status}`);
          
        })
        .catch((error) => {
          console.error(error);
        });
              
      ctx.reply("You are Registered , Clicking on the button", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "HyperSign", url: "https://wallet.hypersign.id" }],
          ],
        },
      });

      console.log(id, name, stats, email);
    }
    
    
    return ctx.scene.leave();
  }
);
const stage = new Stage([superWizard], { default: "name-email-wizard" });

const Eagle = new Telegraf(token, { polling: true });

Eagle.use(session());
Eagle.use(stage.middleware());
Eagle.command("setcreds", (ctx) => {
  ctx.scene.enter("name-email-wizard");
});

Eagle.start((ctx) => {
  console.log("started");
  ctx.scene.enter("name-email-wizard");
});

/*Eagle.on('message', (ctx) => {
  // Explicit usage
  console.log(ctx.message.from.id);
  ctx.telegram.sendMessage(
    ctx.message.chat.id,
    `Hello ${ctx.message.from.first_name}\nPlease Enter Your Full Name  by using command`
  );

  //ctx.reply(`Hello ${ctx.message.from.first_name}`);
});*/

Eagle.launch();
//process.once('SIGINT', () => Eagle.stop('SIGINT'))
//process.once('SIGTERM', () => Eagle.stop('SIGTERM'))
