import dbConnect from "@/src/lib/dbConnect";
import UserModel from "../../model/User";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/src/helpers/sendVerificationEmail";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, email, password } = await request.json();

    // 1. Check if username is already used by a verified user
    const existingUserVerifiedByUsername = await UserModel.findOne({
      username,
      isVerified: true, // make sure this matches your schema
    });

    if (existingUserVerifiedByUsername) {
      return Response.json(
        {
          success: false,
          message: "Username is already taken",
        },
        { status: 400 }
      );
    }

    // 2. Check if email exists
    const existingUserByEmail = await UserModel.findOne({ email });

    // 3. Prepare common values
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyCodeExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    if (existingUserByEmail) {
      // 3a. If email is already verified, block registration
      if (existingUserByEmail.isVerified) {
        return Response.json(
          {
            success: false,
            message: "Email is already registered",
          },
          { status: 400 }
        );
      }

      // 3b. Email exists but not verified -> update existing user
      existingUserByEmail.username = username;
      existingUserByEmail.password = hashedPassword;
      existingUserByEmail.verifyCode = verifyCode;
      existingUserByEmail.verifyCodeExpire = verifyCodeExpiry;
      await existingUserByEmail.save();
    } else {
      // 3c. Email does not exist -> create new user
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry,
        isVerified: false,        // match your schema name
        isAcceptingMessages: true,
        messages: [],
      });

      await newUser.save();
    }

    // 4. Send verification email
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );

    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: emailResponse.message,
        },
        { status: 500 }
      );
    }

    // 5. Final success response
    return Response.json(
      {
        success: true,
        message: "User registered successfully. Verification email sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in sign-up route", error);
    return Response.json(
      {
        success: false,
        message: "Internal Server Error while sign-up",
      },
      { status: 500 }
    );
  }
}
