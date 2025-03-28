import mongoose from "mongoose";
const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId, // one who is subscribing
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId, //one who is being subscribed
      ref: "User",
    },
    
  },
  { timestamps: true }
);
export const Subscription = mongoose.model("Subscription", subscriptionSchema);

/*

->  Users    a, b, c

-> channels  x,  y,   z

->  subscriber + channel = Document

a subscribed x so
                Document1 = {                                      
                  channel: a,
                  subscriber: x
                }
b subscribed x so   
                Document2 = {
                  channel: b,
                  subscriber : x
                }
c subscribed x so   
                Document3 = {
                  channel: c,
                  subscriber : x
                }

d subscribed y so   
                Document4 = {
                  channel: d,
                  subscriber : y
                }


how to count subcribers for channel x?
count documents that has channel x you will get subscribers
$lookup: {
        from: "subscriptions", //this model -> subscription.model.js
        localField: "_id",
        foreignField: "channel", //choose channel and count documents we will get subscribers
        as: "subscribers",
      },





how many channels did u subscribed?
select subscriber value ex: a then count doc's 
$lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber", //select subcriber value i.e moiz and its present in Document1 and Documents. so moiz subscribed 2 channels 
        as: "subscribedTo",
      },          
           




             

              
              


              now this khan says zulfiqarPharmacy should be subcribed too
              so:   
              
             

             

how many channels does moiz subscribed?
  
select subcriber value i.e moiz and its present in Document1 and Document5.
so moiz subscribed 2 channels 



for every subscribtion document will be created 

selecting chanel will make u find subscribers count (doesn't mattter that value is different in subscribers bcz we are counting documents) and vice versa
              










*/
