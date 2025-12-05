import mongoose,{Schema,Document} from "mongoose";

export interface Message extends Document {
    content: string;
    CreatedAt: Date;
    
}

const MessageSchema:Schema<Message>= new Schema({
    content:{type:String,required:true},
    CreatedAt:{type:Date,default:Date.now}

});

export interface User extends Document {
    username: string;
    password: string;
    email: string;
    verifyCode: string;
    verifyCodeExpire: Date;
    isVerified?: boolean;
    isAcceptingMessages: boolean;
    messages: Message[];
  
}

const UserSchema:Schema<User>= new Schema({
    username:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    email:{type:String,required:true,unique:true,match:[/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,"Please fill a valid email address"]},
    verifyCode:{type:String,required:true},
    verifyCodeExpire:{type:Date,required:true},
    isAcceptingMessages:{type:Boolean,default:true},
    isVerified:{type:Boolean,default:false},
    messages:[MessageSchema]
});

const UserModel=(mongoose.models.User as mongoose.Model<User>)||mongoose.model<User>("User",UserSchema);

export default UserModel;