const fs = require('fs')

module.exports = (on, config) => {
  on('after:screenshot', (details) => {
      console.log({details});
      return details;

      // const fileName = details.specName +".1png"; // This fails
      // console.log(fileName);
      // //const fileName = "test.png"; // This works
      // const newPath = "cypress/mochareports/screenshots/"+ fileName;
      // console.log(newPath);
      return new Promise((resolve, reject) => {
        // resolve(true);
        // fs.rename(details.path, newPath, (err) => {
        //     if (err) return reject(err)

        //     // because we renamed and moved the image, resolve with the new path
        //     // so it is accurate in the test results
        //     resolve({ path: newPath })
        // })
      })


  })
}
