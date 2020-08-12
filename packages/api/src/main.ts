import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import axios from "axios";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const options = new DocumentBuilder()
    .setTitle("Bumblebee API")
    .setDescription("The Bumblebee API description endpoints")
    .setVersion("0.1.0")
    .build();
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "https://www.hi-bumblebee.com",
      "https://app.hi-bumblebee.com",
    ],
  });

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("api", app, document);
  await app.listen(process.env.PORT || 4000);
  // app.useWebSocketAdapter(new WsAdapter(app));
  clearKernels();
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
