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
  ) {
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

    try {
      const invoice = await this.stripe.invoices.create({
        customer: customer.id,
        collection_method: 'charge_automatically',
        auto_advance: true,
        metadata: {
          pagoId: pagoGuardado.id_pago.toString(),
          empresa: nombreEmpresa,
          rfcEmpresa: rfcEmpresa
        },
        custom_fields: [
          {
            name: 'RFC',
            value: rfcEmpresa
          }
        ]
      });
      await this.stripe.invoiceItems.create({
        customer: customer.id,
        invoice: invoice.id,
        amount: planVigencia.precio * 100,
        currency: 'mxn',
        description: `Suscripción ${planVigencia.nb_plan_vigencia} - ${planVigencia.duracion} días`,
      });


      const finalInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id);


      pagoGuardado.stripe_invoice_id = finalInvoice.id;
      await this.pagoRepository.save(pagoGuardado);

      if (finalInvoice.status === 'paid') {

        await this.updatePagoStatus(pagoGuardado.id_pago, true);
        return {
          success: true,
          paid: true,
          invoiceUrl: finalInvoice.hosted_invoice_url,
          id: pagoGuardado.id_pago
        };
      } else {

        return {
          success: true,
          paid: false,
          paymentUrl: finalInvoice.hosted_invoice_url,
          id: pagoGuardado.id_pago
        };
      }
    } catch (error) {
      console.error('Error al crear factura Stripe:', error);
      throw new BadRequestException('Error al generar la factura de pago');
    }
  }

  async updatePagoStatus(pagoId: number, estado: boolean) {
    const pago = await this.pagoRepository.findOne({ where: { id_pago: pagoId } });

    if (!pago) {
      throw new BadRequestException('Pago no encontrado');
    }

    pago.estado = estado;
    await this.pagoRepository.save(pago);

    if (estado) {
      await this.empresaService.guardarEmpresaDespuesDePago(pagoId);
    }
  }

  async guardarEmpresaDespuesDePago(pagoId: number) {

    const pago = await this.pagoRepository.findOne({
      where: { id_pago: pagoId },
      relations: ['empresa'],
    });

    if (!pago) {
      throw new BadRequestException('Pago no encontrado');
    }

    if (!pago.empresa) {
      throw new BadRequestException('Empresa no encontrada en el pago');
    }


    const empresa = this.empresaRepository.create({
      ...pago.empresa,
      Pago: { id_pago: pagoId },
    });

    return await this.empresaRepository.save(empresa);
  }


  async verificarYRenovarPago(user: UserActiveInterface, renovacionDto?: RenovacionPagoDto) {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: user.id_empresa },
      relations: ['Pago', 'Pago.planVigencia', 'Pago.usuario']
    });

    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }

    if (!empresa.Pago) {
      throw new BadRequestException('No se encontró pago para esta empresa');
    }

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

    const nuevoPago = this.pagoRepository.create({
      monto: planVigencia.precio,
      fecha_pago: new Date(),
      estado: false,
      nombre_empresa: empresa.Pago.nombre_empresa,
      rfc_empresa: empresa.Pago.rfc_empresa,
      planVigencia,
      usuario: empresa.Pago.usuario,
      fecha_expiracion: new Date(new Date().setDate(new Date().getDate() + planVigencia.duracion)),
      es_renovacion: true,
      pago_anterior: empresa.Pago,
      empresa: empresa
    });

    const pagoGuardado = await this.pagoRepository.save(nuevoPago);

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
          accion: 'actualizar-pago'
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

      const empresa = await this.empresaRepository.findOne({
        where: { id_empresa: user.id_empresa },
        relations: ['Pago']
      });

      if (!empresa) {
        throw new BadRequestException('Empresa no encontrada');
      }

      if (!empresa.Pago) {
        throw new BadRequestException('No se encontró pago para esta empresa');
      }

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
    const pago = await this.pagoRepository.findOne({
      where: { id_pago: nuevoPagoId, estado: true }
    });

    if (!pago) {
      throw new BadRequestException('Pago no confirmado');
    }

    empresa.Pago = pago;
    await this.empresaRepository.save(empresa);

    console.log(`🔄 Empresa ${empresaId} actualizada con nuevo pago ${nuevoPagoId}`);
  }

  async actualizarPagoEnEmpresaExistente(empresaId: number, nuevoPagoId: number) {

    const pago = await this.pagoRepository.findOne({
      where: { id_pago: nuevoPagoId, estado: true }
    });

    if (!pago) {
      throw new BadRequestException('Pago no encontrado o no confirmado');
    }
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: empresaId }
    });

    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }


    empresa.Pago = { id_pago: nuevoPagoId } as any;
    await this.empresaRepository.save(empresa);
    pago.empresa = empresa;
    await this.pagoRepository.save(pago);
  }

  async actualizarEmpresaConNuevoPago(empresaId: number, nuevoPagoId: number) {
    const empresa = await this.empresaRepository.findOne({
      where: { id_empresa: empresaId },
      relations: ['Pago']
    });

    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
    const pago = await this.pagoRepository.findOne({
      where: { id_pago: nuevoPagoId, estado: true }
    });

    if (!pago) {
      throw new BadRequestException('Pago no encontrado o no confirmado');
    }

    empresa.Pago = pago;
    await this.empresaRepository.save(empresa);
    console.log(`🔄 Empresa ${empresaId} actualizada con pago ${nuevoPagoId}`);
  }


  async getPago(id: number) {
    const pago = await this.pagoRepository.findOne({ where: { id_pago: id } });
    if (!pago) {
      throw new BadRequestException('Pago no encontrado');
    }
    return pago;
  }


}