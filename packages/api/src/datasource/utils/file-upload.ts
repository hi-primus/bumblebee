import { extname } from "path";

export const editFileName = (req, file, callback) => {
  const fileExtName = extname(file.originalname);
  callback(null, `${req.params.fileName}${fileExtName}`);
};


export const fileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(csv|xml|json|xlsx|xltx|xltm|avro|parquet|orc|zip|hdf5|txt)$/)) {
    req.fileValidationError = "File format not supported";
    return callback(null, false, req.fileValidationError);
  }
  callback(null, true);
};
