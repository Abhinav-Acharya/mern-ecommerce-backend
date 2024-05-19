import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUpload = async (localPath: string) => {
  try {
    if (!localPath) return null;
    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });

    // console.log("File uploaded on cloudinary", response.url);
    fs.unlinkSync(localPath);
    return response;
  } catch (error) {
    fs.unlinkSync(localPath); //remove locally saved temporary file as upload operation failed
    return null;
  }
};

const cloudinaryDelete = async (cloudinaryUrl: string) => {
  const splitUrl = cloudinaryUrl.split("/");
  const photoId = splitUrl[splitUrl.length - 1].split(".")[0];

  try {
    const response = await cloudinary.uploader.destroy(photoId);
  } catch (error) {
    console.log(error);
  }
};

export { cloudinaryUpload, cloudinaryDelete };
