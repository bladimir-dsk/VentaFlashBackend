import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { PlanVigencia } from '../plan-vigencia/entities/plan-vigencia.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { EmpresaService } from 'src/empresa/empresa.service';
import { User } from 'src/users/entities/user.entity';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { RenovacionPagoDto } from './dto/create-renovacion.dto';

@Injectable()
export class PagosService {
  public stripe: Stripe;

  constructor(
    @Inject(forwardRef(() => EmpresaService)) // 👈 Solución a dependencia circular
    private readonly empresaService: EmpresaService,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(PlanVigencia)
    private readonly planVigenciaRepository: Repository<PlanVigencia>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ){
    // Inicializamos la API de Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  async create(createPagoDto: CreatePagoDto, userId: number, nombreEmpresa: string, rfcEmpresa: string) {
    const { id_planVigencia } = createPagoDto;
  
    const planVigencia = await this.planVigenciaRepository.findOne({
      where: { id_plan_vigencia: id_planVigencia },
    });
  
    if (!planVigencia) {
      throw new BadRequestException('El plan de vigencia no existe');
    }
  
    const usuario = await this.userRepository.findOne({
      where: { id: userId },
    });
  
    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }
  
    const fechaActual = new Date();
    const fechaExpiracion = new Date(fechaActual);
    fechaExpiracion.setDate(fechaActual.getDate() + planVigencia.duracion);

    // Crear el pago en la base de datos
    const pago = this.pagoRepository.create({
      monto: planVigencia.precio,
      fecha_pago: new Date(),
      estado: false,
      nombre_empresa: nombreEmpresa, 
      rfc_empresa: rfcEmpresa,
      planVigencia,
      usuario,
      fecha_expiracion: fechaExpiracion,
      es_renovacion: false,
    });
  
    const pagoGuardado = await this.pagoRepository.save(pago);
    
    // 1. Crear o buscar cliente en Stripe
    let customer: Stripe.Customer;
    try {
      const customerSearch = await this.stripe.customers.search({
        query: `email:"${usuario.email}"`,
      });
      
      customer = customerSearch.data.length > 0 
        ? customerSearch.data[0]
        : await this.stripe.customers.create({
            email: usuario.email,
            name: nombreEmpresa,
            metadata: {
              userId: usuario.id.toString(),
              empresa: nombreEmpresa
            },
            preferred_locales: ['es'],
          });
    } catch (error) {
      console.error('Error al crear/buscar cliente en Stripe:', error);
      throw new BadRequestException('Error al procesar el pago');
    }

    // 2. Crear factura con modo de pago inmediato
    try {
      const invoice = await this.stripe.invoices.create({
        customer: customer.id,
        collection_method: 'charge_automatically', // Pago automático
        auto_advance: true,
        metadata: {
          pagoId: pagoGuardado.id_pago.toString(),
          empresa: nombreEmpresa,
          rfcEmpresa: rfcEmpresa
        },
        custom_fields: [
          {
            name: 'RFC',
            value: rfcEmpresa // Puedes obtenerlo de la empresa si está disponible
          }
        ]
      });

      // 3. Añadir ítem a la factura
      await this.stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: planVigencia.precio * 100,
        currency: 'mxn',
        description: `Suscripción ${planVigencia.nb_plan_vigencia} - ${planVigencia.duracion} días`,
      });

      // 4. Finalizar la factura (esto intentará cobrar inmediatamente)
      const finalInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id);
      
      // 5. Guardar el ID de la factura
      pagoGuardado.stripe_invoice_id = finalInvoice.id;
      await this.pagoRepository.save(pagoGuardado);

      // 6. Verificar el estado del pago
      if (finalInvoice.status === 'paid') {
        // Si el pago fue exitoso inmediatamente
        await this.updatePagoStatus(pagoGuardado.id_pago, true);
        return { 
          success: true,
          paid: true,
          invoiceUrl: finalInvoice.hosted_invoice_url,
          id: pagoGuardado.id_pago
        };
      } else {
        // Si requiere acción del usuario (como autenticación 3D Secure)
        return {
          success: true,
          paid: false,
          paymentUrl: finalInvoice.hosted_invoice_url, // URL para completar el pago
          id: pagoGuardado.id_pago
        };
      }
    } catch (error) {
      console.error('Error al crear factura Stripe:', error);
      throw new BadRequestException('Error al generar la factura de pago');
    }
  }

  // Método para actualizar el estado del pago
  async updatePagoStatus(pagoId: number, estado: boolean) {
    const pago = await this.pagoRepository.findOne({ where: { id_pago: pagoId } });
  
    if (!pago) {
      throw new BadRequestException('Pago no encontrado');
    }
  
    pago.estado = estado;
    await this.pagoRepository.save(pago);
  
    // si el pago fue exitoso, guardar la empresa en la db que se quedo en memoria
    if (estado) {
      await this.empresaService.guardarEmpresaDespuesDePago(pagoId);
    }
  }
  
  async guardarEmpresaDespuesDePago(pagoId: number) {
    // 1️⃣ Obtener el pago
    const pago = await this.pagoRepository.findOne({
      where: { id_pago: pagoId },
      relations: ['empresa'], // Asegúrate de que la relación esté configurada
    });
  
    if (!pago) {
      throw new BadRequestException('Pago no encontrado');
    }
  
    // 2️⃣ Verificar que la empresa esté asociada al pago
    if (!pago.empresa) {
      throw new BadRequestException('Empresa no encontrada en el pago');
    }
  
    // 3️⃣ Guardar la empresa en la base de datos
    const empresa = this.empresaRepository.create({
      ...pago.empresa, // Usar los datos de la empresa en memoria
      Pago: { id_pago: pagoId }, // Asociar el pago completado
    });
  
    return await this.empresaRepository.save(empresa);
  }


  async verificarYRenovarPago(user: UserActiveInterface, renovacionDto?: RenovacionPagoDto) {
    // 1. Obtener la empresa del usuario con relaciones
    const empresa = await this.empresaRepository.findOne({
        where: { id_empresa: user.id_empresa },
        relations: ['Pago', 'Pago.planVigencia', 'Pago.usuario']
    });

    if (!empresa) {
        throw new BadRequestException('Empresa no encontrada');
    }

    // 2. Verificar si la empresa tiene un pago asociado
    if (!empresa.Pago) {
        throw new BadRequestException('No se encontró pago para esta empresa');
    }

    // 3. Verificar si el pago está vencido
    const estaVencido = empresa.Pago.isExpired();

    if (!estaVencido) {
        return { 
            vencido: false,
            mensaje: 'El pago está vigente',
            fecha_expiracion: empresa.Pago.fecha_expiracion,
            plan: empresa.Pago.planVigencia,
            id_empresa: empresa.id_empresa
        };
    }

    // 4. Determinar el plan a usar
    let planVigencia: PlanVigencia;
    
    if (renovacionDto?.id_planVigencia) {
        planVigencia = await this.planVigenciaRepository.findOne({
            where: { id_plan_vigencia: renovacionDto.id_planVigencia }
        });
        
        if (!planVigencia) {
            throw new BadRequestException('El plan seleccionado no existe');
        }
    } else {
        planVigencia = empresa.Pago.planVigencia;
    }

    // 5. Crear NUEVO registro de pago para el historial
    const nuevoPago = this.pagoRepository.create({
        monto: planVigencia.precio,
        fecha_pago: new Date(),
        estado: false, // Pendiente hasta confirmación
        nombre_empresa: empresa.Pago.nombre_empresa,
        rfc_empresa: empresa.Pago.rfc_empresa,
        planVigencia,
        usuario: empresa.Pago.usuario,
        fecha_expiracion: new Date(new Date().setDate(new Date().getDate() + planVigencia.duracion)),
        es_renovacion: true,
        pago_anterior: empresa.Pago,
        empresa: empresa // Relación con la empresa existente
    });

    const pagoGuardado = await this.pagoRepository.save(nuevoPago);

    // 6. NO actualizamos empresa.Pago aquí - solo en webhook cuando pago sea exitoso

    // 7. Crear factura de renovación en Stripe
    let customer: Stripe.Customer;
    try {
        const customerSearch = await this.stripe.customers.search({
            query: `email:"${empresa.Pago.usuario.email}"`,
        });
        
        customer = customerSearch.data.length > 0 
            ? customerSearch.data[0]
            : await this.stripe.customers.create({
                email: empresa.Pago.usuario.email,
                name: empresa.Pago.nombre_empresa,
                metadata: {
                    userId: empresa.Pago.usuario.id.toString(),
                    empresa: empresa.Pago.nombre_empresa,
                    rfcEmpresa: empresa.Pago.rfc_empresa
                },
                preferred_locales: ['es'],
            });
    } catch (error) {
        console.error('Error al crear/buscar cliente en Stripe:', error);
        throw new BadRequestException('Error al procesar la renovación');
    }

    try {
        const invoice = await this.stripe.invoices.create({
            customer: customer.id,
            collection_method: 'charge_automatically',
            auto_advance: true,
            metadata: {
                pagoId: pagoGuardado.id_pago.toString(),
                empresaId: empresa.id_empresa.toString(),
                tipo: 'renovacion',
                pagoAnteriorId: empresa.Pago.id_pago.toString(),
                accion: 'actualizar-pago' // Flag específico para renovaciones
            },
            custom_fields: [
                {
                    name: 'RFC',
                    value: empresa.rfc || 'XAXX010101000'
                }
            ],
            description: `Renovación de suscripción ${planVigencia.nb_plan_vigencia}`
        });

        await this.stripe.invoiceItems.create({
            customer: customer.id,
            invoice: invoice.id,
            amount: planVigencia.precio * 100,
            currency: 'mxn',
            description: `Renovación ${planVigencia.nb_plan_vigencia} - ${planVigencia.duracion} días`,
        });

        const finalInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id);
        
        pagoGuardado.stripe_invoice_id = finalInvoice.id;
        await this.pagoRepository.save(pagoGuardado);

        if (finalInvoice.status === 'paid') {
            // Solo si el pago es exitoso inmediatamente actualizamos
            await this.actualizarPagoEnEmpresa(empresa.id_empresa, pagoGuardado.id_pago);
            return {
                vencido: true,
                renovado: true,
                paid: true,
                invoiceUrl: finalInvoice.hosted_invoice_url,
                id_pago: pagoGuardado.id_pago,
                fecha_expiracion: pagoGuardado.fecha_expiracion,
                plan: planVigencia,
                id_empresa: empresa.id_empresa
            };
        } else {
            return {
                vencido: true,
                renovado: false,
                paid: false,
                paymentUrl: finalInvoice.hosted_invoice_url,
                id_pago: pagoGuardado.id_pago,
                fecha_expiracion: pagoGuardado.fecha_expiracion,
                plan: planVigencia,
                id_empresa: empresa.id_empresa
            };
        }
    } catch (error) {
        console.error('Error al crear factura de renovación:', error);
        throw new BadRequestException('Error al generar la factura de renovación');
    }
}
async verificarVencimiento(user: UserActiveInterface) {
    try {
        // 1. Obtener la empresa del usuario con el pago
        const empresa = await this.empresaRepository.findOne({
            where: { id_empresa: user.id_empresa },
            relations: ['Pago']
        });

        if (!empresa) {
            throw new BadRequestException('Empresa no encontrada');
        }

        // 2. Verificar si la empresa tiene un pago asociado
        if (!empresa.Pago) {
            throw new BadRequestException('No se encontró pago para esta empresa');
        }

        // 3. Verificar si el pago está vencido (menor o igual a la fecha actual)
        const estaVencido = empresa.Pago.fecha_expiracion <= new Date();

        if (estaVencido) {
            return {
                mensaje: 'Ya venció su plan',
                estado: true,
                empresa
            };
        }

        return {
            mensaje: 'Plan vigente',
            estado: false,
            empresa
        };

    } catch (error) {
        console.error('Error al verificar vencimiento:', error);
        throw new BadRequestException('Error al verificar el estado del plan');
    }
}

 async actualizarPagoEnEmpresa(empresaId: number, nuevoPagoId: number) {
  const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: empresaId },
      relations: ['Pago']
  });

  if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
  }

  // Verificar que el pago existe y está confirmado
  const pago = await this.pagoRepository.findOne({
      where: { id_pago: nuevoPagoId, estado: true }
  });

  if (!pago) {
      throw new BadRequestException('Pago no confirmado');
  }

  // Actualizar solo la referencia al pago
  empresa.Pago = pago;
  await this.empresaRepository.save(empresa);
  
  console.log(`🔄 Empresa ${empresaId} actualizada con nuevo pago ${nuevoPagoId}`);
}

async actualizarPagoEnEmpresaExistente(empresaId: number, nuevoPagoId: number) {
  // 1. Verificar que el pago existe y está pagado
  const pago = await this.pagoRepository.findOne({
    where: { id_pago: nuevoPagoId, estado: true }
  });

  if (!pago) {
    throw new BadRequestException('Pago no encontrado o no confirmado');
  }

  // 2. Obtener empresa existente
  const empresa = await this.empresaRepository.findOne({
    where: { id_empresa: empresaId }
  });

  if (!empresa) {
    throw new BadRequestException('Empresa no encontrada');
  }

  // 3. Actualizar solo el ID de pago
  empresa.Pago = { id_pago: nuevoPagoId } as any;
  await this.empresaRepository.save(empresa);

  // 4. Actualizar relación en el pago
  pago.empresa = empresa;
  await this.pagoRepository.save(pago);
}
//  async actualizarEmpresaConNuevoPago(empresaId: number, nuevoPagoId: number) {
//     const empresa = await this.empresaRepository.findOne({
//         where: { id_empresa: empresaId },
//         relations: ['Pago']
//     });

//     if (!empresa) {
//         throw new BadRequestException('Empresa no encontrada');
//     }

//     empresa.Pago = { id_pago: nuevoPagoId } as any;
//     await this.empresaRepository.save(empresa);
//     console.log(`🔄 Empresa ${empresaId} actualizada con nuevo pago ${nuevoPagoId}`);
// }
async actualizarEmpresaConNuevoPago(empresaId: number, nuevoPagoId: number) {
  const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: empresaId },
      relations: ['Pago']
  });

  if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
  }

  // Verificar que el pago existe y está pagado
  const pago = await this.pagoRepository.findOne({
      where: { id_pago: nuevoPagoId, estado: true }
  });

  if (!pago) {
      throw new BadRequestException('Pago no encontrado o no confirmado');
  }

  // Actualizar la relación
  empresa.Pago = pago;
  await this.empresaRepository.save(empresa);
  console.log(`🔄 Empresa ${empresaId} actualizada con pago ${nuevoPagoId}`);
}

async generarFacturaStripe(pagoId: number): Promise<Stripe.Invoice> {
  const pago = await this.pagoRepository.findOne({
    where: { id_pago: pagoId },
    relations: ['usuario', 'planVigencia', 'empresa']
  });

  if (!pago) {
    throw new BadRequestException('Pago no encontrado');
  }

  try {
    // 1. Buscar o crear cliente en Stripe
    let customer: Stripe.Customer;
    const customerSearch = await this.stripe.customers.search({
      query: `email:"${pago.usuario.email}"`,
    });

    if (customerSearch.data.length > 0) {
      customer = customerSearch.data[0];
      console.log(`👤 Cliente existente encontrado: ${customer.id}`);
    } else {
      customer = await this.stripe.customers.create({
        email: pago.usuario.email,
        name: pago.nombre_empresa,
        metadata: {
          pagoId: pago.id_pago.toString(),
          userId: pago.usuario.id.toString()
        },
        preferred_locales: ['es'],
      });
      console.log(`👤 Nuevo cliente creado: ${customer.id}`);
    }

    // 2. Crear factura
    const invoice = await this.stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 0,
      auto_advance: true,
      metadata: {
        pagoId: pago.id_pago.toString(),
        empresa: pago.nombre_empresa,
        rfcEmpresa: pago.rfc_empresa
      },
      custom_fields: [
        {
          name: 'RFC',
          value: pago.empresa?.rfc || 'XAXX010101000'
        }
      ]
    });
    console.log(`📄 Factura creada: ${invoice.id}`);

    // 3. Añadir ítem a la factura
    await this.stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id,
      amount: pago.monto * 100,
      currency: 'mxn',
      description: `Suscripción ${pago.planVigencia.plan.nb_plan} - ${pago.planVigencia.duracion} días`,
    });
    console.log(`➕ Ítem añadido a factura ${invoice.id}`);

    // 4. Finalizar y enviar factura
    const finalInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id);
    const sentInvoice = await this.stripe.invoices.sendInvoice(finalInvoice.id);
    console.log(`📤 Factura enviada: ${sentInvoice.id}`);

    // 5. Actualizar pago en DB
    pago.stripe_invoice_id = sentInvoice.id;
    await this.pagoRepository.save(pago);
    console.log(`💾 Factura guardada en pago ${pago.id_pago}`);

    return sentInvoice;
  } catch (error) {
    console.error('❌ Error al generar factura Stripe:', error);
    throw new BadRequestException('Error al generar factura Stripe: ' + error.message);
  }
}

async generarFacturaSAT(pagoId: number) {
  const pago = await this.pagoRepository.findOne({
    where: { id_pago: pagoId },
    relations: ['usuario', 'planVigencia', 'empresa']
  });

  if (!pago) {
    throw new BadRequestException('Pago no encontrado');
  }

  // Aquí implementarías la generación del CFDI para el SAT
  // Esto normalmente requiere un PAC (Proveedor Autorizado de Certificación)
  // Ejemplo con un servicio ficticio:

  const facturaSAT = {
    fecha: new Date().toISOString(),
    folio: `FAC-${pago.id_pago}-${Date.now()}`,
    rfcEmisor: 'TURFC123456ABC', // Tu RFC como empresa
    rfcReceptor: pago.empresa?.rfc || 'XAXX010101000',
    subtotal: pago.monto,
    iva: pago.monto * 0.16,
    total: pago.monto * 1.16,
    concepto: `Suscripción ${pago.planVigencia.duracion} días`,
    metodoPago: 'Pago en una sola exhibición',
    formaPago: '03', // 03 = Transferencia electrónica
    moneda: 'MXN',
    tipoComprobante: 'I', // I = Ingreso
    lugarExpedicion: '78000', // Tu código postal
    certificado: null, // Certificado digital
    sello: null, // Sello digital
    cadenaOriginal: null, // Cadena original
    xml: null, // XML completo
    pdf: null // PDF generado
  };

  // Guardar la factura SAT en la base de datos
  pago.factura_sat = facturaSAT;
  await this.pagoRepository.save(pago);

  return facturaSAT;
}

async getPago(id: number) {
  const pago = await this.pagoRepository.findOne({ where: { id_pago: id } });
  if (!pago) {
    throw new BadRequestException('Pago no encontrado');
  }
  return pago;
}

  
}