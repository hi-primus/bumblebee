export const editFileName = (req, file, callback) => {
  callback(null, `${req.params.fileName}`);
};
