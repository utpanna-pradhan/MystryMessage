import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import { send } from "process";

export async function POST(request:Request){
    await dbConnect();

    try{
        const {username,email,password} =await request.json()
       const existingUserVerifiedByUsername = await UserModel.findOne({username,isVerfied:true})
       if(existingUserVerifiedByUsername){
        return Response.json({
            sucess:false,
            message:"Username is already taken"
        },
    {
        status:400

    })
       }
       const existingUserByEmail = await UserModel.findOne({email})
       const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
       if(existingUserByEmail){
        if(existingUserByEmail.isVerfied){
            return Response.json({
                sucess:false,
                message:"User already exist with this email"
            },
        {status:400})
       }else{
        const hashedPassword = await bcrypt.hash(password,10)
        existingUserByEmail.password = hashedPassword;
        existingUserByEmail.verifyCode = verifyCode;
        existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000); // 1 hour from now
        await existingUserByEmail.save();

        
       }}
       
       else{
        const hashedPassword  = await bcrypt.hash(password,10)
        const expiryDate = new Date();
       expiryDate.setHours(expiryDate.getHours() + 1)

      const newUser = new UserModel({
         username,
            email,
           hashedPassword,
           verifyCode,
           expiryDate,
            isVerfied:false,
            isAcceptingMessage:true,
            messages:[]
       })
       await newUser.save();
       }

       //send verification email
       const emailResponse = await sendVerificationEmail(email,username,verifyCode);
       if(!emailResponse.success){
        return Response.json({
            success:false,
            message:emailResponse.message || "Error sending verification email"
        },
        {
            status:500
        })
       }
       return Response.json({
        success:true,
        message:"User registered successfully. Please check your email for verification code"
       },
       {
        status:201
       })

    }
    catch(error){
      console.error("Error registrating user",error);  
      return Response.json({
        sucsess:false,
        message:"Error registering user"
      },
    {
        status:500
    })
    }
}