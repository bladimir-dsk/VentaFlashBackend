import { Controller, Post, Body, Req, Res, Get, Param, BadRequestException } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import getRawBody from 'raw-body';
import { EmpresaService } from 'src/empresa/empresa.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from 'src/common/enums/rol.enum';
import { RenovacionPagoDto } from './dto/create-renovacion.dto';
import { ApiBearerAuth } from '@nestjs/swagger';



 @ApiBearerAuth('jwt')
@Controller('pagos')
export class PagosController {
  private stripe: Stripe;

  constructor(private readonly pagosService: PagosService, private readonly empresaService: EmpresaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  @Auth([Role.EMPLEADO, Role.EMPRESA])
  @Get('verificar-vencimiento')
async verificarVencimientos(@ActiveUser() user: UserActiveInterface) {
  return this.pagosService.verificarVencimiento(user);
}

  @Post()
  async create(@Body() createPagoDto: { data: CreatePagoDto; userId: number, nombreEmpresa: string, rfcEmpresa: string }, @Res() res: Response) {
    const { data, userId, nombreEmpresa, rfcEmpresa } = createPagoDto;
    const result = await this.pagosService.create(data, userId, nombreEmpresa, rfcEmpresa);
    if (result.paid) {
      // Pago exitoso inmediato
      return res.redirect('https://siagrosis.onrender.com/login');
    } else {
      // Redirigir al usuario para completar el pago
      return res.redirect(result.paymentUrl);
    }
}

@Get('successfulPayment')
successfulPayment() {
  return 'Pago exitoso';
}

@Post('webhook')
async handleStripeWebhook(@Req() req: Request, @Res() res: Response) {
   const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    // 👇 usamos el rawBody que guardaste en main.ts
    event = this.stripe.webhooks.constructEvent(
      (req as any).rawBody,
      sig,
      endpointSecret,
    );
    console.log(`🔔 Webhook recibido - Tipo: ${event.type} | ID: ${event.id}`);
  } catch (err) {
    console.error('⚠️ Error en la verificación del webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'invoice.paid':
        const invoice = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaid(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaymentFailed(failedInvoice);
        break;

      case 'checkout.session.completed':
        console.log('ℹ️ Evento checkout.session.completed recibido pero no manejado');
        break;

      default:
        console.log(`🔹 Evento no manejado: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error grave al procesar webhook:', error);
    res.status(500).json({ error: 'Error interno al procesar webhook' });
  }
}

private async handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`✅ Factura pagada - ID: ${invoice.id}`);
  
  if (!invoice.metadata || !invoice.metadata.pagoId) {
    throw new Error('La factura no contiene metadata.pagoId');
  }

  const pagoId = Number(invoice.metadata.pagoId);
  
  // 1. Actualizar estado del pago
  await this.pagosService.updatePagoStatus(pagoId, true);
  console.log(`🔄 Pago ${pagoId} actualizado a pagado`);

  // 2. Manejar renovaciones
  if (invoice.metadata.tipo === 'renovacion' && 
      invoice.metadata.empresaId &&
      invoice.metadata.accion === 'actualizar-pago') {
      
    const empresaId = Number(invoice.metadata.empresaId);
    await this.pagosService.actualizarPagoEnEmpresa(empresaId, pagoId);
    console.log(`🏢 Empresa ${empresaId} actualizada con nuevo pago ${pagoId}`);
  }
 
  await this.enviarNotificacionPagoExitoso(pagoId);
}


private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`❌ Pago fallido - ID: ${invoice.id} | Intentos: ${invoice.attempt_count}`);
  
  if (invoice.metadata?.pagoId) {
    const pagoId = Number(invoice.metadata.pagoId);
    
    // 1. Opcional: Actualizar estado en tu sistema
    console.log(`⚠️ Pago fallido para factura asociada al pago ID: ${pagoId}`);
    
    // 2. Enviar notificación al usuario
    await this.enviarNotificacionPagoFallido(pagoId, invoice.hosted_invoice_url);
  }
}

private async enviarNotificacionPagoExitoso(pagoId: number) {
  // Implementar lógica para enviar email/notificación
  console.log(`📧 Notificación de pago exitoso enviada para pago ${pagoId}`);
}

private async enviarNotificacionPagoFallido(pagoId: number, invoiceUrl: string) {
  // Implementar lógica para enviar email/notificación con link para reintentar
  console.log(`📧 Notificación de pago fallido enviada para pago ${pagoId} | URL: ${invoiceUrl}`);
}

@Auth(Role.EMPRESA)
@Get('verificar')
async verificarVencimiento(@ActiveUser() user: UserActiveInterface) {
  return this.pagosService.verificarYRenovarPago(user);
}


@Auth(Role.EMPRESA)
@Post('renovar')
async renovarPago(
    @ActiveUser() user: UserActiveInterface,
    @Body() renovacionDto: RenovacionPagoDto
) {
  
    return this.pagosService.verificarYRenovarPago(user, renovacionDto);
}


@Get(':id/estado')
async verificarEstadoPago(@Param('id') id: string) {
  const pago = await this.pagosService.getPago(Number(id));
  
  if (!pago.stripe_invoice_id) {
    throw new BadRequestException('Este pago no tiene factura asociada');
  }

  const invoice = await this.stripe.invoices.retrieve(pago.stripe_invoice_id);
  
  return {
    estado: pago.estado ? 'pagado' : 'pendiente',
    invoiceStatus: invoice.status,
    paymentStatus: invoice.status,
    invoiceUrl: invoice.hosted_invoice_url,
    pdfUrl: invoice.invoice_pdf
  };
}

@Get(':id/factura-stripe')
async getFacturaStripe(@Param('id') id: string, @Res() res: Response) {
  const pago = await this.pagosService.getPago(Number(id));
  
  if (!pago.stripe_invoice_id) {
    throw new BadRequestException('Este pago no tiene factura Stripe asociada');
  }
  
  const invoice = await this.stripe.invoices.retrieve(pago.stripe_invoice_id);
  
  // Redirigir directamente al PDF de la factura
  return res.redirect(invoice.invoice_pdf);
}

}