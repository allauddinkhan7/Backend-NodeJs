import multer from "multer";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); //null is for errors and "/tmp/my-uploads/" is the path | destination where the file will be stored
  },
  filename: function (req, file, cb) { 
      cb(null, file.originalname);
    },
});
export const upload = multer({ storage }); 

 //ASCII stands for American Standard Code for Information Interchange UTF-8 stands for Unicode Transformation Format-8