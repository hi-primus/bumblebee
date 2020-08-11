import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
// import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const options = new DocumentBuilder()
		.setTitle('Bumblebee API')
		.setDescription('The Bumblebee API description endpoints')
		.setVersion('0.1.0')
		.build();
	app.enableCors({
		origin: [
			'http://localhost:3000',
			'https://www.hi-bumblebee.com',
			'https://app.hi-bumblebee.com',
		],
	});

	const document = SwaggerModule.createDocument(app, options);
	SwaggerModule.setup('api', app, document);
	await app.listen(process.env.PORT || 4000);
	// app.useWebSocketAdapter(new WsAdapter(app));
}
bootstrap();
