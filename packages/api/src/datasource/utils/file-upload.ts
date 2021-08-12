import { extname } from "path";

export const editFileName = (req, file, callback) => {
  const fileExtName = extname(file.originalname);
  callback(null, `${req.params.fileName}${fileExtName}`);
};


export const fileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(csv)$/)) {
    req.fileValidationError = "Only csv files are allowed!";
    return callback(null, false, req.fileValidationError);
  }
  callback(null, true);
};
