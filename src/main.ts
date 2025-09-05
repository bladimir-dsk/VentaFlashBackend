import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import moment from 'moment-timezone';
import { setupSwagger } from './configs/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar el prefijo global para todas las rutas
  app.setGlobalPrefix('api/v1');
 // Configurar la zona horaria para toda la aplicación
 process.env.TZ = 'America/Mexico_City';
 moment.tz.setDefault('America/Mexico_City');
  // Configurar el manejo del cuerpo de las solicitudes
  app.use(
    express.json({
      verify: (req: any, res, buf) => {
        if (req.headers['stripe-signature']) {
          req.rawBody = buf.toString();
        }
      },
    }),
  );

  // Configurar el ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Eliminar propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanzar un error si hay propiedades no definidas
      transform: true, // Transformar automáticamente los tipos de datos
    }),
  );

  // Habilitar CORS
  app.enableCors();

   // Servir archivos estáticos desde la carpeta /uploads
   app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

    // Servir archivos estáticos
  app.use('/facturas', express.static(join(__dirname, '..', 'facturas')));

  setupSwagger(app)
  // Iniciar la aplicación
  await app.listen(parseInt(process.env.PORT || '3000' ));
}
bootstrap();