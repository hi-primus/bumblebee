import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import fs = require("fs");

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("/addons")
  getListFolders(@Res() res) {
    fs.readdir(`src/../assets/addons/`, (err, files) => {
      if (err) {
        res.send(err);
      } else {
        const folders = files.filter(file => fs.lstatSync(`src/../assets/addons/${file}`).isDirectory());
        res.send(folders);
      }
    });
  }

  @Get("/addons/:addon/:filename")
  getLocalFiles(@Param("addon") addon: string, @Param("filename") filename: string, @Res() res) {
    const buffer = fs.readFileSync(`src/../assets/addons/${addon}/${filename}`);
    res.set({
      "Content-Type": `application/${
        filename.split(".")[filename.split(".").length - 1]
      }`,
      "Content-Disposition": `attachment; ${filename}`,
      "Content-Length": buffer.length,
    });

    res.end(buffer);
  }
}
