import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { json, urlencoded } from 'express'
import axios from "axios";
import * as dotenvExt from 'dotenv-extended';
import { resolve } from 'path';

dotenvExt.load({
  defaults: resolve(__dirname, '../.env.defaults')
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const options = new DocumentBuilder()
    .setTitle("Bumblebee API")
    .setDescription("The Bumblebee API description endpoints")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  var allowOrigin = process.env.ALLOW_CORS
    ? process.env.ALLOW_CORS.split(",")
    : [];
  app.enableCors({
    origin: allowOrigin.length > 0 ? allowOrigin : "*",
  });
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("api", app, document);
  await app.listen(process.env.PORT || 4000);
  // app.useWebSocketAdapter(new WsAdapter(app));
  if (process.env.NODE_ENV === "PRODUCTION") {
    clearKernels();
  }
}

async function clearKernels() {
  const kernelAddress = process.env.KERNEL_ADDRESS.split(",");
  for (let kernelURL of kernelAddress) {
    try {
      const { data } = await axios.get(`http://${kernelURL}/api/kernels`);
      for (let kernel of data) {
        try {
          await axios.delete(`http://${kernelURL}/api/kernels/${kernel.id}`);
        } catch (error) {
          console.log("error deleting kernel", error);
        }
      }
    } catch (error) {
      console.log("error getting kernels from server", error);
    }
  }
}

bootstrap();
