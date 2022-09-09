const zulipInit = require("zulip-js");
const { htmlToText } = require('html-to-text');
var fs = require('fs');

function DeleteFile(date_time){
    //console.log(date_time);
    fs.unlink(date_time, function (err) {
        if (err) return 0 ;
      //  console.log('File deleted!');
      });
}

async function sends(message , sender_id , type , receiver_id , topic = null ){
    
    const config_id = await { zuliprc: sender_id+".txt"  }; /* the document will be in the form of the sender id*/
    const client = await zulipInit(config_id);
    //console.log(client);
    let params = {} ; 
    if(type == 'private' )
    {
        params = {
            to: [receiver_id],
            type: "private",
            content: message ,
        };
     console.log(await client.messages.send(params));

    }else {
        params = {
            to: receiver_id  ,
            type: "stream",
            topic: topic,
            content: message,
        };
     console.log(await client.messages.send(params));
    }
}

function fileCreator(emailId,Key,userId, urls){

    fs.writeFile(userId+'.txt','[api]\nemail='+emailId+'\nkey='+Key +'\nsite=https://'+urls +'.zulipchat.com',
             function (err) {
        if (err) throw err;
     //   console.log('Saved!');
      });
}

function pattern_register_bot(message_list) {
    message = extractContent(message_list.content) ;
    value = "/register_bot " 
    if( message.length >= value.length){
        var pos = 1 ;
        var message_true = "" ; 
        for( var i = 0 ; i < message.length ; i++ ){
            if(i < value.length ){
                if(value[i] != message[i]){
                    pos = 0 ;
                    break  ;
                }
            }
            else{ 
                message_true = message_true  + message[i] ; 
            }
        }
        if(pos ==0 )
            return 0 ; 
        //console.log(message_true ) ; 
        fileCreator(message_list.sender_email , message_true,  message_list.sender_id , message_list.sender_realm_str) ; 
        return 1 ; 
        
    }
    return 0 ; 
}

async  function ReadJsonFile(fileName){
    //console.log(fileName);
    fs.readFile(fileName, function(err, data){
            if(err) return 0  ;
            var fileData=JSON.parse(data);
            var len=fileData.length;
            //console.log(fileData) ; 

            for(var i=0;i<len;i++){
                console.log("sending") ; 
                sends(fileData[i].message , fileData[i].sender_id , fileData[i].type , fileData[i].receiver_id , fileData[i].topic ) ;
            }
      });
}

function findJson(message,sender_id,type,receiver_id,topic,date_time){
  
    var text={sender_id:sender_id,receiver_id:receiver_id,message:message,type:type,topic:topic};
    var prevData=[];
    
    fs.readFile(date_time+'.json', function(err, data) {
        if(!err){
            prevData.push(JSON.parse(data)[0]);
        }
        prevData.push(text);
        
        fs.writeFile(date_time+'.json',JSON.stringify(prevData), function (err) {
            if (err) throw err ;
        //  console.log('Saved!');
      });
      
    });
}

function current_time(){
    var current =  new Date();
        // dd-mm-yyyy-mm-hh
        var dd = current.getDate() ; 
        var mm = current.getMonth() + 1 ; 
        var yyyy = current.getFullYear() ; 
        var hh = current.getHours() ; 
        var mi  = current.getMinutes() ; 
        
        var location =  "" ;

        if( (dd+"").length == 1){
            location = location + "0" +dd +'-'; 
        }
        else {
            location = location +dd +'-' ; 
        }

        if( (mm + "" ).length == 1){
            location = location + "0" +mm +'-'; 
        }
        else {
            location = location +mm +'-' ; 
        }
        
        location = location + yyyy +'-' ;
        
        if( (hh+ "").length == 1){
            location = location + "0" +hh +'-'; 
        }
        else{
            location = location +hh +'-' ; 
        }
        if( (mi +"").length == 1){
            location = location + "0" +mi; 
        }
        else {
            location = location +mi ; 
        }

        return location ; 
}

function time_checker() {
          
    location = current_time() +".json"   ;
    //console.log(location ) ;
    ReadJsonFile(location ) ;
    DeleteFile(location ) ;
}

(async () => {
    const client = await zulipInit(config_bot);
    //console.log(client);
    
    // var list_emails = await client.users.retrieve() ;
    // var list_email = list_emails.members ;
    //console.log(list_emails ) ;

    //console.log(list_email ) ;

    // check for the message 
    var sets = new Set() ; 
    var prevMsgData;

    while(1){

        const readParams =  await {
            anchor: "newest",
            num_before: 1,
            num_after: 0,
            narrow: [
                {operator: "sender", operand: "user511348@prjtesting.zulipchat.com"/*User-email used for searching and sending */ }, // get all users 
                {
                    "operator": "search",
                    "operand": "message_schedule "
                }
            ],
        };

        const reg_parameter =  await {
            anchor: "newest",
            num_before: 1,
            num_after: 0,
            narrow: [
                {operator: "sender", operand: "user511348@prjtesting.zulipchat.com"   }],
        };
        
        prevMsgData=await client.messages.retrieve(readParams);
        registration =await client.messages.retrieve(reg_parameter);
        console.log("Checking...");
        for( var i=0;i<registration.messages.length;i++){
                pattern_register_bot(registration.messages[i]) ;
        }
            
        //pattern_schedule(prevMsgData.messages[0])  ;

        for(var i = 0 ; i < prevMsgData.messages.length  ; i++ ){
            if( sets.has(prevMsgData.messages[i].id)  )
                break  ; 
            sets.add(prevMsgData.messages[i].id) ;
            //console.log(prevMsgData.messages[i]) ;
            pattern_schedule(prevMsgData.messages[i]) ; 
        }
        
        time_checker() ;
    }   
})();