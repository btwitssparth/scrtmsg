import { NextAuthOptions } from "next-auth";
import   CredentialsProvider  from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/src/lib/dbConnect";
import UserModel from "@/src/app/model/User";
import { id } from "zod/locales";
import { email } from "zod";

export const authOptions: NextAuthOptions = {
    providers:[
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials:{
                email:{label:"Username",type:"text",placeholder:"Enter your username"},
                password:{label:"Password",type:"password",placeholder:"Enter your password"},

            },
            async authorize(credentials:any):Promise<any>{
                await dbConnect();
                try {
                   const user= await UserModel.findOne({
                        $or:[
                            {email:credentials.identifier.email},
                            {username:credentials.identifier}
                        ]
                    })
                    if(!user){
                        throw new Error("No user found with this email")
                    }
                    if(!user.isVerified){
                        throw new Error("Please verify your email to login")
                    }
                    const isPasswordCorrect=await bcrypt.compare(credentials.password,user.password)
                    if(!isPasswordCorrect){
                        throw new Error("Invalid credentials")  

                    }
                    else{
                        return user;
                    }

                } catch (error:any) {
                    throw new Error(error.message);
                }

            }
        })
    ],
    callbacks:{
        async session({session,token}){
            if(token){
                session.user._id=token._id;
                session.user.isVerified=token.isVerified;
                session.user.isAcceptingMessages=token.isAcceptingMessages;
                session.user.username=token.username;
            }
            return session;
        },
        async jwt({token,user}){
            if(user){
                token._id=user._id?.toString();
                token.isVerified=user.isVerified;
                token.isAcceptingMessages=user.isAcceptingMessages;
                token.username=user.username;
            }
            return token;
        }
    },
    pages:{
        signIn:"/sign-in",
    },
    session:{
        strategy:"jwt"
    },
    secret:process.env.NEXT_AUTH_SECRET,
};